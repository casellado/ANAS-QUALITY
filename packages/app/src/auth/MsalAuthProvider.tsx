import { useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { MsalProvider, useMsal, useIsAuthenticated, useAccount } from '@azure/msal-react'
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser'
import { msalConfig, graphScopes } from '@/config/msal.config'
import type { AuthAccount } from '@/auth/AuthContext'
import { AuthContext } from '@/auth/AuthContext'

/** Singleton MSAL instance — creata una sola volta fuori dal render tree */
const msalInstance = new PublicClientApplication(msalConfig)

// ── Inner component per usare hooks MSAL dentro MsalProvider ──
function MsalAuthBridge({ children }: { readonly children: ReactNode }) {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const msalAccount = useAccount(accounts[0] ?? undefined)

  // Mappa AccountInfo MSAL → AuthAccount condiviso
  const account: AuthAccount | null = useMemo(() => {
    if (!msalAccount) return null
    return {
      name:           msalAccount.name ?? msalAccount.username,
      username:       msalAccount.username,
      localAccountId: msalAccount.localAccountId,
    }
  }, [msalAccount])

  const getToken = useCallback(async (): Promise<string> => {
    if (!msalAccount) throw new Error('Nessun account autenticato — eseguire login prima')

    try {
      const response = await instance.acquireTokenSilent({
        scopes:  graphScopes.files,
        account: msalAccount,
      })
      return response.accessToken
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await instance.acquireTokenPopup({
          scopes:  graphScopes.loginRequest,
          account: msalAccount,
        })
        return response.accessToken
      }
      throw error
    }
  }, [instance, msalAccount])

  const login = useCallback(
    async () => { await instance.loginPopup({ scopes: graphScopes.loginRequest }) },
    [instance]
  )

  const logout = useCallback(
    async () => { await instance.logoutPopup({ account: msalAccount ?? null }) },
    [instance, msalAccount]
  )

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

/**
 * Provider MSAL per produzione.
 * Wrappa MsalProvider + bridge che alimenta AuthContext unificato.
 */
export function MsalAuthProvider({ children }: { readonly children: ReactNode }) {
  return (
    <MsalProvider instance={msalInstance}>
      <MsalAuthBridge>{children}</MsalAuthBridge>
    </MsalProvider>
  )
}

