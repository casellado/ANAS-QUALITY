/**
 * Utility date — formattazione ISO e display.
 * Usare SEMPRE queste funzioni per garantire consistenza.
 */

/** Ritorna il datetime ISO corrente. Usato per created_at, updated_at, timestamp AuditEntry. */
export function now(): string {
  return new Date().toISOString()
}

/** Ritorna la data ISO corrente (solo data, senza ora). Usato per Verbale.data. */
export function today(): string {
  return new Date().toISOString().substring(0, 10)
}

/**
 * Formatta una data ISO per la visualizzazione in UI.
 * @param isoDate - '2025-03-11'
 * @returns '11/03/2025'
 */
export function formatDataIT(isoDate: string): string {
  if (!isoDate) return ''
  const [anno, mese, giorno] = isoDate.split('-')
  return `${giorno}/${mese}/${anno}`
}

/**
 * Formatta un datetime ISO per la visualizzazione in UI.
 * @param isoDatetime - '2025-03-11T10:30:00.000Z'
 * @returns '11/03/2025 10:30'
 */
export function formatDatetimeIT(isoDatetime: string): string {
  if (!isoDatetime) return ''
  const d = new Date(isoDatetime)
  const giorno = String(d.getDate()).padStart(2, '0')
  const mese   = String(d.getMonth() + 1).padStart(2, '0')
  const anno   = d.getFullYear()
  const ore    = String(d.getHours()).padStart(2, '0')
  const min    = String(d.getMinutes()).padStart(2, '0')
  return `${giorno}/${mese}/${anno} ${ore}:${min}`
}

/**
 * Ritorna la data in formato italiano esteso.
 * @param isoDate - '2025-03-11'
 * @returns '11 marzo 2025'
 */
export function formatDataEstesa(isoDate: string): string {
  if (!isoDate) return ''
  const mesi = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
                 'luglio','agosto','settembre','ottobre','novembre','dicembre']
  const [anno, mese, giorno] = isoDate.split('-')
  return `${parseInt(giorno ?? '0')} ${mesi[parseInt(mese ?? '1') - 1]} ${anno}`
}
