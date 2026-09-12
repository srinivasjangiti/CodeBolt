import React, { useState } from 'react'
import { Zap, ShieldCheck, ExternalLink, Copy, Check, Sparkles } from 'lucide-react'

interface EnvSetupScreenProps {
  missingVars?: {
    VITE_CLERK_PUBLISHABLE_KEY?: boolean
    VITE_SUPABASE_URL?: boolean
    VITE_SUPABASE_ANON_KEY?: boolean
  }
}

export function EnvSetupScreen({ missingVars = {} }: EnvSetupScreenProps) {
  const [clerkKey, setClerkKey] = useState('')
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleQuickSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (clerkKey.trim()) {
      localStorage.setItem('VITE_CLERK_PUBLISHABLE_KEY', clerkKey.trim())
    }
    if (supabaseUrl.trim()) {
      localStorage.setItem('VITE_SUPABASE_URL', supabaseUrl.trim())
    }
    if (supabaseAnonKey.trim()) {
      localStorage.setItem('VITE_SUPABASE_ANON_KEY', supabaseAnonKey.trim())
    }
    setSaved(true)
    setTimeout(() => {
      window.location.reload()
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-3xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-medium tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5 fill-amber-400" />
            Vercel Deployment Active &bull; Environment Setup Required
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2.5">
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">CODEBOLT</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Your application is live on Vercel! To connect authentication and conversation storage, configure your environment keys below.
          </p>
        </div>

        {/* Option 1: Quick Browser Setup */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Instant Preview (Browser Storage)</h2>
                <p className="text-xs text-zinc-400">Paste your keys to launch CODEBOLT immediately in this browser</p>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 text-zinc-300">Quick Test</span>
          </div>

          <form onSubmit={handleQuickSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                <span>Clerk Publishable Key (<code>VITE_CLERK_PUBLISHABLE_KEY</code>)</span>
                <a
                  href="https://dashboard.clerk.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 text-[11px]"
                >
                  Get Key <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="text"
                placeholder="pk_test_..."
                value={clerkKey}
                onChange={(e) => setClerkKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-700/80 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Supabase URL</span>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 text-[11px]"
                  >
                    Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <input
                  type="text"
                  placeholder="https://xxxx.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-700/80 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Supabase Anon Key</span>
                  <span className="text-[11px] text-zinc-500">API Key</span>
                </label>
                <input
                  type="text"
                  placeholder="eyJhbGciOi..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950/80 border border-zinc-700/80 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!clerkKey.trim() && !supabaseUrl.trim()}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-semibold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" /> Saved! Launching...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-zinc-950" /> Save & Launch CodeBolt
                </>
              )}
            </button>
          </form>
        </div>

        {/* Option 2: Permanent Vercel Configuration */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Permanent Setup (Recommended for Production)</h2>
              <p className="text-xs text-zinc-400">Add these 3 environment variables in your Vercel Project Dashboard</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {[
              {
                name: 'VITE_CLERK_PUBLISHABLE_KEY',
                desc: 'Your Clerk Publishable Key (from clerk.com dashboard -> API Keys)',
                link: 'https://dashboard.clerk.com',
                source: 'Clerk Dashboard',
              },
              {
                name: 'VITE_SUPABASE_URL',
                desc: 'Your Supabase Project URL (https://xxxx.supabase.co)',
                link: 'https://supabase.com/dashboard',
                source: 'Supabase Settings -> API',
              },
              {
                name: 'VITE_SUPABASE_ANON_KEY',
                desc: 'Your Supabase Public Anonymous API Key (anon / public)',
                link: 'https://supabase.com/dashboard',
                source: 'Supabase Settings -> API',
              },
              {
                name: 'VITE_NVIDIA_API_KEY',
                desc: '(Optional) Default NVIDIA NIM API key (can also be entered by users in UI)',
                link: 'https://build.nvidia.com',
                source: 'NVIDIA NIM',
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {item.name}
                    </code>
                    {missingVars[item.name as keyof typeof missingVars] && (
                      <span className="text-[10px] font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        Missing
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item.name, item.name)}
                      className="text-zinc-500 hover:text-zinc-300 transition"
                      title="Copy Variable Name"
                    >
                      {copiedKey === item.name ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400">{item.desc}</p>
                </div>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="self-start sm:self-center text-xs font-medium text-zinc-400 hover:text-white inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 transition"
                >
                  {item.source} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>

          {/* Step-by-step instructions */}
          <div className="pt-2 text-xs text-zinc-400 space-y-1.5 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/60">
            <p className="font-semibold text-zinc-200">How to add in Vercel:</p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400">
              <li>Open your <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="text-amber-400 underline">Vercel Dashboard</a> &rarr; Select the <span className="text-white font-medium">codebolt</span> project.</li>
              <li>Go to <span className="text-white font-medium">Settings</span> &rarr; <span className="text-white font-medium">Environment Variables</span>.</li>
              <li>Add each variable name and its value (check Production, Preview, Development).</li>
              <li>Go to the <span className="text-white font-medium">Deployments</span> tab &rarr; click &ldquo;...&rdquo; on the latest deployment &rarr; <span className="text-white font-medium">Redeploy</span>.</li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  )
}
