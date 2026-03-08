import { db } from '@/db/schema'

const MAX_VALORI = 50

/**
 * Servizio di memoria autocomplete.
 * Salva e recupera i valori inseriti dall'utente per campo e cantiere.
 * I valori vengono ricordati in Dexie (offline-safe).
 */
export const autocompleteMemory = {

  /** Recupera i suggerimenti per un campo specifico */
  async getSuggerimenti(idCantiere: string, campo: string): Promise<string[]> {
    try {
      const record = await db.autocomplete_memoria
        .where({ id_cantiere: idCantiere, campo })
        .first()
      return record?.valori ?? []
    } catch {
      return []
    }
  },

  /** Salva un nuovo valore nella memoria (deduplica, max 50) */
  async salvaValore(idCantiere: string, campo: string, valore: string): Promise<void> {
    if (!valore.trim()) return
    try {
      const existing = await db.autocomplete_memoria
        .where({ id_cantiere: idCantiere, campo })
        .first()

      const valori = existing?.valori ?? []
      // Deduplica e metti il nuovo valore in cima
      const nuovi = [valore, ...valori.filter(v => v !== valore)].slice(0, MAX_VALORI)

      await db.autocomplete_memoria.put({
        id_cantiere: idCantiere,
        campo,
        valori: nuovi,
      })
    } catch {
      // Silenzioso — memoria non è critica
    }
  },
}

