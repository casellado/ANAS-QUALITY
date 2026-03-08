import Dexie, { type Table } from 'dexie'
import type { Verbale, Prova, WbsEntry, ProvaCalendario, MemoriaPES } from '@verbali/shared'

/**
 * Task in attesa di sincronizzazione con OneDrive.
 * Processata da SyncQueue.ts quando la rete è disponibile.
 */
interface SyncTask {
  id:          string
  id_cantiere: string
  tipo:        'verbale' | 'prova' | 'foto' | 'contatore'
  payload:     unknown
  created_at:  string
  tentativi:   number
  ultimo_errore?: string
}

/**
 * Database Dexie — IndexedDB wrapper tipizzato.
 *
 * REGOLA CRITICA:
 * - OGNI store ha id_cantiere come indice per isolare i dati tra cantieri
 * - OGNI query DEVE filtrare per id_cantiere
 * - MAI query senza filtro cantiere → rischio di mostrare dati di altri cantieri
 *
 * Schema versioni:
 * - v1: schema iniziale (verbali, prove, wbs, syncQueue)
 *
 * Per modificare lo schema → aggiungere una nuova version() — MAI modificare v1.
 */
/**
 * Nota bacheca condivisa.
 */
interface Nota {
  id:            string
  id_cantiere:   string
  autore:        string
  autore_email:  string
  testo:         string
  created_at:    string
}

/** Record autocomplete: valori inseriti dall'utente per campo, con memoria. */
interface AutocompleteRecord {
  id_cantiere: string
  campo:       string   // 'opera', 'wbs', 'impresa', 'progr_da', 'progr_a'...
  valori:      string[] // valori unici inseriti (max 50)
}

/**
 * Contatore progressivi locali.
 * Chiave composita: id_cantiere + sigla.
 * Usato offline — in produzione usa OneDrive + ETag (ContatoriService).
 */
interface ContatoreLocale {
  id_cantiere: string
  sigla:       string   // 'VAG', 'VPC', 'VAC'
  valore:      number   // ultimo progressivo assegnato
  updated_at:  string   // ISO datetime
}

class VerbaleDatabase extends Dexie {
  verbali!:               Table<Verbale,            string>
  prove!:                 Table<Prova,              string>
  wbs!:                   Table<WbsEntry,           string>
  syncQueue!:             Table<SyncTask,           string>
  prove_calendario!:      Table<ProvaCalendario,    string>
  memoria_pes!:           Table<MemoriaPES,         string>
  note_bacheca!:          Table<Nota,               string>
  autocomplete_memoria!:  Table<AutocompleteRecord, string>
  contatori!:             Table<ContatoreLocale,    string>

  constructor() {
    super('VerbaliCantiereDB')

    // ── v1: schema iniziale — MAI modificare ──────────────
    this.version(1).stores({
      verbali:   'id, id_cantiere, tipo, stato, wbs, data, sync_pending',
      prove:     'id, id_cantiere, stato, priorita, data_richiesta, assegnata_a',
      wbs:       '[id_cantiere+codice], id_cantiere',
      syncQueue: 'id, id_cantiere, tipo, created_at',
    })

    // ── v2: PES + Note bacheca ────────────────────────────
    this.version(2).stores({
      verbali:          'id, id_cantiere, tipo, stato, wbs, data, sync_pending',
      prove:            'id, id_cantiere, stato, priorita, data_richiesta, assegnata_a',
      wbs:              '[id_cantiere+codice], id_cantiere',
      syncQueue:        'id, id_cantiere, tipo, created_at',
      prove_calendario: 'id, id_cantiere, stato, data, categoria, ispettore_email',
      memoria_pes:      'id_cantiere',
      note_bacheca:     'id, id_cantiere, created_at',
    })

    // ── v3: Autocomplete memoria campi ──────────────────
    this.version(3).stores({
      verbali:             'id, id_cantiere, tipo, stato, wbs, data, sync_pending',
      prove:               'id, id_cantiere, stato, priorita, data_richiesta, assegnata_a',
      wbs:                 '[id_cantiere+codice], id_cantiere',
      syncQueue:           'id, id_cantiere, tipo, created_at',
      prove_calendario:    'id, id_cantiere, stato, data, categoria, ispettore_email',
      memoria_pes:         'id_cantiere',
      note_bacheca:        'id, id_cantiere, created_at',
      autocomplete_memoria:'[id_cantiere+campo], id_cantiere, campo',
    })

    // ── v4: Contatori progressivi locali ────────────────
    this.version(4).stores({
      verbali:             'id, id_cantiere, tipo, stato, wbs, data, sync_pending',
      prove:               'id, id_cantiere, stato, priorita, data_richiesta, assegnata_a',
      wbs:                 '[id_cantiere+codice], id_cantiere',
      syncQueue:           'id, id_cantiere, tipo, created_at',
      prove_calendario:    'id, id_cantiere, stato, data, categoria, ispettore_email',
      memoria_pes:         'id_cantiere',
      note_bacheca:        'id, id_cantiere, created_at',
      autocomplete_memoria:'[id_cantiere+campo], id_cantiere, campo',
      contatori:           '[id_cantiere+sigla], id_cantiere',
    })
  }
}

export type { Nota, AutocompleteRecord, ContatoreLocale }

/** Singleton del database — unica istanza per tutta l'app */
export const db = new VerbaleDatabase()
