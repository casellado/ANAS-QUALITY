import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { IS_DEV_AUTH } from '@/auth/AuthContext'
import { Spinner } from '@/components/ui/Spinner'
import logoAnas from '@/assets/logos/logo-anas.png'

// ── Microsoft SVG logo (4 quadrati colorati 2×2) ─────────────
function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="0"  y="0"  width="10" height="10" fill="#F25022" />
      <rect x="11" y="0"  width="10" height="10" fill="#7FBA00" />
      <rect x="0"  y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  )
}

// ── Feature badges ──────────────────────────────────────────
const FEATURES = [
  { icon: '🔒', label: 'Accesso sicuro Azure AD' },
  { icon: '📡', label: 'Sincronizzazione OneDrive' },
  { icon: '✈️', label: 'Modalità offline' },
] as const

/**
 * LoginPage — prima schermata dell'app.
 *
 * Layout:
 *   - Mobile: branding sopra, form sotto
 *   - Tablet+: 2 colonne (branding sinistra, form destra)
 *
 * - Dev mode (AZURE_CLIENT_ID con placeholder) → form admin/admin
 * - Produzione → pulsante MSAL popup
 */
export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [username, setUsername]    = useState('')
  const [password, setPassword]   = useState('')

  // ── Redirect se già autenticato ──────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return
    const profiloSalvato = localStorage.getItem('userProfile')
    if (!profiloSalvato) {
      navigate('/profilo', { replace: true })
    } else {
      navigate('/cantiere', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // ── Handler login dev (admin/admin) ──────────────────────
  const handleDevLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await login(username, password)
      const profiloSalvato = localStorage.getItem('userProfile')
      if (!profiloSalvato) {
        navigate('/profilo')
      } else {
        navigate('/cantiere')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenziali non valide')
    } finally {
      setIsLoading(false)
    }
  }, [login, username, password, navigate])

  // ── Handler login MSAL ──────────────────────────────────
  const handleMsalLogin = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      await login()
      const profiloSalvato = localStorage.getItem('userProfile')
      if (!profiloSalvato) {
        navigate('/profilo')
      } else {
        navigate('/cantiere')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accesso non riuscito. Riprova.')
    } finally {
      setIsLoading(false)
    }
  }, [login, navigate])

  // Se già autenticato, mostra solo il loader (il useEffect farà redirect)
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-bg">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-brand-bg flex items-center justify-center p-4 md:p-8 animate-fade-in"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 40px)',
      }}
    >
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-10 md:gap-16">

        {/* ── Sezione branding (sinistra su tablet / sopra su mobile) ── */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-5">
          <img
            src={logoAnas}
            alt="ANAS S.p.A. — Gruppo FS Italiane"
            className="h-20 w-auto object-contain"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif tracking-wide">
              <span className="text-[#FDB913]">ANAS</span>{' '}
              <span className="text-[#003DA5]">QUALITY</span>
            </h1>
            <p className="text-brand-text2 mt-2 text-sm md:text-base">
              Sistema digitale di gestione verbali di ispezione
            </p>
          </div>

          {/* Feature badge */}
          <div className="flex flex-col gap-2 mt-2">
            {FEATURES.map(f => (
              <div
                key={f.label}
                className="flex items-center gap-2.5 text-sm text-brand-text2"
              >
                <span aria-hidden="true" className="text-base">{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Sezione form (destra su tablet / sotto su mobile) ────── */}
        <div className="w-full max-w-sm flex flex-col gap-5">

          <div className="card p-6 md:p-8 flex flex-col gap-5">
            <h2 className="text-xl font-bold text-brand-text text-center">
              Accedi al sistema
            </h2>

            {/* Dev mode badge */}
            {IS_DEV_AUTH && (
              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-brand-amber/15 text-brand-amber-l text-xs font-mono">
                  🔧 DEV MODE — admin / admin
                </span>
              </div>
            )}

            {/* Errore */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="text-brand-red-l text-sm text-center p-3 bg-brand-red/10 rounded-xl border border-brand-red/30"
              >
                {error}
              </div>
            )}

            {IS_DEV_AUTH ? (
              /* ── Form dev login ─────────────────────────────── */
              <form onSubmit={handleDevLogin} className="flex flex-col gap-3">
                <div>
                  <label htmlFor="dev-user" className="form-label">Username</label>
                  <input
                    id="dev-user"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                    className="input-field w-full mt-1"
                    aria-label="Username"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="dev-pass" className="form-label">Password</label>
                  <input
                    id="dev-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin"
                    autoComplete="current-password"
                    className="input-field w-full mt-1"
                    aria-label="Password"
                    aria-required="true"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !username || !password}
                  aria-label="Accedi"
                  aria-busy={isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-3 mt-2 min-h-[52px]"
                >
                  {isLoading ? (
                    <><Spinner label="Accesso in corso..." /> Accesso in corso…</>
                  ) : (
                    <><span aria-hidden="true">🔓</span> Accedi</>
                  )}
                </button>
              </form>
            ) : (
              /* ── MSAL login button ──────────────────────────── */
              <button
                onClick={handleMsalLogin}
                disabled={isLoading}
                aria-label="Accedi con il tuo account Microsoft ANAS"
                aria-busy={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-3 min-h-[52px]"
              >
                {isLoading ? (
                  <><Spinner label="Accesso in corso..." /> Accesso in corso…</>
                ) : (
                  <><MicrosoftIcon /> Accedi con Microsoft</>
                )}
              </button>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-brand-text3 text-center">
            {IS_DEV_AUTH
              ? 'Ambiente di sviluppo locale — credenziali: admin / admin'
              : 'Accesso riservato al personale ANAS autorizzato'
            }
          </p>
        </div>

      </div>
    </div>
  )
}
