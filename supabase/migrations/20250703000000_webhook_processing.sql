-- Create table for processed webhooks to ensure idempotency
CREATE TABLE IF NOT EXISTS public.processed_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index on event_id for fast lookup
CREATE INDEX IF NOT EXISTS processed_webhooks_event_id_idx ON public.processed_webhooks (event_id);

-- Create table for logging webhook errors
CREATE TABLE IF NOT EXISTS public.webhook_errors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT,
  event_type TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on webhook tables
ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_errors ENABLE ROW LEVEL SECURITY;

-- Set policies for admin access
DROP POLICY IF EXISTS "Admins can view processed webhooks" ON public.processed_webhooks;
CREATE POLICY "Admins can view processed webhooks"
ON public.processed_webhooks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can view webhook errors" ON public.webhook_errors;
CREATE POLICY "Admins can view webhook errors"
ON public.webhook_errors FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can insert webhook records
DROP POLICY IF EXISTS "Admins can insert webhook records" ON public.processed_webhooks;
CREATE POLICY "Admins can insert webhook records"
ON public.processed_webhooks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can insert webhook error records" ON public.webhook_errors;
CREATE POLICY "Admins can insert webhook error records"
ON public.webhook_errors FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Service role can always access these tables (for webhook processing)
DROP POLICY IF EXISTS "Service role can access processed webhooks" ON public.processed_webhooks;
CREATE POLICY "Service role can access processed webhooks"
ON public.processed_webhooks
USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can access webhook errors" ON public.webhook_errors;
CREATE POLICY "Service role can access webhook errors"
ON public.webhook_errors
USING (auth.jwt() ->> 'role' = 'service_role'); 