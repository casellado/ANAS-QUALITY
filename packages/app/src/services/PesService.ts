import type { ProvaCalendario, MemoriaPES, CategoriaProva, AuditEntry, UserProfile } from '@verbali/shared'
import type { OneDriveService } from './OneDriveService'
import { db } from '@/db/schema'

const MAX_RETRY    = 5
const BACKOFF_BASE = 200
const MAX_MEMORIA  = 10
const DB_PATH      = '_db/prove_pes.json'

function sleep(attempt: number): Promise<void> {
  const delay = BACKOFF_BASE * Math.pow(2, attempt) + Math.random() * 100
  return new Promise(r => setTimeout(r, delay))
}

function creaAudit(utente: UserProfile, azione: AuditEntry['azione'], note?: string): AuditEntry {
  const entry: AuditEntry = {
    timestamp:    new Date().toISOString(),
    utente:       `${utente.nome} ${utente.cognome}`,
    utente_email: utente.email,
    azione,
  }
  if (note) entry.note = note
  return entry
}

// ── Memoria PES vuota ──────────────────────────────────────
function memoriaVuota(idCantiere: string): MemoriaPES {
  return {
    id_cantiere: idCantiere,
    lotti: [], wbs: [], sezioni: [], laboratori: [],
    tipi_prova: {
      CALCESTRUZZO: [],
      ACCIAIO: [],
      TERRE: [],
      'CONGLOMERATO BITUMINOSO': [],
    },
    updated_at: new Date().toISOString(),
  }
}

// ── PES Service ────────────────────────────────────────────
export class PesService {
  constructor(
    _getToken: () => Promise<string>,   // token fluisce via drive — conserviamo la firma per API simmetrica
    private readonly drive: OneDriveService,
  ) {
    void _getToken // evita TS6133
  }

  /** Legge prove: OneDrive → cache Dexie; fallback offline */
  async leggiProve(idCantiere: string): Promise<ProvaCalendario[]> {
    if (navigator.onLine) {
      try {
        const data = await this.drive.read<ProvaCalendario[]>(idCantiere, DB_PATH)
        await db.transaction('rw', db.prove_calendario, async () => {
          for (const p of data) await db.prove_calendario.put(p)
        })
        return data
      } catch { /* fallback Dexie */ }
    }
    return db.prove_calendario.where('id_cantiere').equals(idCantiere).toArray()
  }

  /** Salva prova — Dexie prima, OneDrive dopo (offline-safe) */
  async salvaProva(prova: ProvaCalendario): Promise<void> {
    await db.prove_calendario.put(prova)
    if (navigator.onLine) {
      try {
        const all = await db.prove_calendario
          .where('id_cantiere').equals(prova.id_cantiere).toArray()
        await this.drive.write(prova.id_cantiere, DB_PATH, all)
      } catch { /* Workbox Background Sync gestirà */ }
    }
  }

  /** Prende in carico una prova — ETag optimistic locking */
  async prendiInCarico(
    idCantiere: string,
    provaId:    string,
    utente:     UserProfile,
  ): Promise<void> {
    const now = new Date().toISOString()
    // Aggiorna Dexie immediatamente
    await db.prove_calendario.update(provaId, {
      stato:           'presa_in_carico',
      ispettore:       `${utente.nome} ${utente.cognome}`,
      ispettore_email: utente.email,
      updated_at:      now,
    })

    if (!navigator.onLine) return

    for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
      try {
        const result = await this.drive.readWithEtag<ProvaCalendario[]>(idCantiere, DB_PATH)
        const prove = result.data ?? []
        const idx = prove.findIndex(p => p.id === provaId)
        if (idx === -1) break

        const existing = prove[idx]
        if (!existing) break

        prove[idx] = {
          ...existing,
          stato:           'presa_in_carico',
          ispettore:       `${utente.nome} ${utente.cognome}`,
          ispettore_email: utente.email,
          updated_at:      now,
          storia: [...existing.storia, creaAudit(utente, 'assegnazione')],
        }

        if (!result.etag) {
          await this.drive.write(idCantiere, DB_PATH, prove)
          return
        }
        const ok = await this.drive.writeWithEtag(idCantiere, DB_PATH, prove, result.etag)
        if (ok) return
        await sleep(attempt)
      } catch { break }
    }
  }

  /** Completa una prova */
  async completaProva(
    idCantiere: string,
    provaId:    string,
    note:       string,
    utente:     UserProfile,
  ): Promise<void> {
    const now = new Date().toISOString()
    await db.prove_calendario.update(provaId, {
      stato: 'completata', note, updated_at: now,
    })

    if (!navigator.onLine) return

    for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
      try {
        const result = await this.drive.readWithEtag<ProvaCalendario[]>(idCantiere, DB_PATH)
        const prove = result.data ?? []
        const idx = prove.findIndex(p => p.id === provaId)
        if (idx === -1) break

        const existing = prove[idx]
        if (!existing) break

        prove[idx] = {
          ...existing,
          stato: 'completata', note, updated_at: now,
          storia: [...existing.storia, creaAudit(utente, 'completamento', note)],
        }

        if (!result.etag) {
          await this.drive.write(idCantiere, DB_PATH, prove)
          return
        }
        const ok = await this.drive.writeWithEtag(idCantiere, DB_PATH, prove, result.etag)
        if (ok) return
        await sleep(attempt)
      } catch { break }
    }
  }

  /** Legge memoria PES da Dexie (locale, niente OneDrive) */
  async leggiMemoria(idCantiere: string): Promise<MemoriaPES> {
    const mem = await db.memoria_pes.get(idCantiere)
    return mem ?? memoriaVuota(idCantiere)
  }

  /** Aggiorna memoria PES — max 10 valori, FIFO */
  async aggiornaMemoria(
    idCantiere: string,
    campo:      keyof MemoriaPES,
    valore:     string,
    categoria?: CategoriaProva,
  ): Promise<void> {
    const mem = await this.leggiMemoria(idCantiere)

    if (campo === 'tipi_prova' && categoria) {
      const arr = mem.tipi_prova[categoria]
      if (!arr.includes(valore)) {
        mem.tipi_prova[categoria] = [valore, ...arr].slice(0, MAX_MEMORIA)
      }
    } else {
      const arr = mem[campo]
      if (Array.isArray(arr) && !arr.includes(valore)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- campo generico
        (mem as any)[campo] = [valore, ...arr].slice(0, MAX_MEMORIA)
      }
    }

    mem.updated_at = new Date().toISOString()
    await db.memoria_pes.put(mem)
  }
}

/** Factory singleton */
export function createPesService(
  getToken: () => Promise<string>,
  drive:    OneDriveService,
): PesService {
  return new PesService(getToken, drive)
}

