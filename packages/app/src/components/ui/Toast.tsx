import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { ToastVariant, ToastItem } from '@/components/ui/ToastContext'
import { ToastContext } from '@/components/ui/ToastContext'

// ── Costanti ─────────────────────────────────────────────────
const VARIANT_CLASS: Record<ToastVariant, string> = {
  success: 'toast-success',
  error:   'toast-error',
  warning: 'toast-warning',
  info:    'toast-info',
}

const VARIANT_ROLE: Record<ToastVariant, 'status' | 'alert'> = {
  success: 'status',
  info:    'status',
  error:   'alert',
  warning: 'alert',
}

const VARIANT_ICON: Record<ToastVariant, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

const MAX_VISIBLE = 3
const DISMISS_MS_DEFAULT = 4_000
const DISMISS_MS_ERROR   = 6_000
const EXIT_ANIMATION_MS  = 300

// ── Provider ─────────────────────────────────────────────────
export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, EXIT_ANIMATION_MS)
  }, [])

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = crypto.randomUUID()
    const dismissMs = variant === 'error' ? DISMISS_MS_ERROR : DISMISS_MS_DEFAULT

    setToasts(prev => {
      const next = [...prev, { id, message, variant, isExiting: false }]
      return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next
    })

    const timer = setTimeout(() => dismiss(id), dismissMs)
    timersRef.current.set(id, timer)
  }, [dismiss])

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => { timers.forEach(t => clearTimeout(t)) }
  }, [])

  const ctx = {
    success: useCallback((m: string) => addToast(m, 'success'), [addToast]),
    error:   useCallback((m: string) => addToast(m, 'error'),   [addToast]),
    warning: useCallback((m: string) => addToast(m, 'warning'), [addToast]),
    info:    useCallback((m: string) => addToast(m, 'info'),    [addToast]),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* ── Toast container — sopra BottomNav ──────────────── */}
      <div
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50
                   flex flex-col gap-2 w-[calc(100%-2rem)] max-w-md pointer-events-none"
        aria-label="Notifiche"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            role={VARIANT_ROLE[toast.variant]}
            aria-live={toast.variant === 'error' || toast.variant === 'warning' ? 'assertive' : 'polite'}
            className={`${VARIANT_CLASS[toast.variant]} pointer-events-auto
              ${toast.isExiting
                ? 'opacity-0 translate-y-2 transition-all duration-300'
                : 'animate-slide-up'
              }`}
          >
            <span aria-hidden="true" className="text-base shrink-0">
              {VARIANT_ICON[toast.variant]}
            </span>
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Chiudi notifica"
              className="shrink-0 p-1 rounded-lg hover:bg-white/10
                         transition-colors min-h-[44px] min-w-[44px]
                         flex items-center justify-center"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
