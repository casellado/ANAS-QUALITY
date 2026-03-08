import { ENV } from '@/config/env'

/**
 * Wrapper per Microsoft Graph API v1.0.
 * Tutte le operazioni su file OneDrive passano da qui.
 *
 * Path convention: tutti i path sono RELATIVI alla root del cantiere.
 * Root cantiere = /{ENV.ONEDRIVE_ROOT}/{idCantiere}/
 *
 * Esempio:
 *   idCantiere = 'CAN-001'
 *   pathRelativo = 'Calcestruzzo/Verbali/VPC-A3Napoli-048.pdf'
 *   → OneDrive: /Verbali_Cantiere_TEST/CAN-001/Calcestruzzo/Verbali/VPC-A3Napoli-048.pdf
 */
export class OneDriveService {
  private readonly getToken: () => Promise<string>

  constructor(getToken: () => Promise<string>) {
    this.getToken = getToken
  }

  // ── Path helpers ────────────────────────────────────────────

  private rootPath(idCantiere: string): string {
    return ENV.ONEDRIVE_ROOT
      ? `/me/drive/root:/${ENV.ONEDRIVE_ROOT}/${idCantiere}`
      : `/me/drive/root:/${idCantiere}`
  }

  private itemUrl(idCantiere: string, path: string): string {
    return `https://graph.microsoft.com/v1.0${this.rootPath(idCantiere)}/${path}`
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken()
    return { Authorization: `Bearer ${token}` }
  }

  // ── Lettura con ETag (per optimistic locking) ────────────────

  /**
   * Legge un file JSON restituendo anche l'ETag per optimistic locking.
   * Usato da ContatoriService e ProveService.
   *
   * @returns { data, etag } | { data: null, etag: '' } se 404
   * @throws  Error per altri status code
   */
  async readWithEtag<T>(
    idCantiere: string,
    path:       string
  ): Promise<{ data: T; etag: string } | { data: null; etag: '' }> {
    const headers = await this.authHeaders()
    const response = await fetch(`${this.itemUrl(idCantiere, path)}:/content`, { headers })

    if (response.status === 404) return { data: null, etag: '' }
    if (!response.ok) throw new Error(`Graph API ${response.status}: ${response.statusText}`)

    const etag = response.headers.get('ETag') ?? ''
    const data = await response.json() as T
    return { data, etag }
  }

  /**
   * Scrive un file JSON con condizione ETag (If-Match).
   * Usato per aggiornamenti conflict-safe (progressivi, prove).
   *
   * @returns true se scrittura OK, false se 412 Precondition Failed (conflict)
   */
  async writeWithEtag<T>(
    idCantiere: string,
    path:       string,
    data:       T,
    etag:       string
  ): Promise<boolean> {
    const headers = await this.authHeaders()
    const response = await fetch(`${this.itemUrl(idCantiere, path)}:/content`, {
      method:  'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'If-Match':     etag,
      },
      body: JSON.stringify(data),
    })

    if (response.status === 412) return false // Conflict — qualcun altro ha scritto
    if (!response.ok) throw new Error(`Graph API ${response.status}: ${response.statusText}`)
    return true
  }

  // ── Lettura semplice ────────────────────────────────────────

  async read<T>(idCantiere: string, path: string): Promise<T> {
    const headers = await this.authHeaders()
    const response = await fetch(`${this.itemUrl(idCantiere, path)}:/content`, { headers })
    if (!response.ok) throw new Error(`Graph API ${response.status}: ${response.statusText}`)
    return response.json() as Promise<T>
  }

  // ── Scrittura semplice (sovrascrive) ────────────────────────

  async write<T>(idCantiere: string, path: string, data: T): Promise<void> {
    const headers = await this.authHeaders()
    const response = await fetch(`${this.itemUrl(idCantiere, path)}:/content`, {
      method:  'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    })
    if (!response.ok) throw new Error(`Graph API ${response.status}: ${response.statusText}`)
  }

  // ── Upload file binario ──────────────────────────────────────

  /**
   * Upload di un file binario (PDF, JPEG).
   * REGOLA: chiamare ensureFolder() prima di questo metodo.
   *
   * @returns URL di download diretto
   */
  async uploadFile(idCantiere: string, path: string, blob: Blob): Promise<string> {
    const headers = await this.authHeaders()
    const response = await fetch(`${this.itemUrl(idCantiere, path)}:/content`, {
      method:  'PUT',
      headers: { ...headers, 'Content-Type': blob.type },
      body:    blob,
    })
    if (!response.ok) throw new Error(`Upload fallito ${response.status}: ${response.statusText}`)
    const json = await response.json() as { '@microsoft.graph.downloadUrl'?: string }
    return json['@microsoft.graph.downloadUrl'] ?? ''
  }

  // ── Gestione cartelle ────────────────────────────────────────

  /**
   * Crea la cartella se non esiste. Idempotente — sicuro da chiamare sempre.
   * REGOLA: chiamare SEMPRE prima di uploadFile.
   *
   * Crea ricorsivamente tutti i livelli mancanti.
   */
  async ensureFolder(idCantiere: string, path: string): Promise<void> {
    const headers = await this.authHeaders()
    const parts = path.split('/').filter(Boolean)

    let currentPath = ''
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      const url = `https://graph.microsoft.com/v1.0${this.rootPath(idCantiere)}/${currentPath}`

      // Controlla se esiste già
      const check = await fetch(`${url}`, { headers })
      if (check.status === 200) continue

      // Crea la cartella
      const parentUrl = currentPath.includes('/')
        ? `https://graph.microsoft.com/v1.0${this.rootPath(idCantiere)}/${currentPath.substring(0, currentPath.lastIndexOf('/'))}/children`
        : `https://graph.microsoft.com/v1.0/me/drive/root:/children`

      const create = await fetch(parentUrl, {
        method:  'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:                              part,
          folder:                            {},
          '@microsoft.graph.conflictBehavior': 'replace',
        }),
      })
      if (!create.ok && create.status !== 409) {
        throw new Error(`ensureFolder fallito per '${currentPath}': ${create.status}`)
      }
    }
  }

  /**
   * Restituisce un URL di download diretto per aprire il file nel browser.
   */
  async getDownloadUrl(idCantiere: string, path: string): Promise<string> {
    const headers = await this.authHeaders()
    const response = await fetch(`${this.itemUrl(idCantiere, path)}`, { headers })
    if (!response.ok) throw new Error(`Graph API ${response.status}: ${response.statusText}`)
    const json = await response.json() as { '@microsoft.graph.downloadUrl'?: string }
    return json['@microsoft.graph.downloadUrl'] ?? ''
  }
}
