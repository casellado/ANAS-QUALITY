import { useState, useEffect } from 'react'

/**
 * Hook per monitorare lo stato della connessione di rete.
 *
 * Ascolta sia navigator.onLine (snapshot iniziale)
 * sia gli eventi 'online'/'offline' (aggiornamenti real-time).
 *
 * Usato da OfflineBanner e da tutti i service per decidere
 * se tentare la sync o aspettare Workbox Background Sync.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
