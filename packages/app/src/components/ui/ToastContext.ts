import { createContext, useContext } from 'react'

// ── Tipi Toast ───────────────────────────────────────────────
export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  readonly id: string
  readonly message: string
  readonly variant: ToastVariant
  readonly isExiting: boolean
}

export interface ToastContextValue {
  success: (message: string) => void
  error:   (message: string) => void
  warning: (message: string) => void
  info:    (message: string) => void
}

// ── Context ──────────────────────────────────────────────────
export const ToastContext = createContext<ToastContextValue | null>(null)

// ── Hook ─────────────────────────────────────────────────────
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve essere usato dentro <ToastProvider>')
  return ctx
}

