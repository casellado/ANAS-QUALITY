/**
 * Utility di naming — generazione codici verbale, cubetti, PDF.
 * Usare SEMPRE queste funzioni — mai costruire codici inline.
 *
 * @example
 * generaCodiceVerbale('VPC', 'A3Napoli', '2025-03-11', 48)
 * // → 'VPC-A3Napoli-2025-03-11-048'
 */

/**
 * Genera il codice leggibile del verbale.
 * Usato come nome file PDF su OneDrive e come codice visibile in UI.
 *
 * Formato: {sigla}-{opera}-{data}-{progressivo3cifre}
 *
 * @param sigla - es: 'VPC', 'VAG', 'VAC'
 * @param opera - es: 'A3 Napoli' → viene sanitizzata (rimozione spazi e spec)
 * @param data  - ISO date: '2025-03-11'
 * @param progressivo - numero intero, zero-padded a 3 cifre
 */
export function generaCodiceVerbale(
  sigla:        string,
  opera:        string,
  data:         string,
  progressivo:  number
): string {
  const operaSanitized = opera
    .replace(/\s+/g, '')              // rimuovi spazi
    .replace(/[^a-zA-Z0-9]/g, '')     // rimuovi caratteri speciali
    .substring(0, 12)                 // max 12 caratteri

  const prog = String(progressivo).padStart(3, '0')
  return `${sigla}-${operaSanitized}-${data}-${prog}`
}

/**
 * Genera il nome file PDF per OneDrive.
 * @param codiceVerbale - output di generaCodiceVerbale()
 */
export function generaNomePdf(codiceVerbale: string): string {
  return `${codiceVerbale}.pdf`
}

/**
 * Genera il nome file del certificato di laboratorio.
 * Formato: {codiceVerbale}_CERT_{numeroCertificato}.pdf
 *
 * @example
 * generaNomeCertificato('VPC-A3Napoli-2025-03-11-048', 'LAB2025-089')
 * // → 'VPC-A3Napoli-2025-03-11-048_CERT_LAB2025-089.pdf'
 */
export function generaNomeCertificato(
  codiceVerbale:     string,
  numeroCertificato: string
): string {
  return `${codiceVerbale}_CERT_${numeroCertificato}.pdf`
}

/**
 * Genera l'ID ANAS per un cubetto NTC 2018.
 * Formato: CLS {progressivo}/{lettera}[R]
 *
 * @param progressivo - numero del VPC (es: 48)
 * @param lettera     - 'A' o 'B'
 * @param isRiserva   - true → aggiunge suffisso 'R'
 *
 * @example
 * generaIdAnasCubetto(48, 'A', false) // → 'CLS 48/A'
 * generaIdAnasCubetto(48, 'A', true)  // → 'CLS 48/AR'
 */
export function generaIdAnasCubetto(
  progressivo: number,
  lettera:     'A' | 'B',
  isRiserva:   boolean
): string {
  return `CLS ${progressivo}/${lettera}${isRiserva ? 'R' : ''}`
}

/**
 * Abbreviazione qualifica per saluti, firme e PDF.
 */
export function abbreviaQualifica(qualifica: string): string {
  const MAP: Record<string, string> = {
    'Ingegnere':  'Ing.',
    'Geometra':   'Geom.',
    'Architetto': 'Arch.',
    'Per. Ind.':  'Per. Ind.',
  }
  return MAP[qualifica] ?? ''
}

/**
 * Genera il path relativo OneDrive per un file verbale.
 * Il path è relativo alla root del cantiere.
 *
 * @param categoria - es: 'Calcestruzzo', 'Acciaio'
 * @param tipo      - 'Verbali' | 'Certificati' | 'Foto'
 * @param nomeFile  - nome file con estensione
 */
export function generaPathOneDrive(
  categoria: string,
  tipo:      'Verbali' | 'Certificati' | 'Foto',
  nomeFile:  string
): string {
  return `${categoria}/${tipo}/${nomeFile}`
}
