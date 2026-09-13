import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'sonner'
import type { Chat } from '@/types'
import { NVIDIA_MODELS } from '@/types'

export function useChats() {
  const { userId } = useAuth()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  const fetchChats = useCallback(async () => {
    if (!userId) {
      setChats([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('updated_at', { ascending: false })

    if (!error && data) setChats(data as Chat[])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  const createChat = useCallback(async (model?: string): Promise<Chat | null> => {
    if (!userId) {
      toast.error('User not authenticated')
      return null
    }
    
    const selectedModel = model ?? NVIDIA_MODELS[0].id
    const { data, error } = await supabase
      .from('chats')
      .insert({ title: 'New Chat', model: selectedModel, user_id: userId })
      .select()
      .single()

    if (error || !data) {
      console.error("Supabase insert error:", error)
      toast.error(`Database error: ${error?.message || 'Unknown error'}`)
      return null
    }
    const chat = data as Chat
    setChats((prev) => [chat, ...prev])
    return chat
  }, [userId])

  const deleteChat = useCallback(async (id: string) => {
    await supabase.from('chats').delete().eq('id', id)
    setChats((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const renameChat = useCallback(async (id: string, title: string) => {
    await supabase.from('chats').update({ title }).eq('id', id)
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
  }, [])

  const updateChatModel = useCallback(async (id: string, model: string) => {
    await supabase.from('chats').update({ model }).eq('id', id)
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, model } : c)))
  }, [])

  const updateChatTitle = useCallback((id: string, title: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)))
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
