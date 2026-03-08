import type { AuditEntry } from './AuditEntry'

/**
 * Stato ciclo di vita di una prova.
 * Transizioni:
 *   da_assegnare → assegnata → in_corso → completata
 *   qualsiasi    → annullata  (solo funzionario/admin)
 */
export type StatoProva =
  | 'da_assegnare'  // inserita dal funzionario
  | 'assegnata'     // ispettore l'ha presa → tutti lo vedono via polling
  | 'in_corso'      // ispettore è sul posto
  | 'completata'    // verbale creato e collegato
  | 'annullata'

/**
 * Prova di laboratorio assegnata a un cantiere.
 * Inserita dal funzionario, raccolta dall'ispettore.
 * Coordinamento conflict-safe via ETag optimistic locking su prove.json.
 */
export interface Prova {
  // ── Discriminatori obbligatori ──────────────────────────────
  id_cantiere:         string       // MAI omettere

  // ── Identità ────────────────────────────────────────────────
  id:                  string       // UUID v4
  tipo_prova:          string       // es: 'Prelievo calcestruzzo'
  wbs:                 string
  opera:               string
  descrizione:         string       // istruzione dettagliata dal funzionario
  priorita:            'alta' | 'normale' | 'bassa'
  /** Scadenza — entro quando eseguire la prova */
  data_richiesta:      string       // ISO date

  // ── Inserimento ─────────────────────────────────────────────
  inserita_da:         string       // email funzionario
  inserita_da_nome:    string
  created_at:          string

  // ── Stato e assegnazione ────────────────────────────────────
  stato:               StatoProva
  assegnata_a:         string | null  // email ispettore
  assegnata_a_nome:    string | null
  assegnata_at:        string | null  // ISO datetime

  // ── Completamento ───────────────────────────────────────────
  /** FK → Verbale.id quando la prova è completata */
  verbale_id:          string | null
  completata_at:       string | null
  note_completamento:  string | null

  // ── Audit trail ─────────────────────────────────────────────
  storia: AuditEntry[]
}
