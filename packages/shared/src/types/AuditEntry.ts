/**
 * Voce di audit trail.
 * Solo append — MAI modificare o eliminare voci esistenti.
 * Ogni azione significativa aggiunge una voce a storia[].
 */
export interface AuditEntry {
  timestamp:     string   // ISO datetime — es: '2025-03-11T10:30:00.000Z'
  utente:        string   // nome completo — es: 'Ing. Mario Rossi'
  utente_email:  string   // email aziendale — es: 'mario.rossi@anas.it'
  azione:
    | 'creazione'
    | 'modifica'
    | 'firma'
    | 'archiviazione'
    | 'certificato'
    | 'annullamento'
    | 'assegnazione'
    | 'completamento'
  /** Campi modificati con valore prima e dopo (solo per azione 'modifica') */
  campi_modificati?: Record<string, { prima: unknown; dopo: unknown }>
  /** Note aggiuntive — obbligatorie per 'annullamento' */
  note?: string
}
