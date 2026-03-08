import type { StepType, WizardStep } from '@verbali/shared'
import type { StepProps } from '@/components/verbale/steps/SimpleSteps'
import {
  StepText,
  StepTextarea,
  StepNumber,
  StepDate,
  StepRadio,
  StepCheckbox,
} from '@/components/verbale/steps/SimpleSteps'
import { StepTextMemoria } from '@/components/verbale/steps/StepTextMemoria'
import { StepFirme } from '@/components/verbale/StepFirme'
import { StepFoto } from '@/components/verbale/StepFoto'

// ── Placeholder per step complessi (moduli) ─────────────────
function StepPlaceholder({ config }: StepProps) {
  return (
    <div className="card flex flex-col items-center gap-3 py-8">
      <span className="text-3xl" aria-hidden="true">🔧</span>
      <p className="text-sm text-brand-text2 text-center">
        Componente <strong className="text-brand-text">{config.tipo}</strong> —
        da implementare con il modulo
      </p>
      <p className="form-hint text-center">{config.domanda}</p>
    </div>
  )
}

// ── Mappa completa StepType → Componente ────────────────────
const STEP_COMPONENTS: Record<StepType, React.ComponentType<StepProps>> = {
  text:     StepText,
  textarea: StepTextarea,
  number:   StepNumber,
  date:     StepDate,
  radio:    StepRadio,
  checkbox: StepCheckbox,
  foto:     StepFoto,
  firme:    StepFirme,
  // Step complessi → placeholder fino a implementazione modulo
  wbs:      StepPlaceholder,
  ddt:      StepPlaceholder,
  slump:    StepPlaceholder,
  cubetti:  StepPlaceholder,
  figura:   StepPlaceholder,
}

// ── Props del renderer ──────────────────────────────────────
interface WizardStepRendererProps {
  readonly config: WizardStep
  readonly value: string
  readonly onChange: (value: string) => void
  readonly error?: string | undefined
}

/**
 * Dispatcher generico che renderizza il componente corretto
 * in base al tipo dello step definito nel modulo.
 *
 * NON contiene logica specifica per tipo verbale — tutto dal registry.
 */
export function WizardStepRenderer({ config, value, onChange, error }: WizardStepRendererProps) {
  // Se il campo testo ha memoria → usa StepTextMemoria con autocomplete
  if (config.tipo === 'text' && config.memoria) {
    return <StepTextMemoria config={config} value={value} onChange={onChange} error={error} />
  }

  const Component = STEP_COMPONENTS[config.tipo]

  if (!Component) {
    return (
      <div role="alert" className="card border-brand-red-l">
        <p className="text-brand-red-l text-sm">
          Tipo step sconosciuto: <code className="font-mono">{config.tipo}</code>
        </p>
      </div>
    )
  }

  return <Component config={config} value={value} onChange={onChange} error={error} />
}

