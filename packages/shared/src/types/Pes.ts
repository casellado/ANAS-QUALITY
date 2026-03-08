import type { AuditEntry } from './AuditEntry'

// ── Union types ─────────────────────────────────────────────
export type StatoProvaCalendario =
  | 'da_eseguire'
  | 'presa_in_carico'
  | 'completata'
  | 'annullata'

export type CategoriaProva =
  | 'CALCESTRUZZO'
  | 'ACCIAIO'
  | 'TERRE'
  | 'CONGLOMERATO BITUMINOSO'

// ── Entità principale: Prova nel calendario PES ──────────────
export interface ProvaCalendario {
  id_cantiere:     string           // discriminatore tenant — OBBLIGATORIO
  id:              string           // UUID v4
  lotto:           string
  data:            string           // ISO date  (YYYY-MM-DD)
  ora:             string           // formato HH:MM
  wbs:             string
  sezione:         string
  pk:              string           // progressiva kilometrica
  laboratorio:     string
  categoria:       CategoriaProva
  tipo_prova:      string
  stato:           StatoProvaCalendario
  ispettore:       string | null    // nome completo di chi ha preso in carico
  ispettore_email: string | null
  note:            string
  created_by:      string           // email coordinatore
  created_at:      string           // ISO datetime
  updated_at:      string
  storia:          AuditEntry[]
}

// ── Memoria suggerimenti per cantiere (locale) ───────────────
export interface MemoriaPES {
  id_cantiere:  string
  lotti:        string[]                        // ultimi 10 usati
  wbs:          string[]
  sezioni:      string[]
  laboratori:   string[]
  tipi_prova:   Record<CategoriaProva, string[]> // ultimi 10 per categoria
  updated_at:   string
}

