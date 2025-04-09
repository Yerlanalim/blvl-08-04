-- Add video_id column to quiz_questions table
ALTER TABLE public.quiz_questions ADD COLUMN video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE;

-- Add type column to quiz_questions table
ALTER TABLE public.quiz_questions ADD COLUMN type TEXT NOT NULL DEFAULT 'single_choice' CHECK (type IN ('single_choice', 'multiple_choice', 'text_input'));

-- Update correct_option to be JSONB to support multiple correct answers
ALTER TABLE public.quiz_questions ALTER COLUMN correct_option TYPE JSONB USING to_jsonb(correct_option);

-- Add index for video_id
CREATE INDEX IF NOT EXISTS idx_quiz_questions_video_id ON public.quiz_questions(video_id);

-- Update RLS policies for quiz_questions to allow users to read
DROP POLICY IF EXISTS "Users can read quiz questions" ON public.quiz_questions;
CREATE POLICY "Users can read quiz questions" 
ON public.quiz_questions FOR SELECT USING (
  auth.role() = 'authenticated'
); 