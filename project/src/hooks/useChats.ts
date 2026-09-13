import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import type { Chat } from '@/types'
import { NVIDIA_MODELS } from '@/types'

const LOCAL_CHATS_KEY = 'codebolt_local_chats'

function loadLocalChats(): Chat[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(LOCAL_CHATS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalChats(chats: Chat[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(chats))
  } catch (e) {
    console.error('Failed to save local chats', e)
  }
}

export function useChats() {
  const { userId } = useAuth()
  const [chats, setChats] = useState<Chat[]>(() => (!isSupabaseConfigured ? loadLocalChats() : []))
  const [loading, setLoading] = useState(true)

  const fetchChats = useCallback(async () => {
    if (!userId) {
      setChats([])
      setLoading(false)
      return
    }

    if (!isSupabaseConfigured) {
      setChats(loadLocalChats())
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('updated_at', { ascending: false })

      if (!error && data) {
        setChats(data as Chat[])
      } else {
        setChats(loadLocalChats())
      }
    } catch {
      setChats(loadLocalChats())
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const createChat = useCallback(
    async (model?: string): Promise<Chat | null> => {
      if (!userId) {
        toast.error('User not authenticated')
        return null
      }

      const selectedModel = model ?? NVIDIA_MODELS[0].id
      const newChat: Chat = {
        id: crypto.randomUUID(),
        title: 'New Chat',
        model: selectedModel,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (!isSupabaseConfigured) {
        setChats((prev) => {
          const next = [newChat, ...prev]
          saveLocalChats(next)
          return next
        })
        return newChat
      }

      try {
        const { data, error } = await supabase
          .from('chats')
          .insert({ title: 'New Chat', model: selectedModel, user_id: userId })
          .select()
          .single()

        if (error || !data) {
          setChats((prev) => {
            const next = [newChat, ...prev]
            saveLocalChats(next)
            return next
          })
          return newChat
        }
        const chat = data as Chat
        setChats((prev) => [chat, ...prev])
        return chat
      } catch {
        setChats((prev) => {
          const next = [newChat, ...prev]
          saveLocalChats(next)
          return next
        })
        return newChat
      }
    },
    [userId]
  )

  const deleteChat = useCallback(async (id: string) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('chats').delete().eq('id', id)
      } catch (e) {
        console.warn('Failed to delete on supabase', e)
      }
    }
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id)
      saveLocalChats(next)
      return next
    })
  }, [])

  const renameChat = useCallback(async (id: string, title: string) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('chats').update({ title }).eq('id', id)
      } catch (e) {
        console.warn('Failed to rename on supabase', e)
      }
    }
    setChats((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, title } : c))
      saveLocalChats(next)
      return next
    })
  }, [])

  const updateChatModel = useCallback(async (id: string, model: string) => {
    if (isSupabaseConfigured) {
      try {
        await supabase.from('chats').update({ model }).eq('id', id)
      } catch (e) {
        console.warn('Failed to update model on supabase', e)
      }
    }
    setChats((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, model } : c))
      saveLocalChats(next)
      return next
    })
  }, [])

  const updateChatTitle = useCallback((id: string, title: string) => {
    setChats((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, title } : c))
      saveLocalChats(next)
      return next
    })
  }, [])

  return {
    chats,
    loading,
    createChat,
    deleteChat,
    renameChat,
    updateChatModel,
    updateChatTitle,
    refetch: fetchChats,
  }
}
