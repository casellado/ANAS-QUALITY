import { useEffect, useRef } from 'react'

/**
 * Hook per eseguire un callback a intervalli regolari.
 *
 * Usa un ref per la callback in modo che l'interval non venga
 * resettato ad ogni aggiornamento della callback stessa.
 * Questo previene il reset del timer quando cambiano le dipendenze
 * del callback (es: aggiornamento stato interno).
 *
 * Cleanup automatico alla unmount del componente.
 *
 * @param callback - funzione da eseguire periodicamente
 * @param interval - intervallo in ms (es: ENV.POLLING_INTERVAL)
 *
 * @example
 * // In ProveBoard — ricarica in background ogni 30s
 * usePolling(ricaricaProve, ENV.POLLING_INTERVAL)
 */
export function usePolling(callback: () => void, interval: number): void {
  const callbackRef = useRef(callback)

  // Aggiorna il ref senza resettare il timer
  callbackRef.current = callback

  useEffect(() => {
    if (interval <= 0) return

    const id = setInterval(() => callbackRef.current(), interval)
    return () => clearInterval(id) // cleanup obbligatorio
  }, [interval])  // solo interval come dipendenza
}
