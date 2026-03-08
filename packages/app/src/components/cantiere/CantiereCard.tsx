import { useCallback } from 'react'
import type { Cantiere } from '@verbali/shared'
import { ChevronRight } from 'lucide-react'

interface CantiereCardProps {
  readonly cantiere:    Cantiere
  readonly onSeleziona: (id: string) => void
  readonly isLoading?:  boolean
  readonly badgeExtra?: string   // es. 'Ultimo accesso'
}

/**
 * Card singolo cantiere selezionabile.
 *
 * - Bordo superiore gradient brand-blue → brand-teal
 * - Badge codice in font-mono
 * - Chip provincia/regione
 * - Se is_attivo: false → opaca + badge "Chiuso"
 * - Touch target ≥ 80px, role="button", tastiera Enter/Space
 */
export function CantiereCard({ cantiere, onSeleziona, isLoading, badgeExtra }: CantiereCardProps) {
  const isDisabled = !cantiere.is_attivo || isLoading

  const handleClick = useCallback(() => {
    if (isDisabled) return
    onSeleziona(cantiere.id)
  }, [isDisabled, onSeleziona, cantiere.id])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (isDisabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSeleziona(cantiere.id)
    }
  }, [isDisabled, onSeleziona, cantiere.id])

  return (
    <div
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`Accedi al cantiere ${cantiere.nome}`}
      aria-disabled={isDisabled}
      className={`
        card-hover relative overflow-hidden min-h-[80px]
        flex flex-col gap-2
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Bordo superiore gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-blue to-brand-teal"
        aria-hidden="true"
      />

      {/* Riga superiore: codice + badge extra + freccia */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <span className="verbale-codice">{cantiere.codice}</span>
          {badgeExtra && (
            <span className="badge-amber">{badgeExtra}</span>
          )}
          {!cantiere.is_attivo && (
            <span className="badge-gray">Chiuso</span>
          )}
        </div>
        <ChevronRight
          className="w-4 h-4 text-brand-text3 flex-shrink-0"
          aria-hidden="true"
        />
      </div>

      {/* Nome cantiere */}
      <h3 className="text-sm font-bold text-brand-text line-clamp-1">
        {cantiere.nome}
      </h3>

      {/* Tratta + chip provincia/regione */}
      <div className="flex items-center gap-2 flex-wrap">
        {cantiere.tratta && (
          <span className="text-xs text-brand-text2 line-clamp-1">{cantiere.tratta}</span>
        )}
        {(cantiere.provincia || cantiere.regione) && (
          <div className="flex items-center gap-1.5 ml-auto">
            {cantiere.provincia && (
              <span className="badge-blue">{cantiere.provincia}</span>
            )}
            {cantiere.regione && (
              <span className="badge-blue">{cantiere.regione}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

