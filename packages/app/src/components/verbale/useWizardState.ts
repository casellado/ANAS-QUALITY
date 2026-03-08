import { useState, useCallback, useEffect } from 'react'
import type { Verbale, TipoVerbale } from '@verbali/shared'
import { VERBALE_SLOT_DEFAULT, now, today } from '@verbali/shared'
import { db } from '@/db/schema'

// ── Stato iniziale verbale ──────────────────────────────────
function creaVerbaleIniziale(sigla: string, idCantiere: string): Partial<Verbale> {
  return {
    id_cantiere: idCantiere,
    id: crypto.randomUUID(),
    tipo: sigla,
    codice: '',
    progressivo: 0,
    cantiere: '',
    opera: '',
    wbs: '',
    data: today(),
    ispettore: '',
    ispettore_email: '',
    ...VERBALE_SLOT_DEFAULT,
    ddt_numero: '',
    ddt_data: '',
    targa_autobetoniera: '',
    parte_opera: '',
    componente_opera: '',
    vag_collegato: null,
    vpc_collegati: [],
    prelievi: [],
    firma_data_url: '',
    firma_timestamp: '',
    slump_foto_path: null,
    cubetti_foto_path: null,
    pdf_path: null,
    certificato_path: null,
    numero_certificato: null,
    stato: 'bozza',
    created_at: now(),
    updated_at: now(),
    synced_at: null,
    sync_pending: true,
    storia: [],
  }
}

// ── Hook: gestione stato wizard ─────────────────────────────
export function useWizardState(tipoVerbale: TipoVerbale, idCantiere: string) {
  const [currentStep, setCurrentStep] = useState(0)
  const [verbale, setVerbale] = useState<Partial<Verbale>>(
    () => creaVerbaleIniziale(tipoVerbale.sigla, idCantiere)
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const steps = tipoVerbale.steps
  const totalSteps = steps.length

  // ── Aggiorna campo ────────────────────────────────────────
  const handleFieldChange = useCallback((key: string, value: string) => {
    setVerbale(prev => ({ ...prev, [key]: value, updated_at: now() }))
    setErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  // ── Valida step corrente ──────────────────────────────────
  const validaStep = useCallback((): boolean => {
    const step = steps[currentStep]
    if (!step) return true
    if (!step.obbligatorio) return true

    const value = String(verbale[step.key as keyof Verbale] ?? '')

    // Validazione firme: tutti i ruoli devono aver firmato
    if (step.tipo === 'firme') {
      try {
        const firme = JSON.parse(value || '{}') as Record<string, string>
        const ruoli = step.opzioni ?? []
        const toKey = (s: string) => s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
        const tuttiOk = ruoli.every(r => !!firme[toKey(r)])
        if (!tuttiOk) {
          setErrors(prev => ({ ...prev, [step.key]: 'Tutte le firme sono obbligatorie' }))
          return false
        }
        return true
      } catch {
        setErrors(prev => ({ ...prev, [step.key]: 'Firme non valide' }))
        return false
      }
    }

    // Validazione checkbox: almeno una selezione
    if (step.tipo === 'checkbox') {
      try {
        const arr = JSON.parse(value || '[]') as string[]
        if (arr.length === 0) {
          setErrors(prev => ({ ...prev, [step.key]: 'Seleziona almeno una opzione' }))
          return false
        }
        return true
      } catch {
        if (!value.trim()) {
          setErrors(prev => ({ ...prev, [step.key]: 'Seleziona almeno una opzione' }))
          return false
        }
      }
    }

    if (!value.trim()) {
      setErrors(prev => ({ ...prev, [step.key]: 'Campo obbligatorio' }))
      return false
    }

    // Validazione range per tipo number
    if (step.tipo === 'number' && value) {
      const num = parseFloat(value)
      if (step.min !== undefined && num < step.min) {
        setErrors(prev => ({ ...prev, [step.key]: `Minimo: ${step.min}` }))
        return false
      }
      if (step.max !== undefined && num > step.max) {
        setErrors(prev => ({ ...prev, [step.key]: `Massimo: ${step.max}` }))
        return false
      }
    }

    return true
  }, [steps, currentStep, verbale])

  // ── Salva bozza in Dexie (offline-safe) ───────────────────
  const salvaBozza = useCallback(async () => {
    try {
      await db.verbali.put({ ...verbale, updated_at: now() } as Verbale)
    } catch {
      // Silenzioso — errore Dexie non blocca il wizard
    }
  }, [verbale])

  // ── Avanza ────────────────────────────────────────────────
  const avanza = useCallback(async (): Promise<boolean> => {
    if (!validaStep()) return false
    await salvaBozza()
    if (currentStep < totalSteps - 1) {
      setCurrentStep(s => s + 1)
    }
    return true
  }, [validaStep, salvaBozza, currentStep, totalSteps])

  // ── Indietro ──────────────────────────────────────────────
  const indietro = useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }, [currentStep])

  // ── Autofill campi con valori dal sistema ─────────────────
  useEffect(() => {
    const step = steps[currentStep]
    if (!step?.autofill) return

    // Solo se il campo è ancora vuoto
    const currentVal = String(verbale[step.key as keyof Verbale] ?? '')
    if (currentVal.trim()) return

    if (step.autofill === 'data' && !currentVal) {
      handleFieldChange(step.key, today())
    } else if (step.autofill === 'dl_nome') {
      // Legge il profilo utente da localStorage
      try {
        const raw = localStorage.getItem('anas_user_profile')
        if (raw) {
          const profilo = JSON.parse(raw) as { nome?: string; cognome?: string; qualifica?: string }
          const nome = [profilo.qualifica, profilo.nome, profilo.cognome].filter(Boolean).join(' ')
          if (nome) handleFieldChange(step.key, nome)
        }
      } catch { /* profilo non disponibile */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  // ── Step corrente ─────────────────────────────────────────
  const stepCorrente = steps[currentStep]
  const isFirstStep  = currentStep === 0
  const isLastStep   = currentStep === totalSteps - 1
  const stepValue    = stepCorrente
    ? String(verbale[stepCorrente.key as keyof Verbale] ?? '')
    : ''
  const stepError    = stepCorrente ? errors[stepCorrente.key] : undefined

  return {
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
    validaStep,
    salvaBozza,
  }
}

