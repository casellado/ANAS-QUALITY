import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Hook per gestire il banner di installazione PWA.
 *
 * Cattura l'evento 'beforeinstallprompt' che il browser emette
 * quando la PWA è installabile. Permette di mostrare un banner
 * personalizzato invece del default del browser.
 */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault() // Previeni il popup automatico del browser
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    setDeferredPrompt(null)
    setCanInstall(false)

    return outcome === 'accepted'
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    setDeferredPrompt(null)
    setCanInstall(false)
  }, [])

  return { canInstall, install, dismiss }
}
