import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Инициализация Stripe с API ключом из переменных окружения
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  try {
    // Получение данных из запроса
    const { priceId, successUrl, cancelUrl } = await req.json();
    
    // Проверка обязательных параметров
    if (!priceId) {
      return NextResponse.json({ error: 'Не указан идентификатор тарифного плана' }, { status: 400 });
    }
    
    // Создание Supabase клиента
    const supabase = createRouteHandlerClient({ cookies });
    
    // Проверка авторизации пользователя
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
    }
    
    // Получение информации о пользователе
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', session.user.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Ошибка получения данных пользователя' }, { status: 500 });
    }
    
    // Настройка метаданных для связывания платежа с пользователем
    const metadata = {
      userId: session.user.id,
      priceId,
    };
    
    // Создание сессии оплаты в Stripe
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment`,
      metadata,
      customer_email: session.user.email,
      client_reference_id: session.user.id,
    });
    
    if (!checkoutSession.url) {
      return NextResponse.json({ error: 'Не удалось создать сессию оплаты' }, { status: 500 });
    }
    
    // Логирование успешного создания сессии
    console.log(`Checkout session created: ${checkoutSession.id} for user: ${session.user.id}`);
    
    // Возвращаем URL для редиректа на страницу оплаты Stripe
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании сессии оплаты' }, 
      { status: 500 }
    );
  }
} 