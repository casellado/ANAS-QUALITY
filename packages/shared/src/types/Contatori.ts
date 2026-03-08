/**
 * Contatori progressivi per cantiere.
 * Struttura flat: chiave = sigla_tipo (es: 'VPC'), valore = ultimo numero usato.
 *
 * Gestito con ETag optimistic locking in ContatoriService.ts.
 * MAI incrementare senza ETag → race condition tra ispettori.
 *
 * Il file _db/contatori.json su OneDrive è la fonte di verità.
 * Dexie NON ha una copia locale dei contatori — sono troppo critici per cache locale.
 */
export interface Contatori {
  /** Indice dinamico: sigla → ultimo progressivo usato */
  [sigla: string]: number | string
  /** ISO datetime dell'ultima modifica */
  aggiornato:    string
  /** Email dell'utente che ha scritto l'ultima modifica */
  aggiornato_da: string
}
