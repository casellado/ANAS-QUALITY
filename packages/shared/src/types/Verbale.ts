import type { AuditEntry } from './AuditEntry'

export type StatoVerbale = 'bozza' | 'completo' | 'annullato'

/**
 * Verbale di ispezione cantiere.
 *
 * I campi v1-v20 sono slot generici — la semantica di ogni slot
 * è definita nel WizardStep.key del TipoVerbale del modulo.
 * Il core non sa cosa c'è dentro — i moduli lo definiscono.
 *
 * REGOLA: Non ridefinire mai localmente. Importa da '@verbali/shared'.
 */
export interface Verbale {
  // ── Discriminatore tenant — MAI omettere ────────────────────
  id_cantiere:          string     // 'CAN-001' — chiave di isolamento dati

  // ── Identità ────────────────────────────────────────────────
  id:                   string     // UUID v4 — crypto.randomUUID()
  codice:               string     // 'VPC-A3Napoli-2025-03-11-048'
  tipo:                 string     // sigla: 'VPC', 'VAG', 'VAC'...
  progressivo:          number     // 48

  // ── Contesto cantiere ────────────────────────────────────────
  cantiere:             string     // 'A3 Napoli'
  opera:                string
  wbs:                  string     // 'WBS.SS.001.0010'
  data:                 string     // ISO date: '2025-03-11'
  ispettore:            string     // 'Ing. Mario Rossi'
  ispettore_email:      string

  // ── Slot dati generici (semantica definita dal modulo) ───────
  v1:  string; v2:  string; v3:  string; v4:  string; v5:  string
  v6:  string; v7:  string; v8:  string; v9:  string; v10: string
  v11: string; v12: string; v13: string; v14: string; v15: string
  v16: string; v17: string; v18: string; v19: string; v20: string

  // ── Tracciabilità NTC 2018 (obbligatori per VPC) ─────────────
  ddt_numero:           string
  ddt_data:             string     // ISO date
  targa_autobetoniera:  string
  parte_opera:          string     // 'Pila 3'
  componente_opera:     string     // 'Fusto'

  // ── Collegamento verbali ─────────────────────────────────────
  vag_collegato:        string | null   // solo su VPC
  vpc_collegati:        string[]        // solo su VAG

  // ── Prelievi / cubetti ───────────────────────────────────────
  prelievi:             Prelievo[]

  // ── Firme ────────────────────────────────────────────────────
  firma_data_url:       string     // base64 PNG
  firma_timestamp:      string     // ISO datetime

  // ── Foto (facoltative) ───────────────────────────────────────
  slump_foto_path:      string | null
  cubetti_foto_path:    string | null

  // ── Archiviazione OneDrive ───────────────────────────────────
  pdf_path:             string | null
  certificato_path:     string | null
  numero_certificato:   string | null

  // ── Stato e sync ─────────────────────────────────────────────
  stato:                StatoVerbale
  created_at:           string     // ISO datetime
  updated_at:           string
  synced_at:            string | null
  sync_pending:         boolean

  // ── Audit trail — solo append ────────────────────────────────
  storia:               AuditEntry[]
}

/** Prelievo di materiale con cubetti NTC 2018 */
export interface Prelievo {
  id:             string
  id_cantiere:    string
  numero:         number      // progressivo nel verbale (1, 2, 3...)
  verbale_id:     string      // FK → Verbale.id
  wbs:            string
  note:           string
  cubetti:        Cubetto[]
  created_at:     string
}

/** Singolo cubetto NTC 2018 */
export interface Cubetto {
  id_anas:              string    // 'CLS 48/A' — generaIdAnasCubetto()
  is_riserva:           boolean
  lettera_base:         'A' | 'B'

  // Chain of custody NTC 2018 — tutti obbligatori
  ddt_numero:           string
  ddt_data:             string
  targa_autobetoniera:  string
  wbs:                  string
  opera:                string
  parte_opera:          string
  componente_opera:     string
  verbale_vpc_id:       string
  verbale_vpc_codice:   string
  verbale_vag_codice:   string | null

  // Stato certificato laboratorio
  numero_certificato:   string | null
  certificato_path:     string | null
  esito:                'in_attesa' | 'conforme' | 'non_conforme' | null
}

/** Versione leggera per l'indice OneDrive e il Registro */
export type VerbaleIndex = Pick<
  Verbale,
  | 'id' | 'id_cantiere' | 'codice' | 'tipo' | 'progressivo'
  | 'opera' | 'wbs' | 'data' | 'ispettore' | 'stato'
  | 'pdf_path' | 'certificato_path' | 'numero_certificato'
  | 'sync_pending' | 'updated_at'
>

/** Valori default per gli slot v1-v20 */
export const VERBALE_SLOT_DEFAULT = {
  v1: '', v2: '', v3: '', v4: '', v5: '',
  v6: '', v7: '', v8: '', v9: '', v10: '',
  v11: '', v12: '', v13: '', v14: '', v15: '',
  v16: '', v17: '', v18: '', v19: '', v20: '',
} as const
