/**
 * @file DevRoleSwitcher.tsx
 * Selettore ruolo visibile SOLO in dev mode.
 * In produzione IT ANAS assegna ruoli via Azure AD → questo componente non viene renderizzato.
 */
import { useCallback } from 'react'
import { ENV } from '@/config/env'

type Ruolo = 'coordinatore' | 'ispettore'

const IS_DEV = ENV.AZURE_CLIENT_ID.startsWith('xxx')

const RUOLI: { id: Ruolo; icon: string; label: string }[] = [
  { id: 'coordinatore', icon: '🔑', label: 'Coordinatore Prove' },
  { id: 'ispettore',    icon: '👷', label: 'Ispettore Cantiere' },
]

interface DevRoleSwitcherProps {
  readonly ruolo: Ruolo
  readonly onCambiaRuolo: (r: Ruolo) => void
}

export function DevRoleSwitcher({ ruolo, onCambiaRuolo }: DevRoleSwitcherProps) {
  // In produzione non renderizzare nulla
  if (!IS_DEV) return null

  const handleChange = useCallback(
    (r: Ruolo) => {
      onCambiaRuolo(r)
      // Aggiorna anche localStorage per persistenza
      try {
        const profilo = JSON.parse(localStorage.getItem('userProfile') ?? '{}')
        profilo.is_funzionario = r === 'coordinatore'
        profilo.is_admin       = r === 'coordinatore'
        localStorage.setItem('userProfile', JSON.stringify(profilo))
      } catch { /* silenzioso */ }
    },
    [onCambiaRuolo],
  )

  return (
    <div
      className="card border-dashed border-brand-amber/40 bg-brand-amber/5 p-3"
      role="group"
      aria-label="Selettore ruolo di test"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-amber-l">
          🛠 Dev Mode
        </span>
        <span className="text-[10px] text-brand-text3">
          Cambia ruolo al volo
        </span>
      </div>

      {/* Toggle buttons */}
      <div className="flex gap-2">
        {RUOLI.map(r => {
          const isActive = ruolo === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => handleChange(r.id)}
              aria-pressed={isActive}
              aria-label={`Passa al ruolo ${r.label}`}
              className={`
                flex-1 flex items-center justify-center gap-2 
                px-3 py-2.5 rounded-xl text-xs font-bold
                transition-all duration-150 min-h-[44px]
                ${isActive
                  ? r.id === 'coordinatore'
                    ? 'bg-brand-amber/20 text-brand-amber-l border-2 border-brand-amber/50 shadow-sm'
                    : 'bg-brand-blue/20 text-brand-blue-l border-2 border-brand-blue/50 shadow-sm'
                  : 'bg-brand-bg2 text-brand-text3 border-2 border-transparent hover:border-brand-line/40'}
              `}
            >
              <span aria-hidden="true">{r.icon}</span>
              {r.label}
            </button>
          )
        })}
      </div>

      <p className="text-[9px] text-brand-text3/60 text-center mt-1.5 italic">
        In produzione i ruoli sono assegnati da IT ANAS
      </p>
    </div>
  )
}

