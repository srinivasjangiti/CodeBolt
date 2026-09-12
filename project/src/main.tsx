import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ClerkProvider } from "@clerk/clerk-react"

import "./index.css"
import App from "./App.tsx"
import { EnvSetupScreen } from "./components/EnvSetupScreen.tsx"
import { isSupabaseConfigured } from "./lib/supabase"

const envClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const localClerkKey = typeof window !== 'undefined' ? localStorage.getItem('VITE_CLERK_PUBLISHABLE_KEY') : null
const publishableKey = envClerkKey || localClerkKey

const isValidClerkKey = Boolean(
  publishableKey &&
  (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_'))
)

const root = createRoot(document.getElementById("root")!)

if (!isValidClerkKey) {
  root.render(
    <StrictMode>
      <EnvSetupScreen
        missingVars={{
          VITE_CLERK_PUBLISHABLE_KEY: !isValidClerkKey,
          VITE_SUPABASE_URL: !isSupabaseConfigured,
          VITE_SUPABASE_ANON_KEY: !isSupabaseConfigured,
        }}
      />
    </StrictMode>
  )
} else {
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={publishableKey}>
        <App />
      </ClerkProvider>
    </StrictMode>
  )
}
