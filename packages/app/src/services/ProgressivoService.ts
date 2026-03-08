/**
 * ProgressivoService — assegna progressivi univoci per (id_cantiere, sigla).
 *
 * In dev mode: usa Dexie (locale, offline-safe).
 * In produzione ANAS: userà OneDrive + ETag via ContatoriService.
 * La scelta è trasparente al chiamante.
 */
import { db } from '@/db/schema'
import { now } from '@verbali/shared'

/**
 * Ottiene il prossimo numero progressivo per un tipo verbale su un cantiere.
 *
 * Algoritmo Dexie (locale):
 * 1. Leggi contatore per (id_cantiere, sigla)
 * 2. Se non esiste → inizializza a 1
 * 3. Se esiste → incrementa di 1
 * 4. Salva e restituisci
 *
 * Thread-safe: Dexie v3 garantisce transazioni IndexedDB.
 *
 * @param idCantiere - es: 'CAN-001'
 * @param sigla      - es: 'VPC', 'VAG', 'VAC'
 * @returns numero progressivo garantito unico per (cantiere, sigla)
 */
export async function prossimoProgressivo(
  idCantiere: string,
  sigla:      string,
): Promise<number> {
  return db.transaction('rw', db.contatori, async () => {
    const existing = await db.contatori
      .where({ id_cantiere: idCantiere, sigla })
      .first()

    const prossimo = (existing?.valore ?? 0) + 1

    await db.contatori.put({
      id_cantiere: idCantiere,
      sigla,
      valore:      prossimo,
      updated_at:  now(),
    })

    return prossimo
  })
}

/**
 * Legge l'ultimo progressivo assegnato senza incrementare.
 * Utile per mostrare "prossimo = N+1" in UI anteprima.
 */
export async function ultimoProgressivo(
  idCantiere: string,
  sigla:      string,
): Promise<number> {
  const existing = await db.contatori
    .where({ id_cantiere: idCantiere, sigla })
    .first()
  return existing?.valore ?? 0
}

