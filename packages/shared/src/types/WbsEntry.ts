/**
 * Entry WBS (Work Breakdown Structure).
 * Salvata in _db/wbs.json su OneDrive + cache Dexie.
 * WbsSelect la usa per la memoria per cantiere.
 */
export interface WbsEntry {
  codice:      string    // 'WBS.SS.001.0010' — chiave primaria
  id_cantiere: string    // discriminatore tenant
  descrizione: string    // 'Sottostruttura - Spalla 1 - Fondazione'
  opera:       string    // opera di riferimento
  usata_ultima_volta: string  // ISO datetime — per ordinare le "recenti"
  contatore:   number    // quante volte è stata selezionata (per suggerimenti)
}
