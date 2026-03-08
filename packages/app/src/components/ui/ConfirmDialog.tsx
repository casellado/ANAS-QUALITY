import { useCallback, useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

// ── Props ───────────────────────────────────────────────────
interface ConfirmDialogProps {
  readonly isOpen: boolean
  readonly title: string
  readonly message: string
  readonly onConfirm: () => void
  readonly onCancel: () => void
  readonly variant?: 'danger' | 'default'
  readonly confirmLabel?: string
  readonly cancelLabel?: string
}

const FOCUSABLE = 'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  variant = 'default',
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
}: ConfirmDialogProps) {
  const dialogRef    = useRef<HTMLDivElement>(null)
  const triggerRef   = useRef<Element | null>(null)
  const cancelBtnRef = useRef<HTMLButtonElement>(null)

  // Salva elemento trigger e focus sul bottone Annulla al mount
  useEffect(() => {
    if (!isOpen) return

    triggerRef.current = document.activeElement
    // Focus su Annulla — scelta più sicura
    const raf = requestAnimationFrame(() => cancelBtnRef.current?.focus())

    return () => cancelAnimationFrame(raf)
  }, [isOpen])

  // Ritorna focus al trigger al close
  useEffect(() => {
    if (isOpen) return

    const trigger = triggerRef.current
    if (trigger instanceof HTMLElement) {
      trigger.focus()
      triggerRef.current = null
    }
  }, [isOpen])

  // ── Focus trap + Escape ────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
        return
      }

      if (e.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!focusable?.length) return

      const first = focusable[0]
      const last  = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    },
    [onCancel]
  )

  if (!isOpen) return null

  const isDanger = variant === 'danger'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="card max-w-sm w-full animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {isDanger && (
            <div className="shrink-0 p-2 rounded-xl bg-brand-red/10">
              <AlertTriangle className="w-5 h-5 text-brand-red-l" aria-hidden="true" />
            </div>
          )}
          <div className="flex-1">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold text-brand-text">
              {title}
            </h2>
            <p id="confirm-dialog-message" className="text-sm text-brand-text2 mt-1">
              {message}
            </p>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex gap-3 justify-end">
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            className="btn-ghost min-h-[44px]"
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`${isDanger ? 'btn-danger' : 'btn-primary'} min-h-[44px]`}
            aria-label={confirmLabel}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

