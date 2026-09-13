import type { Message, ChatSettings } from '@/types'
import { ALL_MODELS } from '@/types'
// Use local proxy endpoint instead of direct API calls
const PROXY_BASE = import.meta.env.DEV ? 'http://localhost:3001' : ''
const FALLBACK_MODEL = 'mistralai/mistral-small-4-119b-2603'

export interface NvidiaMessage {
  role: string
  content: string | any[]
}

export async function streamChat(
  messages: NvidiaMessage[],
  model: string,
  settings: ChatSettings,
  signal?: AbortSignal,
  onChunk?: (text: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  const systemMessage: NvidiaMessage = {
    role: 'system',
    content: settings.systemPrompt,
  }

  const allMessages = [systemMessage, ...messages]

  try {
    const sendRequest = async (requestedModel: string) => {
      // Find the model to determine its provider
      const modelConfig = ALL_MODELS.find(m => m.id === requestedModel) || settings.customModels?.find(m => m.id === requestedModel);
      const provider = modelConfig?.provider || 'nvidia';
      
      let apiKey = '';
      let baseUrl = '';

      if (provider === 'gemini') {
        apiKey = settings.apiKeys?.gemini || '';
        baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/v1'; // Gemini OpenAI compatible endpoint
      } else if (provider === 'openai') {
        apiKey = settings.apiKeys?.openai || '';
        baseUrl = 'https://api.openai.com/v1';
      } else if (provider === 'custom') {
        apiKey = settings.apiKeys?.custom || '';
        baseUrl = settings.customProviderUrl || '';
      } else {
        // Default to NVIDIA
        apiKey = settings.apiKeys?.nvidia || localStorage.getItem('VITE_NVIDIA_API_KEY') || import.meta.env.VITE_NVIDIA_API_KEY || '';
        baseUrl = 'https://integrate.api.nvidia.com/v1';
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['x-api-key'] = apiKey;
        headers['x-nvidia-api-key'] = apiKey;
      }
      if (baseUrl) {
        headers['x-base-url'] = baseUrl;
      }
      
      const response = await fetch(`${PROXY_BASE}/api/chat/completions`, {
        method: 'POST',
        headers,
        signal,
        body: JSON.stringify({
          model: requestedModel,
          messages: allMessages,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        const notFoundForAccount =
          response.status === 404 && errorText.toLowerCase().includes('not found for account')

        // Fallback only for NVIDIA default model if not found
        if (provider === 'nvidia' && notFoundForAccount && requestedModel !== FALLBACK_MODEL) {
          return sendRequest(FALLBACK_MODEL)
        }

        throw new Error(`API error ${response.status}: ${errorText}`)
      }

      return response
    }

    const response = await sendRequest(model)

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.slice(6))
          const delta = json.choices?.[0]?.delta?.content
          if (delta) onChunk?.(delta)
        } catch {
          // skip malformed chunks
        }
      }
    }

    onDone?.()
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      onDone?.()
      return
    }
    onError?.(err instanceof Error ? err : new Error(String(err)))
  }
}

export function messagesToNvidia(messages: Message[]): NvidiaMessage[] {
  return messages.map((m) => {
    let content: any = m.content
    try {
      if (m.content.trim().startsWith('[') && m.content.trim().endsWith(']')) {
        const parsed = JSON.parse(m.content)
        if (Array.isArray(parsed)) {
          content = parsed
        }
      }
    } catch {
      // Fallback to string
    }
    return { role: m.role, content }
  })
}
