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
  }
  // Add other tables here as they are created
} 