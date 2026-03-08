import { useState, useCallback, useMemo } from 'react'
import type { WizardStep } from '@verbali/shared'
import { FirmaCanvas } from '@/components/verbale/FirmaCanvas'

// ── Props ───────────────────────────────────────────────────
interface StepFirmeProps {
  readonly config: WizardStep
  readonly value:  string   // JSON Record<string, string>
  readonly onChange: (value: string) => void
  readonly error?: string | undefined
}

/** Label leggibili per i ruoli firma */
const LABEL_FIRME: Record<string, string> = {
  contraente_generale: 'Contraente Generale',
  impresa_affidataria: 'Impresa Affidataria',
  direzione_lavori:    'Direzione Lavori',
}

function getRuoliFromConfig(config: WizardStep): string[] {
  // Legge i ruoli da config.opzioni oppure usa quelli di default
  return config.opzioni && config.opzioni.length > 0
    ? config.opzioni
    : ['Contraente Generale', 'Impresa Affidataria', 'Direzione Lavori']
}

function toKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

/**
 * Step firme multiplo per il wizard.
 * Gestisce N firme sequenziali su canvas.
 */
export function StepFirme({ config, value, onChange, error }: StepFirmeProps) {
  const ruoli = useMemo(() => getRuoliFromConfig(config), [config])

  const firme = useMemo(() => {
    try { return JSON.parse(value || '{}') as Record<string, string> }
    catch { return {} as Record<string, string> }
  }, [value])

  const [firmaIdx, setFirmaIdx] = useState(0)

  const ruoloCorrente = ruoli[firmaIdx] ?? ''
  const ruoloKey      = toKey(ruoloCorrente)
  const tuttiHannoFirmato = ruoli.every(r => !!firme[toKey(r)])

  // ── Handler firma ───────────────────────────────────────
  const handleFirma = useCallback((dataUrl: string) => {
    const nuoveFirme = { ...firme, [ruoloKey]: dataUrl }
    onChange(JSON.stringify(nuoveFirme))
  }, [firme, ruoloKey, onChange])

  const handleReset = useCallback(() => {
    const nuoveFirme = { ...firme }
    delete nuoveFirme[ruoloKey]
    onChange(JSON.stringify(nuoveFirme))
  }, [firme, ruoloKey, onChange])

  const handleNext = useCallback(() => {
    if (firme[ruoloKey] && firmaIdx < ruoli.length - 1) {
      setFirmaIdx(prev => prev + 1)
    }
  }, [firme, ruoloKey, firmaIdx, ruoli.length])

  const handlePrev = useCallback(() => {
    if (firmaIdx > 0) setFirmaIdx(prev => prev - 1)
  }, [firmaIdx])

  const numFirmate = ruoli.filter(r => !!firme[toKey(r)]).length

  return (
    <div
      role="group"
      aria-label="Raccolta firme digitali"
      className="flex flex-col gap-4"
    >
      {/* ── Domanda ─────────────────────────────────────── */}
      <div>
        <p className="text-base font-bold text-brand-text">{config.domanda}</p>
        <p className="text-sm text-brand-text2 mt-1">{config.hint}</p>
      </div>

      {/* ── Stepper orizzontale ─────────────────────────── */}
      <div className="flex items-center gap-2" role="group" aria-label="Progresso firme">
        {ruoli.map((r, i) => {
          const key   = toKey(r)
          const done  = !!firme[key]
          const label = LABEL_FIRME[key] ?? r
          return (
            <div key={key} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setFirmaIdx(i)}
                aria-current={i === firmaIdx ? 'step' : undefined}
                aria-label={`Firma ${label} — ${done ? 'completata' : 'da firmare'}`}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-xs font-bold transition-all min-h-[32px]
                  ${done
                    ? 'bg-brand-green text-white'
                    : i === firmaIdx
                      ? 'bg-brand-blue text-white'
                      : 'bg-brand-line/30 text-brand-text3'}
                `}
              >
                {done ? '✓' : i + 1}
              </button>
              {i < ruoli.length - 1 && (
                <div className={`flex-1 h-0.5 transition-all
                  ${done ? 'bg-brand-green' : 'bg-brand-line/30'}`}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Barra progresso ─────────────────────────────── */}
      <p
        className="text-xs text-brand-text2 text-center"
        role="status"
        aria-live="polite"
      >
        {numFirmate} di {ruoli.length} firme apposte
      </p>

      {/* ── Canvas o recap finale ───────────────────────── */}
      {tuttiHannoFirmato ? (
        <FirmeRecap
          ruoli={ruoli}
          firme={firme}
          onClickRuolo={setFirmaIdx}
        />
      ) : (
        <FirmaCorrente
          label={LABEL_FIRME[ruoloKey] ?? ruoloCorrente}
          index={firmaIdx}
          total={ruoli.length}
          hasFirma={!!firme[ruoloKey]}
          onFirma={handleFirma}
          onReset={handleReset}
          onNext={handleNext}
          onPrev={handlePrev}
          isFirst={firmaIdx === 0}
          isLast={firmaIdx === ruoli.length - 1}
          nextLabel={LABEL_FIRME[toKey(ruoli[firmaIdx + 1] ?? '')] ?? ''}
        />
      )}

      {/* Errore */}
      {error && (
        <p className="form-error" role="alert">{error}</p>
      )}
    </div>
  )
}

// ── Sub-component: firma corrente ─────────────────────────
interface FirmaCorrenteProps {
  readonly label:     string
  readonly index:     number
  readonly total:     number
  readonly hasFirma:  boolean
  readonly onFirma:   (dataUrl: string) => void
  readonly onReset:   () => void
  readonly onNext:    () => void
  readonly onPrev:    () => void
  readonly isFirst:   boolean
  readonly isLast:    boolean
  readonly nextLabel: string
}

function FirmaCorrente({
  label, index, total, hasFirma,
  onFirma, onReset, onNext, onPrev,
  isFirst, isLast, nextLabel,
}: FirmaCorrenteProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-brand-text">
        Firma <span className="text-brand-blue-l">{label}</span>
        <span className="text-brand-text3 text-xs ml-2">
          ({index + 1} di {total})
        </span>
      </p>

      <FirmaCanvas onFirma={onFirma} onReset={onReset} disabled={false} />

      <div className="flex gap-2">
        {!isFirst && (
          <button
            onClick={onPrev}
            aria-label="Torna alla firma precedente"
            className="btn-ghost min-h-[44px] px-4 text-sm"
          >
            ← Indietro
          </button>
        )}
        <button
          onClick={onNext}
          disabled={!hasFirma}
          aria-label={
            isLast
              ? 'Conferma tutte le firme'
              : `Conferma firma ${label} e passa a ${nextLabel}`
          }
          className="flex-1 btn-primary min-h-[44px] text-sm disabled:opacity-40"
        >
          {isLast
            ? '✓ Conferma tutte le firme'
            : `Firma successiva → ${nextLabel}`
          }
        </button>
      </div>
    </div>
  )
}

// ── Sub-component: recap tutte le firme ───────────────────
interface FirmeRecapProps {
  readonly ruoli:        string[]
  readonly firme:        Record<string, string>
  readonly onClickRuolo: (idx: number) => void
}

function FirmeRecap({ ruoli, firme, onClickRuolo }: FirmeRecapProps) {
  return (
    <div className="card bg-brand-green/10 border-brand-green/30 p-4">
      <p className="text-brand-green-l font-semibold text-sm text-center mb-3">
        ✅ Tutte le firme apposte
      </p>
      <div className="grid grid-cols-3 gap-2">
        {ruoli.map((r, i) => {
          const key   = toKey(r)
          const label = LABEL_FIRME[key] ?? r
          return (
            <button
              key={key}
              onClick={() => onClickRuolo(i)}
              aria-label={`Rifirma ${label}`}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-full rounded-xl bg-brand-bg border border-brand-line/30 overflow-hidden h-16">
                {firme[key] ? (
                  <img
                    src={firme[key]}
                    alt={`Firma ${label}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-text3 text-xs">
                    vuota
                  </div>
                )}
              </div>
              <span className="text-xs text-brand-text2 text-center leading-tight">
                {label}
              </span>
              {firme[key] && (
                <span className="text-xs text-brand-green-l">✓</span>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-brand-text3 text-center mt-2">
        Tocca una firma per modificarla
      </p>
    </div>
  )
}

