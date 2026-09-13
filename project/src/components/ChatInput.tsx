import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Square, Paperclip, X, FileText, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import JSZip from 'jszip'
import { toast } from 'sonner'
import type { VirtualFile } from '@/hooks/useProjectFiles'

interface AttachedFile {
  name: string
  content: string
  size: number
}

export const SLASH_COMMANDS = [
  { prefix: '/fix', label: 'Fix Bugs', prompt: 'Analyze this project/file for syntax errors, logic bugs, and edge cases, and provide fixes.' },
  { prefix: '/refactor', label: 'Refactor', prompt: 'Refactor this code to improve readability, modularity, and adherence to modern best practices.' },
  { prefix: '/test', label: 'Tests', prompt: 'Write comprehensive automated test suites covering edge cases and error states.' },
  { prefix: '/explain', label: 'Explain', prompt: 'Explain the architecture and logic of this code step-by-step with clear diagrams or bullet points.' },
]

interface ChatInputProps {
  onSend: (content: string, images?: string[]) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
  placeholder?: string
  onProjectLoad?: (files: VirtualFile[], projectName: string) => void
}

export function ChatInput({ onSend, onStop, isStreaming, disabled, placeholder, onProjectLoad }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isListening, setIsListening] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognition = useRef<any>(null)

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  // Setup Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition()
        recognition.current.continuous = false
        recognition.current.interimResults = false

        recognition.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setValue(prev => prev ? prev + ' ' + transcript : transcript)
        }
        
        recognition.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error)
          setIsListening(false)
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied. Please allow it in your browser settings.')
          }
        }
        
        recognition.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognition.current) {
      toast.error("Your browser doesn't support speech recognition.")
      return
    }

    if (isListening) {
      recognition.current.stop()
      setIsListening(false)
    } else {
      try {
        recognition.current.start()
        setIsListening(true)
      } catch (err) {
        console.error("Speech recognition failed to start", err)
      }
    }
  }

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if ((!trimmed && images.length === 0 && attachedFiles.length === 0) || isStreaming || disabled) return

    let userText = trimmed
    for (const cmd of SLASH_COMMANDS) {
      if (userText === cmd.prefix || userText.startsWith(cmd.prefix + ' ')) {
        const extra = userText.slice(cmd.prefix.length).trim()
        userText = extra ? `${cmd.prompt}\n\nAdditional instructions: ${extra}` : cmd.prompt
        break
      }
    }

    let combinedContent = userText
    if (attachedFiles.length > 0) {
      const fileTexts = attachedFiles.map(f => `--- File: ${f.name} ---\n${f.content}`).join('\n\n')
      combinedContent = userText ? `${userText}\n\n${fileTexts}` : fileTexts
    }

    onSend(combinedContent, images.length > 0 ? images : undefined)
    setValue('')
    setImages([])
    setAttachedFiles([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, images, attachedFiles, isStreaming, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            setImages(prev => [...prev, e.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
      } else if (file.name.endsWith('.zip')) {
        const reader = new FileReader()
        reader.onload = async (e) => {
          if (e.target?.result instanceof ArrayBuffer) {
            try {
              const zip = new JSZip()
              const zipContent = await zip.loadAsync(e.target.result)
              let combinedContent = ''
              let totalSize = 0
              let fileCount = 0
              const extractedVirtualFiles: import('@/hooks/useProjectFiles').VirtualFile[] = []

              for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
                if (zipEntry.dir) continue
                // Skip binary files and common ignores
                if (filename.includes('node_modules/') || filename.includes('.git/') || filename.match(/\.(png|jpg|jpeg|gif|ico|pdf|zip|tar|gz|mp4|webm|mp3|wav|ogg|wasm|exe)$/i)) {
                  continue
                }
                const textContent = await zipEntry.async('string')
                combinedContent += `\n\n--- File: ${filename} ---\n${textContent}`
                totalSize += textContent.length
                fileCount++
                // Collect for file explorer
                const parts = filename.split('/')
                extractedVirtualFiles.push({
                  path: filename,
                  name: parts[parts.length - 1],
                  content: textContent,
                })
              }

              if (fileCount > 0) {
                // Populate the file explorer with extracted files
                if (onProjectLoad) {
                  onProjectLoad(extractedVirtualFiles, file.name)
                }
                setAttachedFiles(prev => [...prev, {
                  name: `${file.name} (${fileCount} files)`,
                  content: combinedContent.trim(),
                  size: totalSize
                }])
                toast.success(`Extracted ${fileCount} files from ${file.name}`)
              } else {
                toast.error(`No text files found in ${file.name}`)
              }
            } catch (err) {
              console.error('Failed to parse ZIP', err)
              toast.error(`Failed to parse ${file.name}`)
            }
          }
        }
        reader.readAsArrayBuffer(file)
      } else {
        // Assume text file
        const reader = new FileReader()
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string') {
            setAttachedFiles(prev => [...prev, {
              name: file.name,
              content: e.target!.result as string,
              size: file.size
            }])
          }
        }
        reader.readAsText(file)
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const removeAttachedFile = (indexToRemove: number) => {
    setAttachedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div className="bg-transparent px-4">
      <div className="mx-auto max-w-3xl">
        {(images.length > 0 || attachedFiles.length > 0) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <div key={`img-${idx}`} className="relative group rounded-md border border-border overflow-hidden size-16 bg-muted/50">
                <img src={img} alt="Attachment" className="object-cover w-full h-full" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-0.5 rounded-md bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            
            {attachedFiles.map((f, idx) => (
              <div key={`file-${idx}`} className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs group">
                <FileText className="size-3.5 text-muted-foreground" />
                <span className="max-w-[150px] truncate font-medium text-foreground/80">{f.name}</span>
                <span className="text-[10px] text-muted-foreground">({Math.round(f.size / 1024)}kb)</span>
                <button
                  onClick={() => removeAttachedFile(idx)}
                  className="ml-1 rounded-md p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 text-muted-foreground transition-all"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Quick Prompts / Slash Commands */}
        {!isStreaming && !value && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5 px-2">
            <span className="text-[11px] font-medium text-muted-foreground/80 mr-1">Quick prompts:</span>
            {SLASH_COMMANDS.map(cmd => (
              <button
                key={cmd.prefix}
                type="button"
                onClick={() => setValue(cmd.prompt)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-400"
              >
                <span className="font-semibold text-amber-400">{cmd.prefix}</span>
                <span>{cmd.label}</span>
              </button>
            ))}
          </div>
        )}
        
        <div
          className={cn(
            'flex items-end gap-2 rounded-3xl border border-border/40 bg-card/50 shadow-sm transition-colors py-1',
            'focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20',
            disabled && 'opacity-60'
          )}
        >
          {/* Hidden File Input */}
          <input 
            type="file" 
            accept="image/*,.zip,text/*,.js,.ts,.jsx,.tsx,.py,.json,.md,.html,.css,.csv" 
            multiple 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
          />

          <div className="flex m-1.5 gap-1 shrink-0">
            {/* File attachment */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled || isStreaming}
                  className="size-7 text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach files (Images, Text, ZIP)</TooltipContent>
            </Tooltip>

            {/* Mic Dictation */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled || isStreaming}
                  className={cn("size-7 text-muted-foreground transition-colors", isListening && "text-red-500 hover:text-red-600 bg-red-500/10")}
                  onClick={toggleListening}
                >
                  <Mic className={cn("size-4", isListening && "animate-pulse")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isListening ? "Stop listening" : "Dictate with Voice"}</TooltipContent>
            </Tooltip>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
            }}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening...' : (placeholder ?? 'Message CODEBOLT... (Shift+Enter for newline)')}
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground/60',
              'max-h-[200px] min-h-[40px]',
              isListening && 'placeholder:text-red-500/60'
            )}
          />

          {/* Send / Stop */}
          <div className="m-1.5 shrink-0">
            {isStreaming ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    onClick={onStop}
                    className="size-7"
                  >
                    <Square className="size-3.5 fill-current" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop generating</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon-sm"
                    onClick={handleSend}
                    disabled={(!value.trim() && images.length === 0 && attachedFiles.length === 0) || disabled}
                    className={cn('size-7', (!value.trim() && images.length === 0 && attachedFiles.length === 0) && 'opacity-40')}
                  >
                    <Send className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send (Enter)</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/50">
          AI can make mistakes. Verify important code before shipping.
        </p>
      </div>
    </div>
  )
}
