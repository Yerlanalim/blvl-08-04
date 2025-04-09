-- Create user_subscriptions table for Stripe subscription data
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS user_subscriptions_user_id_idx ON public.user_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_stripe_subscription_id_idx ON public.user_subscriptions (stripe_subscription_id);
CREATE INDEX IF NOT EXISTS user_subscriptions_status_idx ON public.user_subscriptions (status);

-- Create table for payment history
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method TEXT,
  invoice_url TEXT,
  receipt_url TEXT
);

-- Create indexes for payment history
CREATE INDEX IF NOT EXISTS payment_history_user_id_idx ON public.payment_history (user_id);
CREATE INDEX IF NOT EXISTS payment_history_subscription_id_idx ON public.payment_history (subscription_id);

-- Enable Row Level Security
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_history;
CREATE POLICY "Users can view own payments"
  ON public.payment_history FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Admins can view all payments
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payment_history;
CREATE POLICY "Admins can view all payments"
  ON public.payment_history FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Add trigger to handle updated_at field for user_subscriptions
DROP TRIGGER IF EXISTS user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Function to check subscription status
CREATE OR REPLACE FUNCTION public.is_subscription_active(user_id_input UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_active BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = user_id_input
    AND status IN ('active', 'trialing')
    AND current_period_end > NOW()
  ) INTO is_active;
  
  RETURN is_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 