-- Verify role exists in profiles table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'editor'));
    END IF;
END
$$;

-- Create admin_logs table for logging admin actions
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS admin_logs_admin_id_idx ON public.admin_logs (admin_id);
CREATE INDEX IF NOT EXISTS admin_logs_resource_type_idx ON public.admin_logs (resource_type);
CREATE INDEX IF NOT EXISTS admin_logs_created_at_idx ON public.admin_logs (created_at);

-- Enable RLS for admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_logs
DROP POLICY IF EXISTS "Admins can read all logs" ON public.admin_logs;
CREATE POLICY "Admins can read all logs"
  ON public.admin_logs FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_logs;
CREATE POLICY "Admins can insert logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (auth.uid() = admin_id AND 
              auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Create RLS policies for admin access to all tables
-- These policies allow admins to have full access to all main tables

-- Profiles: Admins can read and update all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Levels: Admins have full access to levels
DROP POLICY IF EXISTS "Admins have full access to levels" ON public.levels;
CREATE POLICY "Admins have full access to levels"
  ON public.levels FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Videos: Admins have full access to videos
DROP POLICY IF EXISTS "Admins have full access to videos" ON public.videos;
CREATE POLICY "Admins have full access to videos"
  ON public.videos FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Artifacts: Admins have full access to artifacts
DROP POLICY IF EXISTS "Admins have full access to artifacts" ON public.artifacts;
CREATE POLICY "Admins have full access to artifacts"
  ON public.artifacts FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Quiz questions: Admins have full access to quiz questions
DROP POLICY IF EXISTS "Admins have full access to quiz_questions" ON public.quiz_questions;
CREATE POLICY "Admins have full access to quiz_questions"
  ON public.quiz_questions FOR ALL
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- User progress: Admins can read all user progress
DROP POLICY IF EXISTS "Admins can read all user_progress" ON public.user_progress;
CREATE POLICY "Admins can read all user_progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- User video progress: Admins can read all user video progress
DROP POLICY IF EXISTS "Admins can read all user_video_progress" ON public.user_video_progress;
CREATE POLICY "Admins can read all user_video_progress"
  ON public.user_video_progress FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- User artifacts: Admins can read all user artifacts
DROP POLICY IF EXISTS "Admins can read all user_artifacts" ON public.user_artifacts;
CREATE POLICY "Admins can read all user_artifacts"
  ON public.user_artifacts FOR SELECT
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Create trigger function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER AS $$
DECLARE
  admin_role TEXT;
  log_data JSONB;
BEGIN
  -- Check if the current user is an admin
  SELECT role INTO admin_role FROM public.profiles WHERE id = auth.uid();
  
  IF admin_role = 'admin' THEN
    -- Create log data based on operation
    IF TG_OP = 'INSERT' THEN
      log_data = to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
      log_data = jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      );
    ELSIF TG_OP = 'DELETE' THEN
      log_data = to_jsonb(OLD);
    END IF;
    
    -- Insert log entry
    INSERT INTO public.admin_logs (
      admin_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      auth.uid(),
      lower(TG_OP),
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
        ELSE NEW.id::TEXT
      END,
      log_data
    );
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 