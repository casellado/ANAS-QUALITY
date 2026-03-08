import { ENV } from '@/config/env'

interface GraphGroup {
  displayName?: string
  id?:          string
}

interface GraphGroupsResponse {
  value: GraphGroup[]
}

/**
 * Legge i gruppi Azure AD dell'utente e restituisce i cantieri autorizzati.
 * Richiede scope: GroupMember.Read.All
 *
 * @param token - access token Graph API (da useAuth().getToken())
 * @returns array di ID cantieri: ['CAN-001', 'CAN-002']
 */
export async function getCantieri(token: string): Promise<string[]> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`Impossibile leggere i gruppi Azure AD: ${response.status}`)
  }

  const { value } = await response.json() as GraphGroupsResponse

  return value
    .filter(g => g.displayName?.startsWith(ENV.AZURE_GROUP_PREFIX))
    .map(g => g.displayName!.replace(ENV.AZURE_GROUP_PREFIX, ''))
    // risultato: ['CAN-001', 'CAN-002']
}

/**
 * Verifica se l'utente è admin (gruppo 'pwa-verbali-admin').
 */
export async function isAdmin(token: string): Promise<boolean> {
  const gruppi = await getAllGruppi(token)
  return gruppi.some(g => g.displayName === 'pwa-verbali-admin')
}

/**
 * Verifica se l'utente è funzionario (può inserire/gestire prove).
 * I funzionari include anche gli admin.
 */
export async function isFunzionario(token: string): Promise<boolean> {
  const gruppi = await getAllGruppi(token)
  return gruppi.some(g =>
    g.displayName === 'pwa-verbali-funzionario' ||
    g.displayName === 'pwa-verbali-admin'
  )
}

async function getAllGruppi(token: string): Promise<GraphGroup[]> {
  const response = await fetch('https://graph.microsoft.com/v1.0/me/memberOf', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`memberOf fallito: ${response.status}`)
  const { value } = await response.json() as GraphGroupsResponse
  return value
}

/**
 * Legge il profilo base dell'utente da Azure AD.
 */
export async function getProfiloAzure(token: string): Promise<{
  givenName:  string
  surname:    string
  mail:       string
  userPrincipalName: string
}> {
  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me?$select=givenName,surname,mail,userPrincipalName',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!response.ok) throw new Error(`Profilo Azure AD non disponibile: ${response.status}`)
  return response.json()
}
