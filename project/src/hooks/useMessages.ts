import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { streamChat, messagesToNvidia } from '@/lib/nvidia'
import type { Message, ChatSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

const SETTINGS_STORAGE_KEY = 'codebolt_chat_settings'

function loadSavedSettings(): ChatSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    const nvidiaKey = localStorage.getItem('VITE_NVIDIA_API_KEY') || ''
    if (!raw) {
      return {
        ...DEFAULT_SETTINGS,
        apiKeys: { ...DEFAULT_SETTINGS.apiKeys, nvidia: nvidiaKey },
      }
    }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      apiKeys: {
        ...DEFAULT_SETTINGS.apiKeys,
        ...(parsed.apiKeys || {}),
        nvidia: parsed.apiKeys?.nvidia || nvidiaKey,
      },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [settings, setSettings] = useState<ChatSettings>(loadSavedSettings)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
        if (settings.apiKeys?.nvidia) {
          localStorage.setItem('VITE_NVIDIA_API_KEY', settings.apiKeys.nvidia)
        }
      } catch (e) {
        console.error('Failed to save settings to localStorage', e)
      }
    }
  }, [settings])

  useEffect(() => {
    if (!chatId) {
      setMessages([])
      return
    }

    setMessages([])
    supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as Message[])
      })
  }, [chatId])

  const sendMessage = useCallback(
    async (content: string, model: string, onTitleUpdate?: (title: string) => void, images?: string[], onStreamDone?: (fullContent: string) => void) => {
      if (!chatId || isStreaming) return

      let finalContent = content
      if (images && images.length > 0) {
        const payload = [
          ...(content ? [{ type: 'text', text: content }] : []),
          ...images.map(img => ({ type: 'image_url', image_url: { url: img } }))
        ]
        finalContent = JSON.stringify(payload)
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        chat_id: chatId,
        role: 'user',
        content: finalContent,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])

      await supabase.from('messages').insert({
        chat_id: chatId,
        role: 'user',
        content: finalContent,
      })

      // Auto-generate title from first message
      if (messages.length === 0 && content.trim()) {
        const title = content.slice(0, 60).trim()
        await supabase.from('chats').update({ title }).eq('id', chatId)
        onTitleUpdate?.(title)
      }

      setIsStreaming(true)
      setStreamingContent('')

      const abortController = new AbortController()
      abortRef.current = abortController

      let fullContent = ''

      const allMessages = [...messages, userMsg]

      await streamChat(
        messagesToNvidia(allMessages),
        model,
        settings,
        abortController.signal,
        (chunk) => {
          fullContent += chunk
          setStreamingContent(fullContent)
        },
        async () => {
          setIsStreaming(false)
          setStreamingContent('')

          if (fullContent) {
            const assistantMsg: Message = {
              id: crypto.randomUUID(),
              chat_id: chatId,
              role: 'assistant',
              content: fullContent,
              created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, assistantMsg])

            await supabase.from('messages').insert({
              chat_id: chatId,
              role: 'assistant',
              content: fullContent,
            })
            // Callback so ChatApp can parse file edits from the response
            onStreamDone?.(fullContent)
          }
        },
        (error) => {
          setIsStreaming(false)
          setStreamingContent('')
          const errMsg: Message = {
            id: crypto.randomUUID(),
            chat_id: chatId,
            role: 'assistant',
            content: `Error: ${error.message}`,
            created_at: new Date().toISOString(),
          }
          setMessages((prev) => [...prev, errMsg])
        }
      )
    },
    [chatId, isStreaming, messages, settings]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
    setStreamingContent('')
  }, [])

  const regenerateLastResponse = useCallback(
    async (model: string, onTitleUpdate?: (title: string) => void) => {
      if (isStreaming || messages.length < 1) return

      const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user')
      if (lastUserIdx === -1) return

      const actualIdx = messages.length - 1 - lastUserIdx
      const lastUserMsg = messages[actualIdx]
      const messagesUpToUser = messages.slice(0, actualIdx + 1)

      // Remove last assistant message if present
      const withoutLast =
        messages[messages.length - 1].role === 'assistant'
          ? messages.slice(0, messages.length - 1)
          : messages

      setMessages(withoutLast)

      const abortController = new AbortController()
      abortRef.current = abortController
      setIsStreaming(true)
      setStreamingContent('')

      let fullContent = ''

      await streamChat(
        messagesToNvidia(messagesUpToUser),
        model,
        settings,
        abortController.signal,
        (chunk) => {
          fullContent += chunk
          setStreamingContent(fullContent)
        },
        async () => {
          setIsStreaming(false)
          setStreamingContent('')

          if (fullContent) {
            const assistantMsg: Message = {
              id: crypto.randomUUID(),
              chat_id: chatId!,
              role: 'assistant',
              content: fullContent,
              created_at: new Date().toISOString(),
            }
            setMessages((prev) => [...prev, assistantMsg])
            await supabase.from('messages').insert({
              chat_id: chatId!,
              role: 'assistant',
              content: fullContent,
            })
          }
        },
        (_err) => {
          setIsStreaming(false)
          setStreamingContent('')
        }
      )

      void lastUserMsg
      void onTitleUpdate
    },
    [chatId, isStreaming, messages, settings]
  )

  const clearMessages = useCallback(async () => {
    if (!chatId) return
    await supabase.from('messages').delete().eq('chat_id', chatId)
    setMessages([])
  }, [chatId])

  return {
    messages,
    isStreaming,
    streamingContent,
    settings,
    setSettings,
    sendMessage,
    stopStreaming,
    regenerateLastResponse,
    clearMessages,
  }
}
