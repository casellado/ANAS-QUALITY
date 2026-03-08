// ── WizardProgress — barra progresso wizard ─────────────────
interface WizardProgressProps {
  readonly currentStep: number
  readonly totalSteps: number
  readonly codiceVerbale?: string | undefined
}

export function WizardProgress({ currentStep, totalSteps, codiceVerbale }: WizardProgressProps) {
  const percent = Math.round(((currentStep + 1) / totalSteps) * 100)

  return (
    <div className="flex flex-col gap-2">
      {/* ── Header: step counter + codice ───────────────── */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-brand-text2 font-medium tabular-nums">
          {currentStep + 1} / {totalSteps}
        </span>

        {codiceVerbale && (
          <span className="verbale-codice">{codiceVerbale}</span>
        )}
      </div>

      {/* ── Barra progresso ─────────────────────────────── */}
      <div
        className="wiz-progress"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Compilazione: passo ${currentStep + 1} di ${totalSteps}`}
      >
        <div
          className="wiz-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

