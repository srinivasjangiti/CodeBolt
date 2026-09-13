export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  chat_id: string
  role: Role
  content: string
  created_at: string
}

export interface Chat {
  id: string
  user_id?: string | null
  title: string
  model: string
  created_at: string
  updated_at: string
}

export interface Model {
  id: string
  name: string
  description: string
  contextLength: number
  provider: 'nvidia' | 'gemini' | 'openai' | 'custom'
}

export interface CustomProvider {
  id: string
  name: string
  baseUrl: string
}

export interface ChatSettings {
  temperature: number
  maxTokens: number
  systemPrompt: string
  apiKeys: {
    nvidia?: string
    gemini?: string
    openai?: string
    custom?: string
  }
  customProviderUrl?: string
  customModels: Model[]
}

export const NVIDIA_MODELS: Model[] = [
  {
    id: 'mistralai/mistral-small-4-119b-2603',
    name: 'Mistral Small 4 119B',
    description: 'Current free-endpoint coding model',
    contextLength: 128000,
    provider: 'nvidia',
  },
  {
    id: 'deepseek-ai/deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    description: 'Fast coding and agent model',
    contextLength: 128000,
    provider: 'nvidia',
  },
  {
    id: 'deepseek-ai/deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    description: 'Higher-quality long-context coding model',
    contextLength: 128000,
    provider: 'nvidia',
  },
  {
    id: 'z-ai/glm-5.1',
    name: 'GLM 5.1',
    description: 'Agentic reasoning and coding model',
    contextLength: 131072,
    provider: 'nvidia',
  },
  {
    id: 'moonshotai/kimi-k2.6',
    name: 'Kimi K2.6',
    description: 'Large-context multimodal assistant',
    contextLength: 131072,
    provider: 'nvidia',
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'Nemotron 3 Super 120B',
    description: 'NVIDIA reasoning and planning model',
    contextLength: 131072,
    provider: 'nvidia',
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    name: 'Nemotron 3 Nano Omni',
    description: 'Multimodal reasoning model',
    contextLength: 131072,
    provider: 'nvidia',
  },
  {
    id: 'google/gemma-4-31b-it',
    name: 'Gemma 4 31B',
    description: 'Google instruction model for coding',
    contextLength: 131072,
    provider: 'nvidia',
  },
  {
    id: 'meta/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision',
    description: 'Multimodal vision model for image understanding',
    contextLength: 128000,
    provider: 'nvidia',
  },
]

export const GEMINI_MODELS: Model[] = [
  {
    id: 'gemini-1.5-pro-latest',
    name: 'Gemini 1.5 Pro',
    description: 'Highly capable multimodal model for complex tasks',
    contextLength: 2000000,
    provider: 'gemini',
  },
  {
    id: 'gemini-1.5-flash-latest',
    name: 'Gemini 1.5 Flash',
    description: 'Fast and versatile multimodal model',
    contextLength: 1000000,
    provider: 'gemini',
  },
  {
    id: 'gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Exp)',
    description: 'Experimental next-generation model',
    contextLength: 1000000,
    provider: 'gemini',
  }
]

export const OPENAI_MODELS: Model[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most advanced multimodal model from OpenAI',
    contextLength: 128000,
    provider: 'openai',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and affordable small model',
    contextLength: 128000,
    provider: 'openai',
  }
]

export const ALL_MODELS = [...NVIDIA_MODELS, ...GEMINI_MODELS, ...OPENAI_MODELS]

export const DEFAULT_SETTINGS: ChatSettings = {
  temperature: 0.6,
  maxTokens: 4096,
  systemPrompt:
    'You are CODEBOLT, an expert coding assistant. You provide precise, efficient, and production-ready code solutions. Format all code in markdown code blocks with proper language tags.',
  apiKeys: {},
  customModels: [],
}
