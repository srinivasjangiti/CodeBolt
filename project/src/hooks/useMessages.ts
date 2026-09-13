import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
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

function getLocalMessages(chatId: string): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('codebolt_msgs_' + chatId)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalMessages(chatId: string, msgs: Message[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('codebolt_msgs_' + chatId, JSON.stringify(msgs))
  } catch (e) {
    console.error('Failed to save local messages', e)
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

    if (!isSupabaseConfigured) {
      setMessages(getLocalMessages(chatId))
      return
    }

    setMessages([])
    supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .then(
        ({ data, error }) => {
          if (!error && data) {
            setMessages(data as Message[])
          } else {
            setMessages(getLocalMessages(chatId))
          }
        },
        () => {
          setMessages(getLocalMessages(chatId))
        }
      )
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

      setMessages((prev) => {
        const next = [...prev, userMsg]
        if (!isSupabaseConfigured) saveLocalMessages(chatId, next)
        return next
      })

      if (isSupabaseConfigured) {
        supabase.from('messages').insert({
          chat_id: chatId,
          role: 'user',
          content: finalContent,
        }).then(() => {}, () => {})
      }

      // Auto-generate title from first message
      if (messages.length === 0 && content.trim()) {
        const title = content.slice(0, 60).trim()
        if (isSupabaseConfigured) {
          supabase.from('chats').update({ title }).eq('id', chatId).then(() => {}, () => {})
        }
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
            setMessages((prev) => {
              const next = [...prev, assistantMsg]
              if (!isSupabaseConfigured) saveLocalMessages(chatId, next)
              return next
            })

            if (isSupabaseConfigured) {
              await supabase.from('messages').insert({
                chat_id: chatId,
                role: 'assistant',
                content: fullContent,
              }).then(() => {}, () => {})
            }
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
          setMessages((prev) => {
            const next = [...prev, errMsg]
            if (!isSupabaseConfigured) saveLocalMessages(chatId, next)
            return next
          })
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
      const messagesUpToUser = messages.slice(0, actualIdx + 1)

      // Remove last assistant message if present
      const withoutLast =
        messages[messages.length - 1].role === 'assistant'
          ? messages.slice(0, messages.length - 1)
          : messages

      setMessages(withoutLast)
      if (!isSupabaseConfigured && chatId) saveLocalMessages(chatId, withoutLast)

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
            setMessages((prev) => {
              const next = [...prev, assistantMsg]
              if (!isSupabaseConfigured && chatId) saveLocalMessages(chatId, next)
              return next
            })
            if (isSupabaseConfigured) {
              await supabase.from('messages').insert({
                chat_id: chatId!,
                role: 'assistant',
                content: fullContent,
              }).then(() => {}, () => {})
            }
          }
        },
        (_err) => {
          setIsStreaming(false)
          setStreamingContent('')
        }
      )

      void onTitleUpdate
    },
    [chatId, isStreaming, messages, settings]
  )

  const clearMessages = useCallback(async () => {
    if (!chatId) return
    if (isSupabaseConfigured) {
      await supabase.from('messages').delete().eq('chat_id', chatId).then(() => {}, () => {})
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('codebolt_msgs_' + chatId)
    }
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
