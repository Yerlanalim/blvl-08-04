-- Create chat_messages table for storing chat history
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL
);

-- Create trigger for chat_messages
DROP TRIGGER IF EXISTS chat_messages_updated_at ON public.chat_messages;
CREATE TRIGGER chat_messages_updated_at
BEFORE UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at);

-- Enable RLS on chat_messages table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.chat_messages;
CREATE POLICY "Users can view their own messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own messages" ON public.chat_messages;
CREATE POLICY "Users can insert their own messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.chat_messages;
CREATE POLICY "Users can update their own messages"
ON public.chat_messages FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all messages" ON public.chat_messages;
CREATE POLICY "Admins can manage all messages"
ON public.chat_messages FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
