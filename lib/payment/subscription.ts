'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/supabase/database.types';

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: string | null;
  cancelAt?: string | null;
  canceledAt?: string | null;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string | null;
  stripeInvoiceId?: string | null;
  stripePaymentIntentId?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paymentMethod?: string | null;
  invoiceUrl?: string | null;
  receiptUrl?: string | null;
}

/**
 * Получает текущую активную подписку пользователя
 */
export async function getUserSubscription(): Promise<Subscription | null> {
  const supabase = createClientComponentClient<Database>();
  
  // Проверяем, авторизован ли пользователь
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error || !data) return null;
    
    // Приводим к удобному интерфейсу
    return {
      id: data.id,
      userId: data.user_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      stripeCustomerId: data.stripe_customer_id,
      stripePriceId: data.stripe_price_id,
      status: data.status,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      paymentMethod: data.payment_method,
      cancelAt: data.cancel_at,
      canceledAt: data.canceled_at,
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

/**
 * Проверяет активность подписки пользователя
 */
export async function isSubscriptionActive(): Promise<boolean> {
  const subscription = await getUserSubscription();
  
  if (!subscription) return false;
  
  const now = new Date();
  const endDate = new Date(subscription.currentPeriodEnd);
  
  return (
    ['active', 'trialing'].includes(subscription.status) && 
    endDate > now
  );
}

/**
 * Получает историю платежей пользователя
 */
export async function getPaymentHistory(limit = 10): Promise<Payment[]> {
  const supabase = createClientComponentClient<Database>();
  
  // Проверяем, авторизован ли пользователь
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];
  
  try {
    const { data, error } = await supabase
      .from('payment_history')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error || !data) return [];
    
    // Приводим к удобному интерфейсу
    return data.map(payment => ({
      id: payment.id,
      userId: payment.user_id,
      subscriptionId: payment.subscription_id,
      stripeInvoiceId: payment.stripe_invoice_id,
      stripePaymentIntentId: payment.stripe_payment_intent_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.created_at,
      paymentMethod: payment.payment_method,
      invoiceUrl: payment.invoice_url,
      receiptUrl: payment.receipt_url,
    }));
  } catch (error) {
    console.error('Error getting payment history:', error);
    return [];
  }
}

/**
 * Переходит к порталу управления подпиской Stripe
 */
export async function manageSubscription(): Promise<string | null> {
  try {
    const response = await fetch('/api/payment/create-portal', {
      method: 'POST',
    });
    
    const { url, error } = await response.json();
    
    if (error) {
      console.error('Error creating portal session:', error);
      return null;
    }
    
    return url;
  } catch (error) {
    console.error('Error managing subscription:', error);
    return null;
  }
} 