-- Create profiles table (extending auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  company TEXT,
  position TEXT
);

-- Create foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_id_fkey' AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END
$$;

-- Create trigger to handle created_at and updated_at fields for profiles
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Create levels table (learning levels)
CREATE TABLE IF NOT EXISTS public.levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  is_free BOOLEAN DEFAULT false NOT NULL
);

-- Create trigger for levels
DROP TRIGGER IF EXISTS levels_updated_at ON public.levels;
CREATE TRIGGER levels_updated_at
BEFORE UPDATE ON public.levels
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Create videos table (videos within levels)
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  duration INTEGER, -- Duration in seconds
  order_index INTEGER NOT NULL,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'draft' NOT NULL CHECK (status IN ('draft', 'published', 'archived'))
);

-- Create trigger for videos
DROP TRIGGER IF EXISTS videos_updated_at ON public.videos;
CREATE TRIGGER videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Create quiz_questions table (test questions)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of possible answers
  correct_option INTEGER NOT NULL, -- Index of the correct answer
  explanation TEXT, -- Explanation for the correct answer
  order_index INTEGER NOT NULL
);

-- Create trigger for quiz_questions
DROP TRIGGER IF EXISTS quiz_questions_updated_at ON public.quiz_questions;
CREATE TRIGGER quiz_questions_updated_at
BEFORE UPDATE ON public.quiz_questions
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Create artifacts table (learning materials)
CREATE TABLE IF NOT EXISTS public.artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- e.g., 'pdf', 'doc', 'xlsx'
  file_size INTEGER, -- Size in bytes
  order_index INTEGER NOT NULL
);

-- Create trigger for artifacts
DROP TRIGGER IF EXISTS artifacts_updated_at ON public.artifacts;
CREATE TRIGGER artifacts_updated_at
BEFORE UPDATE ON public.artifacts
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Tables for tracking user progress

-- Create user_progress table (progress on levels)
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_percentage INTEGER DEFAULT 0 NOT NULL CHECK (completed_percentage BETWEEN 0 AND 100),
  quiz_score INTEGER DEFAULT 0,
  UNIQUE(user_id, level_id)
);

-- Create trigger for user_progress
DROP TRIGGER IF EXISTS user_progress_updated_at ON public.user_progress;
CREATE TRIGGER user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Create user_video_progress table (watched videos)
CREATE TABLE IF NOT EXISTS public.user_video_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0 NOT NULL,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  last_position INTEGER DEFAULT 0 NOT NULL, -- Position where the user last stopped the video
  UNIQUE(user_id, video_id)
);

-- Create trigger for user_video_progress
DROP TRIGGER IF EXISTS user_video_progress_updated_at ON public.user_video_progress;
CREATE TRIGGER user_video_progress_updated_at
BEFORE UPDATE ON public.user_video_progress
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Create user_artifacts table (downloaded artifacts)
CREATE TABLE IF NOT EXISTS public.user_artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  artifact_id UUID NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, artifact_id)
);

-- Create trigger for user_artifacts
DROP TRIGGER IF EXISTS user_artifacts_updated_at ON public.user_artifacts;
CREATE TRIGGER user_artifacts_updated_at
BEFORE UPDATE ON public.user_artifacts
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Add Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_artifacts ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles but only update their own
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Levels: Published levels are viewable by everyone, drafts only by admins
DROP POLICY IF EXISTS "Published levels are viewable by everyone" ON public.levels;
CREATE POLICY "Published levels are viewable by everyone" 
ON public.levels FOR SELECT USING (status = 'published' OR (status IN ('draft', 'archived') AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
)));

-- Videos: Published videos in published levels are viewable by everyone
DROP POLICY IF EXISTS "Published videos are viewable by everyone" ON public.videos;
CREATE POLICY "Published videos are viewable by everyone" 
ON public.videos FOR SELECT USING (
  status = 'published' AND EXISTS (
    SELECT 1 FROM public.levels WHERE id = level_id AND status = 'published'
  )
  OR (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ))
);

-- User progress: Users can only access their own progress
DROP POLICY IF EXISTS "Users can manage their own progress" ON public.user_progress;
CREATE POLICY "Users can manage their own progress" 
ON public.user_progress FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own video progress" ON public.user_video_progress;
CREATE POLICY "Users can manage their own video progress" 
ON public.user_video_progress FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own artifacts" ON public.user_artifacts;
CREATE POLICY "Users can manage their own artifacts" 
ON public.user_artifacts FOR ALL USING (auth.uid() = user_id);

-- Admins can manage all content
DROP POLICY IF EXISTS "Admins can manage all levels" ON public.levels;
CREATE POLICY "Admins can manage all levels" 
ON public.levels FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage all videos" ON public.videos;
CREATE POLICY "Admins can manage all videos" 
ON public.videos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage all quiz questions" ON public.quiz_questions;
CREATE POLICY "Admins can manage all quiz questions" 
ON public.quiz_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage all artifacts" ON public.artifacts;
CREATE POLICY "Admins can manage all artifacts" 
ON public.artifacts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
); 