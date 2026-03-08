import type { ReactNode } from 'react'
import { IS_DEV_AUTH } from '@/auth/AuthContext'
import { DevAuthProvider } from '@/auth/DevAuthProvider'
import { MsalAuthProvider } from '@/auth/MsalAuthProvider'

interface AuthProviderProps {
  readonly children: ReactNode
}

/**
 * Switch automatico tra Dev e MSAL.
 *
 * - AZURE_CLIENT_ID contiene 'xxxx' → DevAuthProvider (admin/admin)
 * - Altrimenti → MsalAuthProvider (Azure AD SSO)
 *
 * Zero modifiche al codice per il deploy in produzione.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  if (IS_DEV_AUTH) {
    return <DevAuthProvider>{children}</DevAuthProvider>
  }
  return <MsalAuthProvider>{children}</MsalAuthProvider>
}
