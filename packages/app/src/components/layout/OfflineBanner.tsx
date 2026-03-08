import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * Banner offline — visibile solo quando la rete non è disponibile.
 * aria-live="polite" → screen reader annuncia il cambio senza interrompere.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={isOnline ? 'Connesso' : 'Offline — dati salvati localmente'}
    >
      {!isOnline && (
        <div className="bg-brand-amber/10 border-b border-brand-amber/30
                        px-4 py-2 flex items-center gap-2 text-brand-amber-l text-sm">
          <span aria-hidden="true">⚡</span>
          <span>Offline — le modifiche saranno sincronizzate alla riconnessione</span>
        </div>
      )}
    </div>
  )
}
