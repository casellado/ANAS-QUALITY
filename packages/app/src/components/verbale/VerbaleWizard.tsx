import { useCallback, useEffect, useRef, useState } from 'react'
import type { Verbale, TipoVerbale } from '@verbali/shared'
import { validaChainOfCustody, generaCodiceVerbale, now } from '@verbali/shared'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/ToastContext'
import { WizardProgress } from '@/components/verbale/WizardProgress'
import { WizardStepRenderer } from '@/components/verbale/WizardStepRenderer'
import { useWizardState } from '@/components/verbale/useWizardState'
import { prossimoProgressivo } from '@/services/ProgressivoService'

// ── Props ───────────────────────────────────────────────────
interface VerbaleWizardProps {
  readonly sigla: string
  readonly idCantiere: string
  readonly tipoVerbale: TipoVerbale
  readonly onComplete: (verbale: Verbale) => void
  readonly onCancel: () => void
}

export function VerbaleWizard({
  sigla,
  idCantiere,
  tipoVerbale,
  onComplete,
  onCancel,
}: VerbaleWizardProps) {
  const toast = useToast()
  const stepRef = useRef<HTMLDivElement>(null)

  const {
    verbale,
    setVerbale,
    currentStep,
    totalSteps,
    stepCorrente,
    stepValue,
    stepError,
    isFirstStep,
    isLastStep,
    handleFieldChange,
    avanza,
    indietro,
    salvaBozza,
  } = useWizardState(tipoVerbale, idCantiere)

  // ── Focus primo input ad ogni cambio step ─────────────────
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const el = stepRef.current?.querySelector<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      )
      el?.focus()
    })
    return () => cancelAnimationFrame(raf)
  }, [currentStep])

  // ── Avanza step ───────────────────────────────────────────
  const handleAvanza = useCallback(async () => {
    const ok = await avanza()
    if (!ok) {
      toast.warning('Compila il campo obbligatorio prima di proseguire')
    }
  }, [avanza, toast])

  const [isCompleting, setIsCompleting] = useState(false)

  // ── Completa wizard ───────────────────────────────────────
  const handleCompleta = useCallback(async () => {
    if (isCompleting) return // previeni doppio click
    setIsCompleting(true)

    try {
      // Validazione chain of custody per VPC
      if (sigla.startsWith('VPC')) {
        const errori = validaChainOfCustody(verbale)
        if (errori.length > 0) {
          toast.error(`Chain of custody incompleta: ${errori.join(', ')}`)
          return
        }
      }

      // ── 1. Assegna progressivo univoco ────────────────────
      const progressivo = await prossimoProgressivo(idCantiere, sigla)
      const codice = generaCodiceVerbale(
        sigla,
        verbale.opera || 'ND',
        verbale.data || new Date().toISOString().slice(0, 10),
        progressivo,
      )

      // ── 2. Completa il verbale ────────────────────────────
      const verbaleCompleto = {
        ...verbale,
        progressivo,
        codice,
        stato: 'completo' as const,
        updated_at: now(),
      } as Verbale

      await salvaBozza()

      // ── 3. Audit trail ────────────────────────────────────
      verbaleCompleto.storia = [
        ...(verbaleCompleto.storia ?? []),
        {
          timestamp: now(),
          utente: verbaleCompleto.ispettore || 'Ispettore',
          utente_email: verbaleCompleto.ispettore_email || '',
          azione: 'completamento' as const,
          note: `Wizard completato — ${tipoVerbale.nome} — progressivo ${progressivo}`,
        },
      ]

      setVerbale(verbaleCompleto)
      onComplete(verbaleCompleto)
    } catch (error) {
      toast.error(`Errore salvataggio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    } finally {
      setIsCompleting(false)
    }
  }, [isCompleting, sigla, verbale, idCantiere, salvaBozza, setVerbale, onComplete, tipoVerbale.nome, toast])

  // Guard clause
  if (!stepCorrente) {
    return (
      <div role="alert" className="card border-brand-red-l">
        <p className="text-brand-red-l">Nessuno step configurato per {sigla}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Progress ─────────────────────────────────────── */}
      <WizardProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
        {...(verbale.codice ? { codiceVerbale: verbale.codice } : {})}
      />

      {/* ── History step completati ──────────────────────── */}
      {currentStep > 0 && (
        <div className="flex flex-wrap gap-2">
          {tipoVerbale.steps.slice(0, currentStep).map((s, i) => (
            <span
              key={s.key}
              className="badge-blue text-xs"
              aria-label={`Passo ${i + 1}: ${s.domanda} — completato`}
            >
              {i + 1}. {s.domanda.substring(0, 25)}{s.domanda.length > 25 ? '…' : ''}
            </span>
          ))}
        </div>
      )}

      {/* ── Step corrente ────────────────────────────────── */}
      <div ref={stepRef}>
        <WizardStepRenderer
          config={stepCorrente}
          value={stepValue}
          onChange={(v) => handleFieldChange(stepCorrente.key, v)}
          {...(stepError ? { error: stepError } : {})}
        />
      </div>

      {/* ── Navigazione ──────────────────────────────────── */}
      <div className="flex gap-3 justify-between">
        {isFirstStep ? (
          <button
            onClick={onCancel}
            className="btn-ghost min-h-[44px] flex items-center gap-1"
            aria-label="Annulla compilazione"
          >
            Annulla
          </button>
        ) : (
          <button
            onClick={indietro}
            className="btn-secondary min-h-[44px] flex items-center gap-1"
            aria-label="Torna al passo precedente"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Indietro
          </button>
        )}

        {isLastStep ? (
          <button
            onClick={handleCompleta}
            disabled={isCompleting}
            className="btn-primary min-h-[44px] flex items-center gap-2"
            aria-label="Completa il verbale"
            aria-busy={isCompleting}
          >
            {isCompleting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            )}
            {isCompleting ? 'Completamento…' : 'Completa'}
          </button>
        ) : (
          <button
            onClick={handleAvanza}
            className="btn-primary min-h-[44px] flex items-center gap-1"
            aria-label="Vai al passo successivo"
          >
            Avanti
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

