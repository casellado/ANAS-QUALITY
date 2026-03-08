import { createContext, useContext } from 'react'
import { ENV } from '@/config/env'

// ── Account info condivisa ───────────────────────────────────
export interface AuthAccount {
  readonly name: string
  readonly username: string
  readonly localAccountId: string
}

// ── Interfaccia auth unificata (MSAL + Dev) ──────────────────
export interface AuthContextValue {
  readonly isAuthenticated: boolean
  readonly account: AuthAccount | null
  readonly getToken: () => Promise<string>
  readonly login: (username?: string, password?: string) => Promise<void>
  readonly logout: () => Promise<void>
}

// ── Context ──────────────────────────────────────────────────
export const AuthContext = createContext<AuthContextValue | null>(null)

// ── Hook unificato ───────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro <AuthProvider>')
  return ctx
}

// ── Dev mode detection ───────────────────────────────────────
export const IS_DEV_AUTH = !ENV.IS_PRODUCTION && ENV.AZURE_CLIENT_ID.includes('xxxx')

