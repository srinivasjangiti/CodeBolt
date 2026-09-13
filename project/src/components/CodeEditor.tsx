import { useMemo, useState, useEffect, useRef } from 'react'
import { FileText, Copy, Check, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VirtualFile } from '@/hooks/useProjectFiles'

interface CodeEditorProps {
  file: VirtualFile | null
  onChange?: (path: string, content: string) => void
}

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'TypeScript', tsx: 'TSX', js: 'JavaScript', jsx: 'JSX',
    json: 'JSON', css: 'CSS', scss: 'SCSS', html: 'HTML', md: 'Markdown',
    py: 'Python', sh: 'Bash', yml: 'YAML', yaml: 'YAML', txt: 'Plain Text',
    rs: 'Rust', go: 'Go', java: 'Java', cpp: 'C++', c: 'C', cs: 'C#',
    rb: 'Ruby', php: 'PHP', swift: 'Swift', kt: 'Kotlin', sql: 'SQL',
  }
  return map[ext] ?? 'Text'
}

function getFileBadgeColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'text-blue-400', tsx: 'text-blue-400', js: 'text-yellow-400',
    jsx: 'text-yellow-400', json: 'text-yellow-600', css: 'text-blue-300',
    scss: 'text-pink-400', html: 'text-orange-400', md: 'text-gray-400',
    py: 'text-green-400', rs: 'text-orange-500', go: 'text-cyan-400',
  }
  return map[ext] ?? 'text-muted-foreground'
}

export function CodeEditor({ file, onChange }: CodeEditorProps) {
  const [content, setContent] = useState(file?.content ?? '')
  const [copied, setCopied] = useState(false)
  const [isEdited, setIsEdited] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setContent(file?.content ?? '')
    setIsEdited(false)
  }, [file?.path, file?.content])

  const lines = useMemo(() => content.split('\n'), [content])
  const language = file ? detectLanguage(file.name) : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)
    setIsEdited(true)
    if (file && onChange) {
      onChange(file.path, val)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle tab indent
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      setContent(newContent)
      setIsEdited(true)
      if (file && onChange) {
        onChange(file.path, newContent)
      }
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  if (!file) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground/30 select-none bg-background">
        <div className="text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-border/30 bg-muted/10 mx-auto">
            <FileText className="size-10 opacity-30 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium tracking-wide text-muted-foreground">No file open</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Select a file from the Explorer or upload a project</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[#0d1117] font-mono text-sm">
      {/* File info bar */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border/50 bg-[#161b22] px-4">
        <FileText className={`size-3.5 ${getFileBadgeColor(file.name)}`} />
        <span className="text-xs text-zinc-200 font-medium truncate max-w-sm">{file.path}</span>
        
        {isEdited && (
          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.2 rounded">
            <Save className="size-2.5" /> saved
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
            {language}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {lines.length} lines
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            className="size-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
            title="Copy file contents"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          </Button>
        </div>
      </div>

      {/* Code editing surface */}
      <div className="flex-1 overflow-auto relative flex">
        {/* Line numbers gutter */}
        <div
          className="select-none border-r border-zinc-800 bg-[#0d1117] py-4 pr-3 text-right text-xs font-mono text-zinc-600 leading-6 shrink-0"
          style={{ minWidth: `${Math.max(String(lines.length).length * 8 + 24, 42)}px` }}
        >
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Editable code textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 resize-none bg-transparent p-4 font-mono text-xs leading-6 text-zinc-100 outline-none border-0 overflow-auto whitespace-pre font-normal"
          style={{ tabSize: 2 }}
        />
      </div>
    </div>
  )
}
