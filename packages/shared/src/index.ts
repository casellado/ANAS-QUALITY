// ── Types ────────────────────────────────────────────────────
export type {
  StatoVerbale, Verbale, VerbaleIndex, Prelievo, Cubetto,
} from './types/Verbale'
export { VERBALE_SLOT_DEFAULT } from './types/Verbale'

export type { AuditEntry }           from './types/AuditEntry'
export type { UserProfile, Qualifica } from './types/UserProfile'
export type { StatoProva, Prova }    from './types/Prova'
export type { Contatori }            from './types/Contatori'
export type { WbsEntry }             from './types/WbsEntry'
export type { Cantiere }             from './types/Cantiere'
export type { StepType, WizardStep, TipoVerbale, VerbaleModule } from './types/VerbaleModule'
export type {
  StatoProvaCalendario,
  CategoriaProva,
  ProvaCalendario,
  MemoriaPES,
} from './types/Pes'

// ── Utils ────────────────────────────────────────────────────
export {
  generaCodiceVerbale,
  generaNomePdf,
  generaNomeCertificato,
  generaIdAnasCubetto,
  abbreviaQualifica,
  generaPathOneDrive,
} from './utils/naming'

export { getSaluto }              from './utils/saluto'
export { validaChainOfCustody }   from './utils/chainOfCustody'
export { now, today, formatDataIT, formatDatetimeIT, formatDataEstesa } from './utils/date'
