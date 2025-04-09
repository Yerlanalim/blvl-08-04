import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Инициализация Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  // Начинаем отслеживание времени выполнения для логирования производительности
  const startTime = Date.now();
  
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // Верификация подписи вебхука Stripe
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // Создаем клиент Supabase
  const supabase = createRouteHandlerClient({ cookies });
  
  // Генерируем идентификатор для обработки и логирования
  const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  console.log(`[${webhookId}] Processing ${event.type} webhook event`);

  try {
    // Проверка на дублирование события для обеспечения идемпотентности
    if (await isDuplicateEvent(supabase, event.id)) {
      console.log(`[${webhookId}] Duplicate event ${event.id} detected, skipping processing`);
      return NextResponse.json({ success: true, message: 'Duplicate event, already processed' });
    }
    
    // Обработка различных событий от Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Убедимся, что у нас есть необходимые данные
        if (!session.client_reference_id || !session.subscription) {
          console.error(`[${webhookId}] Missing client_reference_id or subscription`);
          return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // Получаем детали подписки, чтобы узнать, какой тариф был оплачен
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        
        const userId = session.client_reference_id;
        const priceId = subscription.items.data[0].price.id;
        
        console.log(`[${webhookId}] Processing checkout completion for user ${userId} and price ${priceId}`);
        
        // Определяем, какие уровни должны быть разблокированы на основе тарифного плана
        const levelIds = await getLevelsToUnlock(supabase, priceId);
        console.log(`[${webhookId}] Levels to unlock: ${levelIds.join(', ')}`);
        
        // Сохраняем информацию о подписке в базе данных
        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            stripe_price_id: priceId,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'stripe_subscription_id' });
          
        if (subscriptionError) {
          console.error(`[${webhookId}] Error saving subscription:`, subscriptionError);
          return NextResponse.json({ error: 'Error saving subscription' }, { status: 500 });
        }
        
        // Разблокируем уровни для пользователя
        await unlockLevelsForUser(supabase, userId, levelIds, webhookId);
        
        // Добавляем запись в платежную историю
        await addPaymentRecord(supabase, userId, session, subscription, webhookId);
        
        break;
      }
      
      case 'invoice.payment_succeeded': {
        // Обработка успешной оплаты счета (для продления подписки)
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          console.log(`[${webhookId}] Processing invoice payment for subscription ${invoice.subscription}`);
          
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          
          // Получаем пользователя из базы данных по stripe_subscription_id
          const { data: subscriptionData, error: subscriptionQueryError } = await supabase
            .from('user_subscriptions')
            .select('user_id, stripe_price_id')
            .eq('stripe_subscription_id', subscription.id)
            .single();
            
          if (subscriptionQueryError || !subscriptionData) {
            console.error(`[${webhookId}] Error finding subscription or user:`, subscriptionQueryError);
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
          }
          
          // Обновляем статус подписки в базе данных
          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({
              status: subscription.status,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);
            
          if (updateError) {
            console.error(`[${webhookId}] Error updating subscription:`, updateError);
            return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
          }
          
          // Проверяем, есть ли уже запись о платеже
          const { data: existingPayment } = await supabase
            .from('payment_history')
            .select('id')
            .eq('stripe_invoice_id', invoice.id)
            .single();
            
          // Добавляем запись в платежную историю, только если нет дубликата
          if (!existingPayment) {
            const { error: paymentError } = await supabase
              .from('payment_history')
              .insert({
                user_id: subscriptionData.user_id,
                subscription_id: subscription.id,
                stripe_invoice_id: invoice.id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: 'succeeded',
                created_at: new Date().toISOString(),
                payment_method: invoice.default_payment_method as string,
                invoice_url: invoice.hosted_invoice_url,
                receipt_url: invoice.invoice_pdf,
              });
              
            if (paymentError) {
              console.error(`[${webhookId}] Error recording payment history:`, paymentError);
            } else {
              console.log(`[${webhookId}] Payment record added for invoice ${invoice.id}`);
            }
          } else {
            console.log(`[${webhookId}] Payment record already exists for invoice ${invoice.id}`);
          }
          
          // Поддерживаем доступ к оплаченным уровням
          const levelIds = await getLevelsToUnlock(supabase, subscriptionData.stripe_price_id);
          await unlockLevelsForUser(supabase, subscriptionData.user_id, levelIds, webhookId);
        }
        
        break;
      }
      
      case 'customer.subscription.updated': {
        // Обработка обновления подписки
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[${webhookId}] Processing subscription update for ${subscription.id}`);
        
        // Обновляем статус подписки в базе данных
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            cancel_at: subscription.cancel_at 
              ? new Date(subscription.cancel_at * 1000).toISOString() 
              : null,
            canceled_at: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString() 
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)
          .select('user_id, stripe_price_id')
          .single();
          
        if (subscriptionError) {
          console.error(`[${webhookId}] Error updating subscription:`, subscriptionError);
          return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
        }
        
        // Если подписка активна - поддерживаем доступ к уровням
        if (subscription.status === 'active' && subscriptionData) {
          const levelIds = await getLevelsToUnlock(supabase, subscriptionData.stripe_price_id);
          await unlockLevelsForUser(supabase, subscriptionData.user_id, levelIds, webhookId);
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        // Обработка удаления подписки
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[${webhookId}] Processing subscription deletion for ${subscription.id}`);
        
        // Обновляем статус подписки в базе данных
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (updateError) {
          console.error(`[${webhookId}] Error updating subscription:`, updateError);
          return NextResponse.json({ error: 'Error updating subscription' }, { status: 500 });
        }
        
        // Здесь при желании можно добавить логику блокировки доступа к оплаченному контенту
        // после отмены подписки, но это не требуется в текущей задаче
        
        break;
      }
      
      default: {
        // Для других типов событий просто логируем
        console.log(`[${webhookId}] Received event type ${event.type}, no specific handler implemented`);
      }
    }
    
    // Записываем обработанное событие для предотвращения повторной обработки
    await recordProcessedEvent(supabase, event.id, event.type);
    
    // Логируем время выполнения для отслеживания производительности
    const executionTime = Date.now() - startTime;
    console.log(`[${webhookId}] Webhook processed successfully in ${executionTime}ms`);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${webhookId}] Webhook handler error:`, error);
    
    // Добавляем информацию о необработанном событии для последующего анализа
    try {
      await supabase
        .from('webhook_errors')
        .insert({
          event_id: event.id,
          event_type: event.type,
          error_message: errorMessage,
          created_at: new Date().toISOString(),
        });
    } catch (logError) {
      console.error(`[${webhookId}] Failed to log webhook error:`, logError);
    }
    
    return NextResponse.json(
      { error: 'Webhook handler failed', message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Проверяет, было ли данное событие уже обработано
 * @param supabase Supabase клиент
 * @param eventId ID события Stripe
 * @returns true, если событие уже было обработано
 */
async function isDuplicateEvent(supabase: any, eventId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('processed_webhooks')
      .select('id')
      .eq('event_id', eventId)
      .single();
      
    return !!data;
  } catch (error) {
    // В случае ошибки лучше вернуть false, чтобы обработать событие
    console.error('Error checking for duplicate event:', error);
    return false;
  }
}

/**
 * Записывает информацию об обработанном событии
 * @param supabase Supabase клиент
 * @param eventId ID события Stripe
 * @param eventType Тип события Stripe
 */
async function recordProcessedEvent(supabase: any, eventId: string, eventType: string): Promise<void> {
  try {
    await supabase
      .from('processed_webhooks')
      .insert({
        event_id: eventId,
        event_type: eventType,
        processed_at: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Error recording processed event:', error);
    // Здесь не выбрасываем ошибку, чтобы не нарушить работу webhook handler
  }
}

/**
 * Определяет список уровней для разблокировки на основе тарифного плана
 * @param supabase Supabase клиент
 * @param priceId ID тарифного плана в Stripe
 * @returns Массив ID уровней для разблокировки
 */
async function getLevelsToUnlock(supabase: any, priceId: string): Promise<string[]> {
  try {
    // Получаем все уровни из базы данных
    const { data: levels, error } = await supabase
      .from('levels')
      .select('id, is_free, order_index')
      .order('order_index', { ascending: true });
      
    if (error) {
      console.error('Error fetching levels:', error);
      return [];
    }
    
    // Фильтруем бесплатные уровни, т.к. они и так доступны
    const paidLevels = levels.filter((level: any) => !level.is_free).map((level: any) => level.id);
    
    // Определяем тип подписки по priceId и разблокируем соответствующие уровни
    // Это логика из нашего бизнес-плана, которая может быть изменена
    // в соответствии с требованиями
    switch (priceId) {
      case 'price_basic_monthly':
      case 'price_basic_yearly':
        // В базовом тарифе открываем первые 5 платных уровней
        return paidLevels.slice(0, 5);
      case 'price_pro_monthly':
      case 'price_pro_yearly':
        // В PRO тарифе открываем первые 10 платных уровней
        return paidLevels.slice(0, 10);
      case 'price_business_monthly':
      case 'price_business_yearly':
        // В Business тарифе открываем все платные уровни
        return paidLevels;
      default:
        // Если priceId не соответствует известным тарифам, логируем ошибку
        console.error(`Unknown price ID: ${priceId}`);
        return [];
    }
  } catch (error) {
    console.error('Error in getLevelsToUnlock:', error);
    return [];
  }
}

/**
 * Разблокирует указанные уровни для пользователя
 * @param supabase Supabase клиент
 * @param userId ID пользователя
 * @param levelIds Массив ID уровней для разблокировки
 * @param logPrefix Префикс для логов
 */
async function unlockLevelsForUser(supabase: any, userId: string, levelIds: string[], logPrefix = '') {
  if (!levelIds.length) {
    console.log(`${logPrefix ? `[${logPrefix}] ` : ''}No levels to unlock for user ${userId}`);
    return;
  }
  
  try {
    // Получаем уже существующие записи о прогрессе пользователя
    const { data: existingProgress, error: progressError } = await supabase
      .from('user_progress')
      .select('level_id, status')
      .eq('user_id', userId)
      .in('level_id', levelIds);
      
    if (progressError) {
      console.error(`${logPrefix ? `[${logPrefix}] ` : ''}Error fetching existing progress:`, progressError);
      return;
    }
    
    // Создаем мапу существующих уровней
    const existingLevels = new Map();
    existingProgress.forEach((p: any) => {
      existingLevels.set(p.level_id, p.status);
    });
    
    // Отфильтровываем уровни, для которых нужно создать запись или обновить статус
    const levelsToInsert = [];
    const levelsToUpdate = [];
    
    for (const levelId of levelIds) {
      if (!existingLevels.has(levelId)) {
        // Если записи о прогрессе нет - создаем новую
        levelsToInsert.push({
          user_id: userId,
          level_id: levelId,
          status: 'in_progress',
          completed_percentage: 0,
          quiz_score: 0,
        });
      } else if (existingLevels.get(levelId) === 'not_started') {
        // Если статус 'not_started' - обновляем на 'in_progress'
        levelsToUpdate.push(levelId);
      }
    }
    
    // Вставляем новые записи о прогрессе
    if (levelsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('user_progress')
        .insert(levelsToInsert);
        
      if (insertError) {
        console.error(`${logPrefix ? `[${logPrefix}] ` : ''}Error inserting progress records:`, insertError);
      } else {
        console.log(`${logPrefix ? `[${logPrefix}] ` : ''}Unlocked ${levelsToInsert.length} new levels for user ${userId}`);
      }
    }
    
    // Обновляем записи со статусом 'not_started'
    if (levelsToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from('user_progress')
        .update({ status: 'in_progress' })
        .eq('user_id', userId)
        .in('level_id', levelsToUpdate);
        
      if (updateError) {
        console.error(`${logPrefix ? `[${logPrefix}] ` : ''}Error updating progress records:`, updateError);
      } else {
        console.log(`${logPrefix ? `[${logPrefix}] ` : ''}Updated status for ${levelsToUpdate.length} levels for user ${userId}`);
      }
    }
    
    // Если ничего не изменилось, просто логируем
    if (levelsToInsert.length === 0 && levelsToUpdate.length === 0) {
      console.log(`${logPrefix ? `[${logPrefix}] ` : ''}All ${levelIds.length} levels are already unlocked for user ${userId}`);
    }
  } catch (error) {
    console.error(`${logPrefix ? `[${logPrefix}] ` : ''}Error unlocking levels:`, error);
  }
}

/**
 * Добавляет запись в платежную историю
 * @param supabase Supabase клиент
 * @param userId ID пользователя
 * @param session Stripe Checkout сессия
 * @param subscription Stripe подписка
 * @param logPrefix Префикс для логов
 */
async function addPaymentRecord(supabase: any, userId: string, session: Stripe.Checkout.Session, subscription: Stripe.Subscription, logPrefix = '') {
  try {
    // Проверяем, есть ли уже запись о платеже
    const paymentIntent = session.payment_intent as string;
    if (paymentIntent) {
      const { data: existingPayment } = await supabase
        .from('payment_history')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntent)
        .single();
        
      if (existingPayment) {
        console.log(`${logPrefix ? `[${logPrefix}] ` : ''}Payment record already exists for payment intent ${paymentIntent}`);
        return;
      }
    }
    
    // Получаем информацию о платеже
    let paymentData = {
      payment_method: '',
      receipt_url: '',
    };
    
    if (paymentIntent) {
      try {
        const paymentDetails = await stripe.paymentIntents.retrieve(paymentIntent);
        paymentData = {
          payment_method: paymentDetails.payment_method as string,
          receipt_url: paymentDetails.charges.data[0]?.receipt_url || '',
        };
      } catch (error) {
        console.error(`${logPrefix ? `[${logPrefix}] ` : ''}Error retrieving payment details:`, error);
      }
    }
    
    // Создаем запись в платежной истории
    const { error } = await supabase
      .from('payment_history')
      .insert({
        user_id: userId,
        subscription_id: subscription.id,
        stripe_payment_intent_id: paymentIntent,
        amount: session.amount_total || 0,
        currency: session.currency || 'usd',
        status: 'succeeded',
        created_at: new Date().toISOString(),
        payment_method: paymentData.payment_method,
        receipt_url: paymentData.receipt_url,
      });
      
    if (error) {
      console.error(`${logPrefix ? `[${logPrefix}] ` : ''}Error recording payment history:`, error);
    } else {
      console.log(`${logPrefix ? `[${logPrefix}] ` : ''}Payment record added for user ${userId}`);
    }
  } catch (error) {
    console.error(`${logPrefix ? `[${logPrefix}] ` : ''}Error adding payment record:`, error);
  }
}

// Отключаем проверку тела запроса, так как Stripe требует сырых данных
export const config = {
  api: {
    bodyParser: false,
  },
}; 