/**
 * @file useAuth.ts
 *
 * Re-export del hook unificato da AuthContext.
 * Tutti i componenti importano da qui — non serve sapere se è MSAL o Dev.
 */
export { useAuth } from '@/auth/AuthContext'
export type { AuthAccount, AuthContextValue } from '@/auth/AuthContext'
