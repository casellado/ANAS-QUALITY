import type { Cantiere } from '@verbali/shared'
import { ENV } from '@/config/env'
import { getCantieri as getCantieriIds } from '@/services/PermessiService'

// ── Costanti ────────────────────────────────────────────────
const CACHE_KEY   = 'cantieri_cache'
const CACHE_TTL   = 24 * 60 * 60 * 1000 // 24 ore

interface CachedCantieri {
  readonly data: Cantiere[]
  readonly timestamp: number
}

// ── Fetch cantieri da Graph API ─────────────────────────────

/**
 * Recupera i cantieri autorizzati per l'utente loggato.
 *
 * 1. Chiama PermessiService.getCantieri per ottenere gli ID dai gruppi Azure AD
 * 2. Per ogni ID, tenta la lettura di cantiere_info.json da OneDrive
 * 3. Se 404 → crea un oggetto Cantiere con dati minimi
 * 4. Filtra solo cantieri attivi (is_attivo: true)
 * 5. Ordina per nome ASC
 *
 * @param token - access token Graph API (da useAuth().getToken())
 * @param signal - AbortSignal per cleanup useEffect
 */
export async function fetchCantieri(
  token:   string,
  signal?: AbortSignal
): Promise<Cantiere[]> {
  const ids = await getCantieriIds(token)

  const results = await Promise.all(
    ids.map(id => fetchSingoloCantiere(token, id, signal))
  )

  return results
    .filter(c => c.is_attivo)
    .sort((a, b) => a.nome.localeCompare(b.nome))
}

/**
 * Legge cantiere_info.json da OneDrive per un singolo cantiere.
 * Se il file non esiste (404), crea un oggetto Cantiere con dati minimi.
 */
async function fetchSingoloCantiere(
  token:   string,
  id:      string,
  signal?: AbortSignal
): Promise<Cantiere> {
  const rootPath = ENV.ONEDRIVE_ROOT
    ? `${ENV.ONEDRIVE_ROOT}/${id}`
    : id

  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${rootPath}/_db/cantiere_info.json:/content`

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal ?? null,
    })

    if (response.status === 404) return cantiereMinimo(id)
    if (!response.ok) return cantiereMinimo(id)

    return await response.json() as Cantiere
  } catch {
    // Rete assente o abort — ritorna dati minimi
    return cantiereMinimo(id)
  }
}

function cantiereMinimo(id: string): Cantiere {
  return {
    id,
    nome:      id,
    codice:    id,
    tratta:    '',
    provincia: '',
    regione:   '',
    is_attivo: true,
  }
}

// ── Cache localStorage ──────────────────────────────────────

/**
 * Salva i cantieri in localStorage con timestamp.
 * Al prossimo avvio mostra subito i cantieri senza attendere la rete.
 */
export function saveCantieri(cantieri: Cantiere[]): void {
  const cached: CachedCantieri = {
    data:      cantieri,
    timestamp: Date.now(),
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
}

/**
 * Legge i cantieri dalla cache localStorage.
 * Ritorna null se assente o scaduta (> 24 ore).
 */
export function loadCantieri(): Cantiere[] | null {
  const raw = localStorage.getItem(CACHE_KEY)
  if (!raw) return null

  try {
    const cached = JSON.parse(raw) as CachedCantieri
    if (Date.now() - cached.timestamp > CACHE_TTL) return null
    return cached.data
  } catch {
    return null
  }
}

