import { useCallback } from 'react'
import type { StatoProvaCalendario, CategoriaProva } from '@verbali/shared'

// ── Chip configurazione ──────────────────────────────────────
type FiltroStato = 'tutti' | StatoProvaCalendario

const STATI_CHIP: { value: FiltroStato; label: string }[] = [
  { value: 'tutti',            label: 'Tutte' },
  { value: 'da_eseguire',     label: 'Da eseguire' },
  { value: 'presa_in_carico', label: 'In carico' },
  { value: 'completata',      label: 'Completata' },
]

const CATEGORIE: CategoriaProva[] = [
  'CALCESTRUZZO', 'ACCIAIO', 'TERRE', 'CONGLOMERATO BITUMINOSO',
]

interface PesFiltriProps {
  readonly filtroStato:        FiltroStato
  readonly setFiltroStato:     (v: FiltroStato) => void
  readonly filtroData:         string
  readonly setFiltroData:      (v: string) => void
  readonly filtroCategoria:    string
  readonly setFiltroCategoria: (v: string) => void
}

export type { FiltroStato }

export function PesFiltri({
  filtroStato, setFiltroStato,
  filtroData, setFiltroData,
  filtroCategoria, setFiltroCategoria,
}: PesFiltriProps) {

  const hasAnyFilter = filtroStato !== 'tutti' || filtroData !== '' || filtroCategoria !== ''

  const handleReset = useCallback(() => {
    setFiltroStato('tutti')
    setFiltroData('')
    setFiltroCategoria('')
  }, [setFiltroStato, setFiltroData, setFiltroCategoria])

  return (
    <div role="group" aria-label="Filtri prove" className="flex flex-col gap-3">

      {/* Chip stato */}
      <div className="flex gap-2 flex-wrap">
        {STATI_CHIP.map(s => (
          <button
            key={s.value}
            onClick={() => setFiltroStato(s.value)}
            aria-label={`Filtra per stato: ${s.label}`}
            aria-pressed={filtroStato === s.value}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[32px]
              transition-all duration-150
              ${filtroStato === s.value
                ? 'bg-brand-amber text-brand-bg'
                : 'bg-brand-card border border-brand-line text-brand-text2 hover:text-brand-text'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Riga secondaria: categoria + data + reset */}
      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          aria-label="Filtra per categoria"
          className="select-field text-xs py-1.5 w-auto max-w-[180px]"
        >
          <option value="">Tutte le categorie</option>
          {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <input
          type="date"
          value={filtroData}
          onChange={e => setFiltroData(e.target.value)}
          aria-label="Filtra per data"
          className="input-field text-xs py-1.5 w-auto max-w-[160px]"
        />

        {hasAnyFilter && (
          <button
            onClick={handleReset}
            aria-label="Resetta tutti i filtri"
            className="btn-ghost text-xs px-2 py-1.5"
          >
            ✕ Reset
          </button>
        )}
      </div>
    </div>
  )
}

