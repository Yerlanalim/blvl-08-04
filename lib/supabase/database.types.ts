import { Tables } from './types'

export type Database = {
  public: {
    Tables: {
      test_connection: {
        Row: Tables['test_connection']['Row']
        Insert: Tables['test_connection']['Insert']
        Update: Tables['test_connection']['Update']
      }
      // Add other tables here as they are created
    }
    Views: {
      // Add views here as they are created
    }
    Functions: {
      // Add functions here as they are created
    }
    Enums: {
      // Add enums here as they are created
    }
  }
} 