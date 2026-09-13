import React, { createContext } from 'react'
import { ClerkProvider as RealClerkProvider, useAuth as useRealAuth, useUser as useRealUser, SignedIn as RealSignedIn, SignedOut as RealSignedOut, SignInButton as RealSignInButton, SignUpButton as RealSignUpButton, UserButton as RealUserButton } from '@clerk/clerk-react'

const envClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
const localClerkKey = typeof window !== 'undefined' ? localStorage.getItem('VITE_CLERK_PUBLISHABLE_KEY') : null
const publishableKey = envClerkKey || localClerkKey

export const isValidClerkKey = Boolean(
  publishableKey &&
  (publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_'))
)

interface AuthContextType {
  isLoaded: boolean
  isSignedIn: boolean
  userId: string
  userName: string
}

const GuestAuthContext = createContext<AuthContextType>({
  isLoaded: true,
  isSignedIn: true,
  userId: 'guest_developer',
  userName: 'Guest Developer',
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isValidClerkKey && publishableKey) {
    return <RealClerkProvider publishableKey={publishableKey}>{children}</RealClerkProvider>
  }

  // Graceful fallback for demo / production when Clerk keys are not yet configured in Vercel
  return (
    <GuestAuthContext.Provider
      value={{
        isLoaded: true,
        isSignedIn: true,
        userId: 'guest_developer',
        userName: 'Guest Developer',
      }}
    >
      {children}
    </GuestAuthContext.Provider>
  )
}

export function useAuth() {
  if (isValidClerkKey) {
    return useRealAuth()
  }
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: 'guest_developer',
    sessionId: 'guest_session',
    getToken: async () => null,
    signOut: async () => {},
  }
}

export function useUser() {
  if (isValidClerkKey) {
    return useRealUser()
  }
  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'guest_developer',
      fullName: 'Guest Developer',
      firstName: 'Guest',
      primaryEmailAddress: { emailAddress: 'guest@codebolt.dev' },
      imageUrl: '',
    },
  }
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  if (isValidClerkKey) {
    return <RealSignedIn>{children}</RealSignedIn>
  }
  return <>{children}</>
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  if (isValidClerkKey) {
    return <RealSignedOut>{children}</RealSignedOut>
  }
  return null
}

export function SignInButton({ children }: { children: React.ReactNode; mode?: string }) {
  if (isValidClerkKey) {
    return <RealSignInButton mode="modal">{children}</RealSignInButton>
  }
  return <>{children}</>
}

export function SignUpButton({ children }: { children: React.ReactNode; mode?: string }) {
  if (isValidClerkKey) {
    return <RealSignUpButton mode="modal">{children}</RealSignUpButton>
  }
  return <>{children}</>
}

export function UserButton() {
  if (isValidClerkKey) {
    return <RealUserButton />
  }
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      <span>Guest Dev</span>
    </div>
  )
}
