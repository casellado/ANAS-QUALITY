import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Cantiere, UserProfile } from '@verbali/shared'
import { getSaluto, now } from '@verbali/shared'
import { useAuth } from '@/auth/useAuth'
import { IS_DEV_AUTH } from '@/auth/AuthContext'
import { fetchCantieri, saveCantieri, loadCantieri } from '@/services/CantiereFetcher'
import { CantiereCard } from '@/components/cantiere/CantiereCard'
import { Spinner } from '@/components/ui/Spinner'
import { LogOut } from 'lucide-react'
import logoAnas from '@/assets/logos/logo-anas.png'

// ── Cantieri mock per dev mode ──────────────────────────────
const DEV_CANTIERI: Cantiere[] = [
  {
    id:        'CAN-001',
    nome:      'A3 Napoli — Lotto 1',
    codice:    'A3-NA-L1',
    tratta:    'Km 10+000 ÷ Km 25+000',
    provincia: 'NA',
    regione:   'Campania',
    is_attivo: true,
  },
  {
    id:        'CAN-002',
    nome:      'A1 Roma — Lotto 3',
    codice:    'A1-RM-L3',
    tratta:    'Km 580+000 ÷ Km 610+000',
    provincia: 'RM',
    regione:   'Lazio',
    is_attivo: true,
  },
  {
    id:        'CAN-003',
    nome:      'SS16 Adriatica — Variante Bari',
    codice:    'SS16-BA',
    tratta:    'Km 0+000 ÷ Km 12+000',
    provincia: 'BA',
    regione:   'Puglia',
    is_attivo: true,
  },
]

/**
 * CantiereSelectPage — selezione cantiere autorizzato.
 *
 * SEMPRE mostrata dopo il login, anche con 1 solo cantiere.
 * L'ispettore deve vedere chiaramente su quale cantiere opera.
 *
 * Flusso dati:
 *  1. Mostra subito dalla cache localStorage (zero loading percepito)
 *  2. Ricarica da Graph API in background
 *  3. Aggiorna la lista e la cache
 */
