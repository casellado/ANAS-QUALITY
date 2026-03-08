import type { VerbaleModule, TipoVerbale } from '@verbali/shared'

/**
 * Registry centrale di tutti i moduli verbale attivi.
 *
 * REGOLA: Aggiungere un modulo = aggiungere UNA sola riga qui.
 * Zero modifiche al core app, wizard, dashboard, registro.
 *
 * I moduli sono sviluppati separatamente in packages/modules/{nome}.
 * Decommentare quando il modulo è pronto.
 */

// import { ModuleCalcestruzzo } from '@verbali/mod-calcestruzzo'
// import { ModuleAcciaio }      from '@verbali/mod-acciaio'
// import { ModuleTerre }        from '@verbali/mod-terre'
// import { ModuleConglomerati } from '@verbali/mod-conglomerati'

export const MODULE_REGISTRY: VerbaleModule[] = [
  // ModuleCalcestruzzo,
  // ModuleAcciaio,
  // ModuleTerre,
  // ModuleConglomerati,
]

/**
 * Ottieni un modulo per id (es: 'calcestruzzo').
 * Usato da DashboardPage e SubmenuMaterialePage.
 */
export function getModule(id: string): VerbaleModule | undefined {
  return MODULE_REGISTRY.find(m => m.id === id)
}

/**
 * Ottieni un TipoVerbale per sigla (es: 'VPC').
 *
 * REGOLA: Usare SEMPRE questa funzione — MAI switch/if sulla sigla.
 * Se ritorna undefined → sigla non registrata → mostrare errore.
 *
 * @example
 * const tipoVerbale = getTipoVerbale('VPC')
 * if (!tipoVerbale) return <Error404 />
 * return <VerbaleWizard tipoVerbale={tipoVerbale} />
 */
export function getTipoVerbale(sigla: string): TipoVerbale | undefined {
  return MODULE_REGISTRY
    .flatMap(m => m.tipiVerbale)
    .find(t => t.sigla === sigla)
}

/**
 * Lista di tutti i TipoVerbale attivi nel sistema.
 * Usato per il Registro (filtro tipo).
 */
export function getAllTipiVerbale(): TipoVerbale[] {
  return MODULE_REGISTRY.flatMap(m => m.tipiVerbale)
}
