import { Database } from './database.types';

// Table row types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Level = Database['public']['Tables']['levels']['Row'];
export type Video = Database['public']['Tables']['videos']['Row'];
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row'];
export type Artifact = Database['public']['Tables']['artifacts']['Row'];
export type UserProgress = Database['public']['Tables']['user_progress']['Row'];
export type UserVideoProgress = Database['public']['Tables']['user_video_progress']['Row'];
export type UserArtifact = Database['public']['Tables']['user_artifacts']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

// Insertion types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type LevelInsert = Database['public']['Tables']['levels']['Insert'];
export type VideoInsert = Database['public']['Tables']['videos']['Insert'];
export type QuizQuestionInsert = Database['public']['Tables']['quiz_questions']['Insert'];
export type ArtifactInsert = Database['public']['Tables']['artifacts']['Insert'];
export type UserProgressInsert = Database['public']['Tables']['user_progress']['Insert'];
export type UserVideoProgressInsert = Database['public']['Tables']['user_video_progress']['Insert'];
export type UserArtifactInsert = Database['public']['Tables']['user_artifacts']['Insert'];
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type LevelUpdate = Database['public']['Tables']['levels']['Update'];
export type VideoUpdate = Database['public']['Tables']['videos']['Update'];
export type QuizQuestionUpdate = Database['public']['Tables']['quiz_questions']['Update'];
export type ArtifactUpdate = Database['public']['Tables']['artifacts']['Update'];
export type UserProgressUpdate = Database['public']['Tables']['user_progress']['Update'];
export type UserVideoProgressUpdate = Database['public']['Tables']['user_video_progress']['Update'];
export type UserArtifactUpdate = Database['public']['Tables']['user_artifacts']['Update'];
export type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update'];

// Enums and constants
export type LevelStatus = 'draft' | 'published' | 'archived';
export type VideoStatus = 'draft' | 'published' | 'archived';
export type UserRole = 'user' | 'admin';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type MessageRole = 'user' | 'assistant' | 'system';

export type Tables = {
  test_connection: {
    Row: {
      id: number
      message: string
      created_at: string
    }
    Insert: {
      id?: number
      message: string
      created_at?: string
    }
    Update: {
      id?: number
      message?: string
      created_at?: string
    }
  },
  chat_messages: {
    Row: {
      id: string
      created_at: string
      updated_at: string
      user_id: string
      conversation_id: string
      role: MessageRole
      content: string
    }
    Insert: {
      id?: string
      created_at?: string
      updated_at?: string
      user_id: string
      conversation_id: string
      role: MessageRole
      content: string
    }
    Update: {
      id?: string
      created_at?: string
      updated_at?: string
      user_id?: string
      conversation_id?: string
      role?: MessageRole
      content?: string
    }
  }
  // Add other tables here as they are created
} 