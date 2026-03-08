import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Qualifica, UserProfile } from '@verbali/shared'
import { getSaluto, now } from '@verbali/shared'
import { useAuth } from '@/auth/useAuth'
import { Spinner } from '@/components/ui/Spinner'
import logoAnas from '@/assets/logos/logo-anas.png'

// ── Costanti ────────────────────────────────────────────────
const QUALIFICHE: Qualifica[] = ['Ingegnere', 'Geometra', 'Architetto', 'Per. Ind.', 'Altro']

type Ruolo = 'coordinatore' | 'ispettore'

const RUOLI: { id: Ruolo; label: string; icon: string; desc: string }[] = [
  { id: 'coordinatore', label: 'Coordinatore Prove',   icon: '🔑', desc: 'Programma e inserisce le prove nel PES' },
  { id: 'ispettore',    label: 'Ispettore di Cantiere', icon: '👷', desc: 'Prende in carico ed esegue le prove assegnate' },
]

interface FormData {
  nome:      string
  cognome:   string
  qualifica: Qualifica | ''
  mansione:  string
  ruolo:     Ruolo | ''
}

interface FormErrors {
  nome?:      string
  cognome?:   string
  qualifica?: string
  ruolo?:     string
}

/**
 * ProfileSetupPage — configurazione profilo al primo login.
 *
 * Stepper visuale a 2 step:
 *   Step 1: Dati personali (nome, cognome, qualifica, mansione)
 *   Step 2: Conferma riepilogo e salvataggio
 *
 * Mostrata UNA SOLA VOLTA — dopo il salvataggio, l'utente va diretto a /cantiere.
 */
