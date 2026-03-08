import type { Verbale } from './Verbale'

/**
 * Mappatura slot v1-v20 per il VAG.
 *
 * v1  = nome_dl               v7  = progr_da
 * v2  = nome_cg               v8  = progr_a
 * v3  = impresa_esecutrice     v9  = conformita_tipo
 * v4  = pcq_codice             v10 = sopralluogo_tipo (JSON array)
 * v5  = scheda_numero          v11 = esito
 * v6  = elaborati_riferimento  v12 = revisione
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
  sopralluogo_tipo:      SopralluogoTipo[]
  esito:                 EsitoVAG
  revisione:             string
  opera:                 string
  wbs:                   string
  data:                  string
  parte_opera:           string
  progressivo:           number
  codice:                string
}

/** Converte un Verbale generico in VAGData tipizzato */
export function verbaleToVAG(v: Verbale): VAGData {
  return {
    nome_dl:               v.v1,
    nome_cg:               v.v2,
    impresa_esecutrice:    v.v3,
    pcq_codice:            v.v4,
    scheda_numero:         v.v5,
    elaborati_riferimento: v.v6,
    progr_da:              v.v7,
    progr_a:               v.v8,
    conformita_tipo:       (v.v9 || 'manuale') as ConformitaTipo,
    sopralluogo_tipo:      JSON.parse(v.v10 || '[]') as SopralluogoTipo[],
    esito:                 (v.v11 || 'autorizzato') as EsitoVAG,
    revisione:             v.v12 || '1',
    opera:                 v.opera,
    wbs:                   v.wbs,
    data:                  v.data,
    parte_opera:           v.parte_opera,
    progressivo:           v.progressivo,
    codice:                v.codice,
  }
}

