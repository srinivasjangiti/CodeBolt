import { createClient } from '@supabase/supabase-js'

const envUrl = import.meta.env.VITE_SUPABASE_URL as string
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_URL') || '' : ''
const localKey = typeof window !== 'undefined' ? localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '' : ''

const activeUrl = envUrl || localUrl
const activeKey = envKey || localKey

export const isSupabaseConfigured = Boolean(
  activeUrl &&
  activeKey &&
  activeUrl !== 'https://your-project.supabase.co' &&
  activeKey !== 'your-anon-key'
)

// Use active credentials if configured, otherwise initialize with placeholder to prevent bundle crash
export const supabase = isSupabaseConfigured
  ? createClient(activeUrl, activeKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key')

export type Database = {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string
          user_id?: string | null
          title: string
          model: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title?: string
          model?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          model?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          role: string
          content: string
          created_at?: string
        }
        Update: {
          content?: string
        }
      }
    }
  }
}
