import { abbreviaQualifica } from './naming'

/**
 * Genera il saluto personalizzato per l'utente.
 * Il saluto è il PRIMO elemento visivo dopo il login — deve apparire subito.
 * Non attendere il caricamento dati per mostrarlo.
 *
 * Formato: "{fascia oraria}, {qualificaAbb} {cognome}! {emoji}"
 *
 * @example
 * getSaluto('Rossi', 'Ingegnere')    // → "Buongiorno, Ing. Rossi! ☀️"
 * getSaluto('Bianchi', 'Geometra')   // → "Buon pomeriggio, Geom. Bianchi! 🌤️"
 * getSaluto('Verdi', 'Altro')        // → "Buona sera, Verdi! 🌙"
 */
export function getSaluto(cognome: string, qualifica: string): string {
  const ora    = new Date().getHours()
  const saluto = ora < 12 ? 'Buongiorno'      : ora < 18 ? 'Buon pomeriggio' : 'Buona sera'
  const emoji  = ora < 12 ? '☀️'              : ora < 18 ? '🌤️'             : '🌙'
  const abbr   = abbreviaQualifica(qualifica)
  const titolo = abbr ? `${abbr} ` : ''
  return `${saluto}, ${titolo}${cognome}! ${emoji}`
}
