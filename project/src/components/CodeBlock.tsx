import { useState, useCallback, useMemo } from 'react'
import { Check, Copy, Terminal, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

interface CodeBlockProps {
  language?: string
  children: string
  className?: string
  onPreview?: (code: string) => void
}

const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  jsx: 'JSX',
  tsx: 'TSX',
  py: 'Python',
  python: 'Python',
  rs: 'Rust',
  rust: 'Rust',
  go: 'Go',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  cs: 'C#',
  csharp: 'C#',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  fish: 'Fish',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  md: 'Markdown',
  markdown: 'Markdown',
  xml: 'XML',
  dockerfile: 'Dockerfile',
  swift: 'Swift',
  kotlin: 'Kotlin',
  rb: 'Ruby',
  ruby: 'Ruby',
  php: 'PHP',
  r: 'R',
  lua: 'Lua',
}

function highlightCode(code: string, language: string): string {
  try {
    const langLower = (language || '').toLowerCase().trim()
    const validLang = langLower && hljs.getLanguage(langLower) ? langLower : null
    if (validLang) {
      return hljs.highlight(code, { language: validLang, ignoreIllegals: true }).value
    }
    return hljs.highlightAuto(code).value
  } catch {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
}

export function CodeBlock({ language = 'text', children, className, onPreview }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    navigator.clipboard.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [children])

  const label = LANGUAGE_LABELS[language.toLowerCase()] ?? language
  const isPreviewable = ['jsx', 'tsx', 'js', 'ts', 'html'].includes(language.toLowerCase()) && onPreview
  const highlightedHtml = useMemo(() => highlightCode(children, language), [children, language])
  const linesCount = useMemo(() => children.split('\n').length, [children])

  return (
    <div className={cn('group relative my-4 overflow-hidden rounded-xl border border-border/70 bg-[#0d1117] shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 bg-[#161b22] px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-amber-400/90" />
          <span className="font-mono text-[11px] font-semibold tracking-wide text-zinc-300">
            {label || 'code'}
          </span>
          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
            {linesCount} {linesCount === 1 ? 'line' : 'lines'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isPreviewable && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onPreview!(children)}
              className="size-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/15 transition-colors gap-1 px-2 w-auto font-mono text-xs"
              title="Run Live Preview"
            >
              <Play className="size-3 fill-current" />
              <span className="text-[11px]">Preview</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={copy}
            className="size-7 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Copy Code"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto p-4 text-xs font-mono leading-relaxed bg-[#0d1117]">
        <pre className="m-0 p-0 text-zinc-100">
          <code
            className={cn('font-mono hljs', `language-${language}`)}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  )
}
