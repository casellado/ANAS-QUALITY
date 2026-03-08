/**
 * Profilo utente. Salvato in localStorage (non è un token — è config utente).
 * Popolato al primo login da Azure AD + ProfileSetupPage.
 * I cantieri_autorizzati vengono ricalcolati ad ogni login da Graph API.
 */
export type Qualifica = 'Ingegnere' | 'Geometra' | 'Architetto' | 'Per. Ind.' | 'Altro'

export interface UserProfile {
  email:                string     // da Azure AD — immutabile
  nome:                 string
  cognome:              string
  qualifica:            Qualifica
  mansione:             string     // es: 'Ispettore di Cantiere'
  /** Cantieri autorizzati — ricalcolati ad ogni login da Azure AD Groups */
  cantieri_autorizzati: string[]   // es: ['CAN-001', 'CAN-002']
  is_admin:             boolean
  is_funzionario:       boolean
  created_at:           string     // ISO datetime
  updated_at:           string
}
