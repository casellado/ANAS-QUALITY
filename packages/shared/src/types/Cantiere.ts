/**
 * Cantiere autorizzato per l'utente.
 * L'id corrisponde al suffisso del gruppo Azure AD: 'cantiere-CAN-001' → id = 'CAN-001'.
 * is_attivo: false → cantiere chiuso, non selezionabile nell'app.
 */
export interface Cantiere {
  id:           string    // 'CAN-001' — dall'Azure AD group 'cantiere-CAN-001'
  nome:         string    // 'A3 Napoli — Lotto 1'
  codice:       string    // 'A3-NA-L1' — codice breve per badge
  tratta:       string    // 'Km 10+000 ÷ Km 25+000'
  provincia:    string    // 'NA'
  regione:      string    // 'Campania'
  is_attivo:    boolean   // false = cantiere chiuso, non selezionabile
}

