import type { Verbale } from '../types/Verbale'

/**
 * Campi obbligatori per la chain of custody NTC 2018.
 * Validati prima dell'archiviazione di ogni VPC.
 * Se mancanti → blocca l'archiviazione con toast.error.
 */
const CAMPI_RICHIESTI: Array<[keyof Verbale, string]> = [
  ['ddt_numero',          'DDT n°'],
  ['ddt_data',            'Data DDT'],
  ['targa_autobetoniera', 'Targa autobetoniera'],
  ['wbs',                 'WBS'],
  ['opera',               'Opera'],
  ['parte_opera',         "Parte d'opera"],
  ['componente_opera',    'Componente opera'],
]

/**
 * Valida la completezza della chain of custody NTC 2018 per un VPC.
 *
 * @param verbale - verbale parzialmente compilato
 * @returns array di messaggi di errore. Vuoto = chain valida.
 *
 * @example
 * const errori = validaChainOfCustody(verbale)
 * if (errori.length > 0) {
 *   toast.error(`Chain of custody incompleta: ${errori.join(', ')}`)
 *   return  // blocca archiviazione
 * }
 */
export function validaChainOfCustody(verbale: Partial<Verbale>): string[] {
  const errori: string[] = []

  // Valida campi obbligatori
  for (const [key, label] of CAMPI_RICHIESTI) {
    const valore = verbale[key]
    if (!valore || (typeof valore === 'string' && valore.trim() === '')) {
      errori.push(label)
    }
  }

  // Valida presenza prelievi
  if (!verbale.prelievi?.length) {
    errori.push('Almeno un prelievo con cubetti')
    return errori
  }

  // Valida cubetti minimi per prelievo (NTC 2018: min 2)
  for (const prelievo of verbale.prelievi) {
    const cubettiStandard = prelievo.cubetti.filter(c => !c.is_riserva)
    if (cubettiStandard.length < 2) {
      errori.push(`Prelievo ${prelievo.numero}: min 2 cubetti (NTC 2018)`)
    }
  }

  return errori
}
