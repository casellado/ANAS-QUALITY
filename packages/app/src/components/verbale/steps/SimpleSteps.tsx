import { useCallback, useMemo } from 'react'
import type { WizardStep } from '@verbali/shared'
import { today } from '@verbali/shared'

// ── Props condivise per tutti gli step ──────────────────────
export interface StepProps {
  readonly config: WizardStep
  readonly value: string
  readonly onChange: (value: string) => void
  readonly error?: string | undefined
}

// ── Helper per a11y IDs ─────────────────────────────────────
function ids(key: string) {
  return {
    inputId:  `campo-${key}`,
    hintId:   `hint-${key}`,
    errorId:  `errore-${key}`,
  }
}

// ── StepText ────────────────────────────────────────────────
export function StepText({ config, value, onChange, error }: StepProps) {
  const { inputId, hintId, errorId } = ids(config.key)
  const remaining = config.max ? config.max - value.length : null

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="form-label">
        {config.domanda}
        {config.obbligatorio && <span className="text-brand-red-l" aria-label="campo obbligatorio"> *</span>}
      </label>
      <input
        id={inputId}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        maxLength={config.max}
        className={error ? 'input-field-error' : 'input-field'}
        aria-required={config.obbligatorio}
        aria-invalid={!!error}
        aria-describedby={`${hintId} ${errorId}`}
      />
      <div className="flex justify-between">
        <p id={hintId} className="form-hint">{config.hint}</p>
        {remaining !== null && (
          <span className="form-hint tabular-nums">{remaining}</span>
        )}
      </div>
      {error && <p id={errorId} role="alert" className="form-error">{error}</p>}
    </div>
  )
}

// ── StepTextarea ────────────────────────────────────────────
export function StepTextarea({ config, value, onChange, error }: StepProps) {
  const { inputId, hintId, errorId } = ids(config.key)
  const remaining = config.max ? config.max - value.length : null

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="form-label">
        {config.domanda}
        {config.obbligatorio && <span className="text-brand-red-l" aria-label="campo obbligatorio"> *</span>}
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        maxLength={config.max}
        className={`${error ? 'input-field-error' : 'textarea-field'} min-h-[120px]`}
        aria-required={config.obbligatorio}
        aria-invalid={!!error}
        aria-describedby={`${hintId} ${errorId}`}
      />
      <div className="flex justify-between">
        <p id={hintId} className="form-hint">{config.hint}</p>
        {remaining !== null && (
          <span className="form-hint tabular-nums">{remaining}</span>
        )}
      </div>
      {error && <p id={errorId} role="alert" className="form-error">{error}</p>}
    </div>
  )
}

// ── StepNumber ──────────────────────────────────────────────
export function StepNumber({ config, value, onChange, error }: StepProps) {
  const { inputId, hintId, errorId } = ids(config.key)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="form-label">
        {config.domanda}
        {config.obbligatorio && <span className="text-brand-red-l" aria-label="campo obbligatorio"> *</span>}
      </label>
      <input
        id={inputId}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        min={config.min}
        max={config.max}
        step={config.step ?? 1}
        className={error ? 'input-field-error' : 'input-field'}
        aria-required={config.obbligatorio}
        aria-invalid={!!error}
        aria-describedby={`${hintId} ${errorId}`}
      />
      <p id={hintId} className="form-hint">{config.hint}</p>
      {error && <p id={errorId} role="alert" className="form-error">{error}</p>}
    </div>
  )
}

// ── StepDate ────────────────────────────────────────────────
export function StepDate({ config, value, onChange, error }: StepProps) {
  const { inputId, hintId, errorId } = ids(config.key)
  const dateValue = value || today()

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="form-label">
        {config.domanda}
        {config.obbligatorio && <span className="text-brand-red-l" aria-label="campo obbligatorio"> *</span>}
      </label>
      <input
        id={inputId}
        type="date"
        value={dateValue}
        onChange={(e) => onChange(e.target.value)}
        className={error ? 'input-field-error' : 'input-field'}
        aria-required={config.obbligatorio}
        aria-invalid={!!error}
        aria-describedby={`${hintId} ${errorId}`}
      />
      <p id={hintId} className="form-hint">{config.hint}</p>
      {error && <p id={errorId} role="alert" className="form-error">{error}</p>}
    </div>
  )
}

// ── StepRadio ───────────────────────────────────────────────
export function StepRadio({ config, value, onChange, error }: StepProps) {
  const { hintId, errorId } = ids(config.key)

  const handleSelect = useCallback(
    (opzione: string) => onChange(opzione),
    [onChange]
  )

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={`${hintId} ${errorId}`}>
      <legend className="form-label mb-1">
        {config.domanda}
        {config.obbligatorio && <span className="text-brand-red-l" aria-label="campo obbligatorio"> *</span>}
      </legend>
      <p id={hintId} className="form-hint mb-2">{config.hint}</p>

      {config.opzioni?.map((opzione) => {
        const isSelected = value === opzione
        return (
          <button
            key={opzione}
            type="button"
            onClick={() => handleSelect(opzione)}
            className={`radio-row min-h-[44px] ${isSelected ? 'selected' : ''}`}
            role="radio"
            aria-checked={isSelected}
          >
            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
              ${isSelected ? 'border-brand-blue bg-brand-blue' : 'border-brand-line2'}`}
            >
              {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
            </span>
            <span className="text-sm text-brand-text">{opzione}</span>
          </button>
        )
      })}

      {error && <p id={errorId} role="alert" className="form-error">{error}</p>}
    </fieldset>
  )
}

// ── StepCheckbox ────────────────────────────────────────────
export function StepCheckbox({ config, value, onChange, error }: StepProps) {
  const { hintId, errorId } = ids(config.key)
  const selected = useMemo<string[]>(
    () => (value ? JSON.parse(value) : []),
    [value]
  )

  const handleToggle = useCallback(
    (opzione: string) => {
      const next = selected.includes(opzione)
        ? selected.filter(s => s !== opzione)
        : [...selected, opzione]
      onChange(JSON.stringify(next))
    },
    [selected, onChange]
  )

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={`${hintId} ${errorId}`}>
      <legend className="form-label mb-1">
        {config.domanda}
        {config.obbligatorio && <span className="text-brand-red-l" aria-label="campo obbligatorio"> *</span>}
      </legend>
      <p id={hintId} className="form-hint mb-2">{config.hint}</p>

      {config.opzioni?.map((opzione) => {
        const isChecked = selected.includes(opzione)
        return (
          <button
            key={opzione}
            type="button"
            onClick={() => handleToggle(opzione)}
            className={`radio-row min-h-[44px] ${isChecked ? 'selected' : ''}`}
            role="checkbox"
            aria-checked={isChecked}
          >
            <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0
              ${isChecked ? 'border-brand-blue bg-brand-blue' : 'border-brand-line2'}`}
            >
              {isChecked && <span className="text-white text-xs font-bold">✓</span>}
            </span>
            <span className="text-sm text-brand-text">{opzione}</span>
          </button>
        )
      })}

      {error && <p id={errorId} role="alert" className="form-error">{error}</p>}
    </fieldset>
  )
}

