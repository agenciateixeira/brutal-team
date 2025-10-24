export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'coach' | 'aluno'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role: 'coach' | 'aluno'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'coach' | 'aluno'
          created_at?: string
          updated_at?: string
        }
      }
      progress_photos: {
        Row: {
          id: string
          aluno_id: string
          photo_url: string
          week_number: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          aluno_id: string
          photo_url: string
          week_number: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          aluno_id?: string
          photo_url?: string
          week_number?: number
          notes?: string | null
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          aluno_id: string
          sender_id: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          aluno_id: string
          sender_id: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          aluno_id?: string
          sender_id?: string
          message?: string
          read?: boolean
          created_at?: string
        }
      }
      dietas: {
        Row: {
          id: string
          aluno_id: string
          title: string
          content: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          aluno_id: string
          title: string
          content: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          aluno_id?: string
          title?: string
          content?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      treinos: {
        Row: {
          id: string
          aluno_id: string
          title: string
          content: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          aluno_id: string
          title: string
          content: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          aluno_id?: string
          title?: string
          content?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'coach' | 'aluno'
    }
  }
}