export default function CantiereSelectPage() {
  const navigate = useNavigate()
  const { getToken, logout, account } = useAuth()

  const [cantieri, setCantieri]   = useState<Cantiere[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // ── Carica profilo da localStorage ──────────────────────
  const profilo = useMemo<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem('userProfile')
      return raw ? JSON.parse(raw) as UserProfile : null
    } catch {
      return null
    }
  }, [])

  // ── Saluto personalizzato ─────────────────────────────────
  const saluto = useMemo(() => {
    if (!profilo) return ''
    return getSaluto(profilo.cognome, profilo.qualifica)
  }, [profilo])

  // ── Ultimo cantiere usato ─────────────────────────────────
  const ultimoCantiere = useMemo(() => {
    const ultimoId = localStorage.getItem('ultimo_cantiere')
    if (!ultimoId) return null
    return cantieri.find(c => c.id === ultimoId) ?? null
  }, [cantieri])

  // ── Cantieri senza l'ultimo (per sezione "Tutti") ─────────
  const altriCantieri = useMemo(() => {
    if (!ultimoCantiere) return cantieri
    return cantieri.filter(c => c.id !== ultimoCantiere.id)
  }, [cantieri, ultimoCantiere])

  // ── Caricamento cantieri ──────────────────────────────────
  useEffect(() => {
    const controller = new AbortController()

    // 1. Mostra subito dalla cache
    const cached = loadCantieri()
    if (cached && cached.length > 0) {
      setCantieri(cached)
      setIsLoading(false)
    }

    // 2. Dev mode — usa cantieri mock
    if (IS_DEV_AUTH) {
      setCantieri(DEV_CANTIERI)
      saveCantieri(DEV_CANTIERI)
      setIsLoading(false)
      return
    }

    // 3. Produzione — ricarica da Graph API in background
    getToken()
      .then(token => fetchCantieri(token, controller.signal))
      .then(lista => {
        if (controller.signal.aborted) return
        setCantieri(lista)
        saveCantieri(lista)

        // Aggiorna cantieri_autorizzati nel profilo locale
        if (profilo) {
          const updated: UserProfile = {
            ...profilo,
            cantieri_autorizzati: lista.map(c => c.id),
            updated_at: now(),
          }
          localStorage.setItem('userProfile', JSON.stringify(updated))
        }
      })
      .catch(err => {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Errore nel caricamento cantieri')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Selezione cantiere ────────────────────────────────────
  const handleSeleziona = useCallback((cantiereId: string) => {
    localStorage.setItem('ultimo_cantiere', cantiereId)
    navigate(`/cantiere/${cantiereId}`)
  }, [navigate])

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      // Silenzioso — se logout fallisce, comunque redirect
      navigate('/login')
    }
  }, [logout, navigate])

  // ── Retry ─────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setError(null)
    setIsLoading(true)

    if (IS_DEV_AUTH) {
      setCantieri(DEV_CANTIERI)
      saveCantieri(DEV_CANTIERI)
      setIsLoading(false)
      return
    }

    getToken()
      .then(token => fetchCantieri(token))
      .then(lista => {
        setCantieri(lista)
        saveCantieri(lista)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Errore nel caricamento cantieri')
      })
      .finally(() => setIsLoading(false))
  }, [getToken])

  return (
    <div className="min-h-screen bg-brand-bg animate-fade-in">

      {/* ── Header custom inline ──────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-brand-card border-b border-brand-line px-4 py-3 flex items-center gap-3 safe-top">
        <img src={logoAnas} alt="ANAS" className="h-8 w-auto object-contain" />
        <div className="flex-1">
          <span className="font-serif font-bold text-base text-brand-text tracking-wide">
            <span className="text-[#FDB913]">ANAS</span>{' '}
            <span className="text-[#003DA5]">QUALITY</span>
          </span>
          <span className="text-brand-text2 text-sm ml-2">Seleziona Cantiere</span>
        </div>
        <button
          onClick={handleLogout}
          className="btn-ghost flex items-center gap-2 text-sm"
          aria-label="Esci dall'applicazione"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Esci</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">

        {/* ── Saluto + sottotitolo ─────────────────────────────── */}
        <div className="mb-6">
          {saluto && (
            <h1 className="text-xl font-bold text-brand-text">{saluto}</h1>
          )}
          <p className="text-sm text-brand-text2 mt-1">
            Seleziona il cantiere su cui vuoi operare
          </p>
          {cantieri.length > 0 && (
            <p className="text-xs text-brand-text3 mt-1">
              Hai accesso a {cantieri.length} cantier{cantieri.length === 1 ? 'e' : 'i'}
            </p>
          )}
        </div>

        {/* ── Accesso rapido (ultimo cantiere) ─────────────────── */}
        {ultimoCantiere && !isLoading && (
          <section className="mb-6">
            <h2 className="section-title">Accesso rapido</h2>
            <CantiereCard
              cantiere={ultimoCantiere}
              onSeleziona={handleSeleziona}
              badgeExtra="Ultimo accesso"
            />
          </section>
        )}

        {/* ── Lista cantieri ───────────────────────────────────── */}
        <section>
          {(ultimoCantiere && altriCantieri.length > 0) && (
            <h2 className="section-title">Tutti i cantieri</h2>
          )}

          {/* Loading skeleton */}
          {isLoading && cantieri.length === 0 && (
            <div className="flex flex-col gap-3" aria-busy="true" aria-label="Caricamento cantieri...">
              {[1, 2, 3].map(n => (
                <div
                  key={n}
                  className="card bg-brand-card animate-pulse-soft h-24 rounded-2xl"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* Errore + lista vuota */}
          {error && cantieri.length === 0 && (
            <div
              role="alert"
              className="card bg-brand-red/5 border-brand-red/20 text-center py-8"
            >
              <p className="text-brand-red-l text-sm mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="btn-primary"
                aria-label="Riprova il caricamento dei cantieri"
              >
                Riprova
              </button>
            </div>
          )}

          {/* Nessun cantiere */}
          {!isLoading && !error && cantieri.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-brand-text2">
                Nessun cantiere autorizzato — contatta l&apos;amministratore
              </p>
            </div>
          )}

          {/* Griglia cantieri */}
          {(ultimoCantiere ? altriCantieri : cantieri).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(ultimoCantiere ? altriCantieri : cantieri).map(c => (
                <CantiereCard
                  key={c.id}
                  cantiere={c}
                  onSeleziona={handleSeleziona}
                />
              ))}
            </div>
          )}

          {/* Loading indicator se già ci sono cantieri dalla cache */}
          {isLoading && cantieri.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-4 text-brand-text3 text-xs">
              <Spinner className="w-3 h-3" label="Aggiornamento..." />
              <span>Aggiornamento in corso...</span>
            </div>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="mt-10 pt-4 border-t border-brand-line/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-brand-text3">
          <div className="flex items-center gap-2">
            <span>{account?.username ?? profilo?.email ?? ''}</span>
            {profilo?.qualifica && (
              <span className="badge-blue">{profilo.qualifica}</span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-brand-text3 hover:text-brand-text transition-colors underline underline-offset-2"
            aria-label="Cambia account — esci e accedi con un altro utente"
          >
            Cambia account
          </button>
        </footer>

      </main>
    </div>
  )
}
