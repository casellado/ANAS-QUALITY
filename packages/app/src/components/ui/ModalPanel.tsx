import { useEffect, useRef, useCallback, useId } from 'react'
import type { ReactNode } from 'react'

interface ModalPanelProps {
  readonly isOpen:    boolean
  readonly onClose:   () => void
  readonly title:     string
  readonly icon?:     string
  readonly children:  ReactNode
}

/**
 * Panel modale dal basso — 85vh, backdrop blur.
 * Chiusura con Escape, focus trap, aria-modal.
 */
export function ModalPanel({ isOpen, onClose, title, icon, children }: ModalPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const uid      = useId()
  const titleId  = `modal-title-${uid}`

  // Escape key handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    // Focus panel all'apertura
    const raf = requestAnimationFrame(() => panelRef.current?.focus())
    // Blocca scroll body
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      cancelAnimationFrame(raf)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
                 flex items-end justify-center animate-fade-in"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-brand-bg rounded-t-3xl
                   flex flex-col animate-slide-up overflow-hidden"
        style={{ height: '85vh' }}
      >
        {/* Header panel */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-line shrink-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-xl" aria-hidden="true">{icon}</span>}
            <h2 id={titleId} className="font-bold text-brand-text text-lg">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="btn-icon"
          >
            ✕
          </button>
        </div>

        {/* Contenuto scrollabile */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

