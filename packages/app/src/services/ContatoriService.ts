import type { Contatori } from '@verbali/shared'
import type { OneDriveService } from './OneDriveService'

const MAX_RETRY    = 5
const BACKOFF_BASE = 200   // ms

/**
 * Aspetta un tempo con backoff esponenziale + jitter.
 * Previene la sincronizzazione degli retry tra più ispettori.
 */
function sleep(attempt: number): Promise<void> {
  const delay = BACKOFF_BASE * Math.pow(2, attempt) + Math.random() * 100
  return new Promise(r => setTimeout(r, delay))
}

/**
 * Ottiene il prossimo numero progressivo per un tipo verbale su un cantiere.
 *
 * ALGORITMO ETag Optimistic Locking:
 * 1. Leggi contatori.json con ETag
 * 2. Incrementa in memoria
 * 3. Scrivi con If-Match: {ETag}
 * 4. 412 Precondition Failed → qualcun altro ha scritto → riprova da 1
 * 5. Dopo MAX_RETRY → errore chiaro all'utente
 *
 * @param idCantiere - es: 'CAN-001'
 * @param sigla      - es: 'VPC', 'VAG', 'VAC'
 * @param drive      - istanza OneDriveService
 * @param emailUtente - email per audit trail contatori
 *
 * @returns numero progressivo garantito unico per questo cantiere+sigla
 */
export async function prossimoProg(
  idCantiere:   string,
  sigla:        string,
  drive:        OneDriveService,
  emailUtente:  string
): Promise<number> {
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const result = await drive.readWithEtag<Contatori>(idCantiere, '_db/contatori.json')

    // File non esiste ancora → inizializza
    const data: Contatori = result.data ?? {
      aggiornato:    new Date().toISOString(),
      aggiornato_da: emailUtente,
    }
    const etag = result.etag

    const corrente = (data[sigla] as number | undefined) ?? 0
    const prossimo = corrente + 1

    const aggiornato: Contatori = {
      ...data,
      [sigla]:       prossimo,
      aggiornato:    new Date().toISOString(),
      aggiornato_da: emailUtente,
    }

    // Se non esiste ancora il file → scrittura senza ETag
    if (!etag) {
      await drive.write<Contatori>(idCantiere, '_db/contatori.json', aggiornato)
      return prossimo
    }

    const ok = await drive.writeWithEtag<Contatori>(
      idCantiere,
      '_db/contatori.json',
      aggiornato,
      etag
    )

    if (ok) return prossimo

    // 412: conflict — aspetta e riprova
    await sleep(attempt)
  }

  throw new Error(
    `Impossibile ottenere progressivo ${sigla} dopo ${MAX_RETRY} tentativi. ` +
    'Riprova tra qualche secondo. Se il problema persiste, controlla la connessione.'
  )
}
