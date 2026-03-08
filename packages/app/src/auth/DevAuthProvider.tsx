import { useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { AuthAccount } from '@/auth/AuthContext'
import { AuthContext } from '@/auth/AuthContext'

// ── Credenziali dev ──────────────────────────────────────────
const DEV_USERNAME = 'admin'
const DEV_PASSWORD = 'admin'
const DEV_TOKEN    = 'dev-token-not-for-production'

const DEV_ACCOUNT: AuthAccount = {
  name:           'Admin Dev',
  username:       'admin@dev.local',
  localAccountId: 'dev-account-001',
}

/**
 * Provider di autenticazione per lo sviluppo locale.
 *
 * Credenziali: admin / admin
 * Attivo SOLO quando AZURE_CLIENT_ID contiene il placeholder 'xxxx'.
 * In produzione viene sostituito da MsalAuthProvider automaticamente.
 */
export function DevAuthProvider({ children }: { readonly children: ReactNode }) {
  const [account, setAccount] = useState<AuthAccount | null>(() => {
    // Ripristina sessione da sessionStorage (come MSAL)
    const saved = sessionStorage.getItem('dev-auth')
    return saved ? JSON.parse(saved) : null
  })

  const isAuthenticated = account !== null

  const login = useCallback(async (username?: string, password?: string) => {
    if (username !== DEV_USERNAME || password !== DEV_PASSWORD) {
      throw new Error('Credenziali non valide')
    }
    sessionStorage.setItem('dev-auth', JSON.stringify(DEV_ACCOUNT))
    setAccount(DEV_ACCOUNT)
  }, [])

  const logout = useCallback(async () => {
    sessionStorage.removeItem('dev-auth')
    setAccount(null)
  }, [])

  const getToken = useCallback(async (): Promise<string> => {
    if (!account) throw new Error('Non autenticato — eseguire login')
    return DEV_TOKEN
  }, [account])

  const value = useMemo(() => ({
    isAuthenticated,
    account,
    getToken,
    login,
    logout,
  }), [isAuthenticated, account, getToken, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

