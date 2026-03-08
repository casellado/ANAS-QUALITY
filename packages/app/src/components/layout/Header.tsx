import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import logoAnas from '@/assets/logos/logo-anas.png'

/**
 * Header globale dell'app.
 * Mostra: wordmark ANAS + badge cantiere + stato connessione + avatar.
 */
export function Header() {
  const navigate  = useNavigate()
  const { cantiereId } = useParams()
  const isOnline  = useOnlineStatus()

  return (
    <header className="sticky top-0 z-40 bg-brand-card border-b border-brand-line
                       px-4 py-3 flex items-center gap-3 safe-top">

      {/* Back button — solo se non in root */}
      <button
        onClick={() => navigate(-1)}
        className="btn-icon"
        aria-label="Torna alla pagina precedente"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Logo ANAS + Wordmark */}
      <div className="flex-1 flex items-center gap-2">
        <img
          src={logoAnas}
          alt="ANAS"
          className="h-8 w-auto object-contain"
        />
        <span className="font-serif font-bold text-base text-brand-text tracking-wide">
          <span className="text-[#FDB913]">ANAS</span>{' '}
          <span className="text-[#003DA5]">QUALITY</span>
        </span>
        {cantiereId && (
          <span className="ml-2 badge badge-blue" aria-label={`Cantiere ${cantiereId}`}>
            {cantiereId}
          </span>
        )}
      </div>

      {/* Status connessione */}
      <div
        role="status"
        aria-label={isOnline ? 'Online' : 'Offline'}
        className="flex items-center gap-1.5 text-xs"
      >
        <span
          className={`status-dot ${isOnline ? 'status-dot-online' : 'status-dot-offline'}`}
          aria-hidden="true"
        />
        <span className={isOnline ? 'text-brand-green-l' : 'text-brand-amber-l'}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

    </header>
  )
}
