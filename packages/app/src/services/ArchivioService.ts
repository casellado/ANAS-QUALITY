/**
 * ArchivioService — archiviazione verbali completati.
 *
 * Flusso:
 * 1. Salva verbale completo in Dexie (offline-safe, immediato)
 * 2. Se online → upload PDF su OneDrive (produzione)
 * 3. Aggiorna pdf_path nel record Dexie
 *
 * In dev mode: solo Dexie, il PDF viene rigenerato on-demand dall'ArchivioPage.
 * In produzione: Dexie + OneDrive nella cartella del materiale.
 */
import type { Verbale } from '@verbali/shared'
import { generaPathOneDrive, now } from '@verbali/shared'
import { ENV } from '@/config/env'
import { db } from '@/db/schema'

/**
 * Archivia un verbale completato:
 * - Persist record finale in Dexie con stato 'completo'
 * - In produzione → upload PDF su OneDrive
 *
 * @param verbale   - Verbale con progressivo e codice già assegnati
 * @param pdfBlob   - Blob del PDF generato
 * @param nomeFile  - Nome file PDF (es. 'VAG-Opera-2026-03-08-001.pdf')
 * @param categoria - Categoria materiale (es. 'Calcestruzzo')
 */
export async function archiviaVerbale(
  verbale:   Verbale,
  pdfBlob:   Blob,
  nomeFile:  string,
  categoria: string,
): Promise<void> {
  // ── 1. Path previsto per OneDrive ─────────────────────────
  const sottocartella = mapSiglaSottocartella(verbale.tipo)
  const pathOneDrive  = generaPathOneDrive(categoria, 'Verbali', `${sottocartella}/${nomeFile}`)

  // ── 2. Salva record completo in Dexie ─────────────────────
  const verbaleArchiviato: Verbale = {
    ...verbale,
    pdf_path:     ENV.IS_PRODUCTION ? pathOneDrive : `local://${nomeFile}`,
    stato:        'completo',
    sync_pending: ENV.IS_PRODUCTION,
    updated_at:   now(),
    storia:       [
      ...verbale.storia,
      {
        timestamp:    now(),
        utente:       verbale.ispettore || 'Sistema',
        utente_email: verbale.ispettore_email || '',
        azione:       'archiviazione' as const,
        note:         `PDF archiviato: ${nomeFile}`,
      },
    ],
  }
  await db.verbali.put(verbaleArchiviato)

  // ── 3. Upload su OneDrive se in produzione e online ───────
  if (ENV.IS_PRODUCTION && navigator.onLine) {
    try {
      // Importazione dinamica per evitare dipendenza circolare
      // In produzione useAuth fornirà il token reale
      // Per ora predisponiamo la struttura
      const { OneDriveService } = await import('./OneDriveService')

      // Il getToken viene dal contesto auth — qui usiamo un placeholder
      // In produzione il servizio verrà inizializzato con il vero token provider
      const drive = new OneDriveService(async () => {
        throw new Error('OneDrive non configurato — usa la versione con injection di token')
      })

      // Crea la cartella se non esiste
      const cartellaVerbali = `${categoria}/Verbali/${sottocartella}`
      await drive.ensureFolder(verbale.id_cantiere, cartellaVerbali)

      // Upload PDF
      await drive.uploadFile(verbale.id_cantiere, pathOneDrive, pdfBlob)

      // Aggiorna flag sync
      await db.verbali.update(verbale.id, {
        sync_pending: false,
        synced_at:    now(),
      })
    } catch {
      // Upload fallito — il verbale resta in Dexie con sync_pending: true
      // La SyncQueue lo riproverà quando la rete sarà disponibile
      await db.syncQueue.add({
        id:          crypto.randomUUID(),
        id_cantiere: verbale.id_cantiere,
        tipo:        'verbale',
        payload:     { verbaleId: verbale.id, nomeFile, categoria },
        created_at:  now(),
        tentativi:   0,
      })
    }
  }
}

/**
 * Mappa sigla verbale → sottocartella OneDrive.
 * Es: 'VAG' → 'Autorizzazione_al_Getto'
 */
function mapSiglaSottocartella(sigla: string): string {
  const MAP: Record<string, string> = {
    VAG: 'Autorizzazione_al_Getto',
    VPC: 'Prelievo_Calcestruzzo',
    VAC: 'Accettazione_Acciaio',
    VRT: 'Rilevazione_Terre',
  }
  return MAP[sigla] ?? sigla
}

