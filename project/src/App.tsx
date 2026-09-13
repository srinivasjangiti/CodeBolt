import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import LandingPage from '@/components/LandingPage'
import ChatApp from '@/components/ChatApp'
import { EnvSetupScreen } from '@/components/EnvSetupScreen'
import { ThemeProvider } from '@/components/theme-provider'

function ProtectedApp() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading...</div>
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />
  }

  return <ChatApp />
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<ProtectedApp />} />
      <Route path="/setup" element={<EnvSetupScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  useEffect(() => {
    // Initialize theme - always use dark theme
    const root = document.documentElement
    root.classList.add('dark')
  }, [])

  return (
    <ThemeProvider defaultTheme="dark" storageKey="codebolt-theme">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ThemeProvider>
  )
}
