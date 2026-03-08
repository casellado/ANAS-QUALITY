import type { Verbale } from './Verbale'

/**
 * Mappatura slot v1-v20 per il VAG.
 *
 * v1  = nome_dl               v7  = progr_da
 * v2  = nome_cg               v8  = progr_a
 * v3  = impresa_esecutrice     v9  = conformita (testo radio selezionato)
 * v4  = pcq_codice             v10 = sopralluogo (JSON array testi checkbox)
 * v5  = scheda_numero          v11 = esito (testo radio selezionato)
 * v6  = elaborati_riferimento  v12 = revisione
 * v13 = foto (JSON array base64)
 */

export type ConformitaTipo  = 'manuale' | 'progetto' | 'entrambi'
export type SopralluogoTipo = 'non_armata' | 'dimensionale' | 'ferri'
export type EsitoVAG        = 'autorizzato' | 'non_autorizzato'

/** Helper tipizzato per accedere ai campi VAG dal Verbale generico */
export interface VAGData {
  nome_dl:               string
  nome_cg:               string
  impresa_esecutrice:    string
  pcq_codice:            string
  scheda_numero:         string
  elaborati_riferimento: string
  progr_da:              string
  progr_a:               string
  conformita_tipo:       ConformitaTipo
  /** Testo originale della conformità selezionata */
  conformita_testo:      string
  sopralluogo_tipo:      SopralluogoTipo[]
  /** Testi originali delle voci sopralluogo selezionate */
  sopralluogo_testi:     string[]
  esito:                 EsitoVAG
  /** Testo originale dell'esito selezionato */
  esito_testo:           string
  revisione:             string
  opera:                 string
  wbs:                   string
  data:                  string
  parte_opera:           string
  progressivo:           number
  codice:                string
  /** Base64 data URLs delle foto allegate */
  foto:                  string[]
}

// ── Mappatura testo → enum ──────────────────────────────────

function mapConformita(testo: string): ConformitaTipo {
  const t = testo.toLowerCase()
  if (t.includes('entrambi'))       return 'entrambi'
  if (t.includes('progetto'))       return 'progetto'
  return 'manuale'
}

function mapSopralluogo(testi: string[]): SopralluogoTipo[] {
  const result: SopralluogoTipo[] = []
  for (const t of testi) {
    const lower = t.toLowerCase()
    if (lower.includes('non armata'))    result.push('non_armata')
    if (lower.includes('dimensionale'))  result.push('dimensionale')
    if (lower.includes('ferri'))         result.push('ferri')
  }
  return result
}

function mapEsito(testo: string): EsitoVAG {
  if (testo.toLowerCase().includes('non ha autorizzato')) return 'non_autorizzato'
  return 'autorizzato'
}

function parseJsonArray(raw: string): string[] {
  try { return JSON.parse(raw || '[]') as string[] }
  catch { return [] }
}

/** Converte un Verbale generico in VAGData tipizzato */
export function verbaleToVAG(v: Verbale): VAGData {
  const conformitaTesto = v.v9 || ''
  const sopralluogoTesti = parseJsonArray(v.v10)
  const esitoTesto = v.v11 || ''
  const foto = parseJsonArray(v.v13)

  return {
    nome_dl:               v.v1,
    nome_cg:               v.v2,
    impresa_esecutrice:    v.v3,
    pcq_codice:            v.v4,
    scheda_numero:         v.v5,
    elaborati_riferimento: v.v6,
    progr_da:              v.v7,
    progr_a:               v.v8,
    conformita_tipo:       mapConformita(conformitaTesto),
    conformita_testo:      conformitaTesto,
    sopralluogo_tipo:      mapSopralluogo(sopralluogoTesti),
    sopralluogo_testi:     sopralluogoTesti,
    esito:                 mapEsito(esitoTesto),
    esito_testo:           esitoTesto,
    revisione:             v.v12 || '1',
    opera:                 v.opera,
    wbs:                   v.wbs,
    data:                  v.data,
    parte_opera:           v.parte_opera,
    progressivo:           v.progressivo,
    codice:                v.codice,
    foto,
  }
}
