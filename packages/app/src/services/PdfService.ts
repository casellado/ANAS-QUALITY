import { getAllTipiVerbale } from '@/config/moduleRegistry'
import type { Verbale } from '@verbali/shared'

/**
 * Genera il PDF del verbale usando la funzione del modulo corretto.
 * Zero switch/if sulla sigla — legge generaPdf dal registry.
 */
export async function generaPdf(verbale: Verbale): Promise<Blob> {
  const tipoVerbale = getAllTipiVerbale().find(t => t.sigla === verbale.tipo)
  if (!tipoVerbale) {
    throw new Error(`Nessun PDF engine per tipo '${verbale.tipo}'`)
  }
  return tipoVerbale.generaPdf(verbale)
}

/** Scarica il PDF nel browser come file download */
export function scaricaPdf(blob: Blob, nomeFile: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFile
  a.click()
  URL.revokeObjectURL(url)
}

/** Apre il PDF in un nuovo tab del browser */
export function apriPdf(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  // Non revocare subito — il browser ha bisogno di tempo per aprirlo
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