export default function ProfileSetupPage() {
  const navigate = useNavigate()
  const { account } = useAuth()

  const [step, setStep]         = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Pre-popola da MSAL account info
  const [form, setForm] = useState<FormData>(() => {
    const nameParts = (account?.name ?? '').split(' ')
    return {
      nome:      nameParts[0] ?? '',
      cognome:   nameParts.slice(1).join(' ') || '',
      qualifica: '',
      mansione:  '',
      ruolo:     '',
    }
  })

  const [errors, setErrors] = useState<FormErrors>({})

  const email = account?.username ?? ''

  // ── Handlers ──────────────────────────────────────────────
  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }, [])

  const validaStep1 = useCallback((): boolean => {
    const newErrors: FormErrors = {}
    if (!form.nome.trim())      newErrors.nome = 'Il nome è obbligatorio'
    if (!form.cognome.trim())   newErrors.cognome = 'Il cognome è obbligatorio'
    if (!form.qualifica)        newErrors.qualifica = 'Seleziona una qualifica'
    if (!form.ruolo)            newErrors.ruolo = 'Seleziona il tuo ruolo'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [form.nome, form.cognome, form.qualifica, form.ruolo])

  const handleAvanti = useCallback(() => {
    if (!validaStep1()) return
    setStep(2)
  }, [validaStep1])

  const handleIndietro = useCallback(() => {
    setStep(1)
  }, [])

  const handleConferma = useCallback(async () => {
    setIsLoading(true)
    try {
      const isCoordinatore = form.ruolo === 'coordinatore'
      const profilo: UserProfile = {
        email,
        nome:                 form.nome.trim(),
        cognome:              form.cognome.trim(),
        qualifica:            form.qualifica as Qualifica,
        mansione:             form.mansione.trim() || (isCoordinatore ? 'Coordinatore Prove' : 'Ispettore di Cantiere'),
        cantieri_autorizzati: [],    // riempiti in CantiereSelectPage
        is_admin:             isCoordinatore,
        is_funzionario:       isCoordinatore,
        created_at:           now(),
        updated_at:           now(),
      }
      localStorage.setItem('userProfile', JSON.stringify(profilo))
      navigate('/cantiere')
    } catch {
      // Improbabile — localStorage non scrive
    } finally {
      setIsLoading(false)
    }
  }, [email, form, navigate])

  // ── Saluto anteprima ──────────────────────────────────────
  const salutoAnteprima = useMemo(() => {
    if (!form.cognome.trim() || !form.qualifica) return ''
    return getSaluto(form.cognome.trim(), form.qualifica)
  }, [form.cognome, form.qualifica])

  // ── Progress bar ──────────────────────────────────────────
  const progressPercent = step === 1 ? 50 : 100

  return (
    <div className="min-h-screen bg-brand-bg animate-fade-in">

      {/* ── Header fisso ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-brand-card border-b border-brand-line px-4 py-3 flex items-center gap-3 safe-top">
        <img src={logoAnas} alt="ANAS" className="h-8 w-auto object-contain" />
        <span className="font-serif font-bold text-base text-brand-text tracking-wide">
          <span className="text-[#FDB913]">ANAS</span>{' '}
          <span className="text-[#003DA5]">QUALITY</span>
        </span>
        <span className="text-brand-text2 text-sm ml-2">Configurazione Profilo</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">

        {/* ── Stepper visuale ──────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-brand-text2 mb-2">
            <span className={step >= 1 ? 'text-brand-text font-semibold' : ''}>
              1. Dati personali
            </span>
            <span className={step >= 2 ? 'text-brand-text font-semibold' : ''}>
              2. Conferma
            </span>
          </div>
          <div
            className="wiz-progress"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={2}
            aria-label="Progresso configurazione profilo"
          >
            <div
              className="wiz-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ── Step 1: Dati personali ───────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <h2 className="text-xl font-bold text-brand-text">Dati personali</h2>
            <p className="text-sm text-brand-text2">
              Completa il tuo profilo per iniziare ad usare il sistema.
            </p>

            {/* Nome */}
            <div>
              <label htmlFor="prf-nome" className="form-label">
                Nome <span className="text-brand-red-l">*</span>
              </label>
              <input
                id="prf-nome"
                type="text"
                value={form.nome}
                onChange={e => updateField('nome', e.target.value)}
                placeholder="Mario"
                className={errors.nome ? 'input-field-error w-full mt-1' : 'input-field w-full mt-1'}
                aria-required="true"
                aria-invalid={!!errors.nome}
                aria-describedby={errors.nome ? 'prf-nome-err' : undefined}
              />
              {errors.nome && (
                <p id="prf-nome-err" className="form-error" role="alert">{errors.nome}</p>
              )}
            </div>

            {/* Cognome */}
            <div>
              <label htmlFor="prf-cognome" className="form-label">
                Cognome <span className="text-brand-red-l">*</span>
              </label>
              <input
                id="prf-cognome"
                type="text"
                value={form.cognome}
                onChange={e => updateField('cognome', e.target.value)}
                placeholder="Rossi"
                className={errors.cognome ? 'input-field-error w-full mt-1' : 'input-field w-full mt-1'}
                aria-required="true"
                aria-invalid={!!errors.cognome}
                aria-describedby={errors.cognome ? 'prf-cognome-err' : undefined}
              />
              {errors.cognome && (
                <p id="prf-cognome-err" className="form-error" role="alert">{errors.cognome}</p>
              )}
            </div>

            {/* Email — readonly */}
            <div>
              <label htmlFor="prf-email" className="form-label">Email</label>
              <div className="relative">
                <input
                  id="prf-email"
                  type="email"
                  value={email}
                  readOnly
                  className="input-field w-full mt-1 opacity-70 cursor-not-allowed pr-28"
                  aria-label="Email da Azure AD — non modificabile"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 badge-blue text-[10px]">
                  Da Azure AD
                </span>
              </div>
            </div>

            {/* Qualifica */}
            <div>
              <label htmlFor="prf-qualifica" className="form-label">
                Qualifica <span className="text-brand-red-l">*</span>
              </label>
              <select
                id="prf-qualifica"
                value={form.qualifica}
                onChange={e => updateField('qualifica', e.target.value as Qualifica)}
                className={errors.qualifica ? 'select-field input-field-error w-full mt-1' : 'select-field w-full mt-1'}
                aria-required="true"
                aria-invalid={!!errors.qualifica}
                aria-describedby={errors.qualifica ? 'prf-qualifica-err' : undefined}
              >
                <option value="">Seleziona qualifica...</option>
                {QUALIFICHE.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              {errors.qualifica && (
                <p id="prf-qualifica-err" className="form-error" role="alert">{errors.qualifica}</p>
              )}
            </div>

            {/* Mansione */}
            <div>
              <label htmlFor="prf-mansione" className="form-label">Mansione</label>
              <input
                id="prf-mansione"
                type="text"
                value={form.mansione}
                onChange={e => updateField('mansione', e.target.value)}
                placeholder="es. Ispettore di Cantiere"
                className="input-field w-full mt-1"
                aria-label="Mansione"
              />
            </div>

            {/* Ruolo — card selezionabili */}
            <div>
              <p className="form-label">
                Ruolo <span className="text-brand-red-l">*</span>
              </p>
              <div className="flex flex-col gap-2.5 mt-1">
                {RUOLI.map(r => {
                  const isSelected = form.ruolo === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => updateField('ruolo', r.id)}
                      aria-pressed={isSelected}
                      aria-label={`${r.label}: ${r.desc}`}
                      className={`
                        relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-150
                        min-h-[72px] cursor-pointer
                        ${isSelected
                          ? 'border-brand-blue bg-brand-blue/10 shadow-sm'
                          : 'border-brand-line/40 bg-brand-card hover:border-brand-line hover:bg-brand-card/80'}
                      `}
                    >
                      {/* Icon */}
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
                        ${isSelected
                          ? 'bg-brand-blue/20'
                          : 'bg-brand-line/20'}
                      `} aria-hidden="true">
                        {r.icon}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${isSelected ? 'text-brand-blue-l' : 'text-brand-text'}`}>
                          {r.label}
                        </p>
                        <p className="text-xs text-brand-text2 mt-0.5">{r.desc}</p>
                      </div>

                      {/* Check indicator */}
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center flex-shrink-0"
                             aria-hidden="true">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              {errors.ruolo && (
                <p className="form-error" role="alert">{errors.ruolo}</p>
              )}
            </div>

            {/* Bottone Avanti */}
            <button
              onClick={handleAvanti}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              aria-label="Procedi alla conferma dei dati"
            >
              Avanti <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        {/* ── Step 2: Conferma ─────────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <h2 className="text-xl font-bold text-brand-text">Conferma profilo</h2>
            <p className="text-sm text-brand-text2">
              Verifica che i dati siano corretti. Potrai modificarli in seguito.
            </p>

            {/* Saluto anteprima */}
            {salutoAnteprima && (
              <div
                className="card bg-brand-blue/5 border-brand-blue/20 text-center"
                role="status"
                aria-live="polite"
              >
                <p className="text-lg text-brand-text">{salutoAnteprima}</p>
                <p className="text-xs text-brand-text3 mt-1">
                  Questo è il saluto che vedrai all&apos;accesso
                </p>
              </div>
            )}

            {/* Riepilogo dati */}
            <div className="card flex flex-col gap-3">
              <RiepilogoRow label="Nome" value={form.nome} />
              <RiepilogoRow label="Cognome" value={form.cognome} />
              <RiepilogoRow label="Email" value={email} mono />
              <RiepilogoRow label="Qualifica" value={form.qualifica} />
              {form.mansione && <RiepilogoRow label="Mansione" value={form.mansione} />}
              <RiepilogoRow
                label="Ruolo"
                value={form.ruolo === 'coordinatore' ? '🔑 Coordinatore Prove' : '👷 Ispettore di Cantiere'}
              />
            </div>

            {/* Bottoni */}
            <div className="flex gap-3">
              <button
                onClick={handleIndietro}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
                aria-label="Torna alla modifica dei dati"
              >
                <span aria-hidden="true">←</span> Modifica
              </button>
              <button
                onClick={handleConferma}
                disabled={isLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                aria-label="Conferma profilo e accedi"
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <><Spinner label="Salvataggio..." /> Salvataggio…</>
                ) : (
                  <><span aria-hidden="true">✓</span> Conferma e accedi</>
                )}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

// ── Componente riga riepilogo ──────────────────────────────
interface RiepilogoRowProps {
  readonly label: string
  readonly value: string
  readonly mono?: boolean
}

function RiepilogoRow({ label, value, mono }: RiepilogoRowProps) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-brand-line/50 last:border-0">
      <span className="text-sm text-brand-text2">{label}</span>
      <span className={`text-sm text-brand-text font-medium ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}
