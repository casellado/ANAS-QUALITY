import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import type { StepProps } from '@/components/verbale/steps/SimpleSteps'
import { autocompleteMemory } from '@/services/AutocompleteMemoryService'

/**
 * StepTextMemoria — Input testo con suggerimenti dalle compilazioni precedenti.
 * Mostra un dropdown con valori salvati in Dexie per il campo/cantiere corrente.
 */
export function StepTextMemoria({ config, value, onChange, error }: StepProps) {
  const [suggerimenti, setSuggerimenti] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef  = useRef<HTMLInputElement>(null)
  const listRef   = useRef<HTMLUListElement>(null)

  const inputId = `campo-${config.key}`
  const hintId  = `hint-${config.key}`
  const errorId = `errore-${config.key}`
  const listId  = `list-${config.key}`

  const remaining = config.max ? config.max - value.length : null

  // Recupera idCantiere dal contesto (lo leggiamo dal DOM path o dal localStorage)
  const idCantiere = useMemo(() => {
    try {
      const raw = localStorage.getItem('anas_cantiere_selezionato')
      return raw ? (JSON.parse(raw) as { id: string }).id : 'default'
    } catch { return 'default' }
  }, [])

  // Carica suggerimenti da Dexie
  useEffect(() => {
    let cancelled = false
    autocompleteMemory.getSuggerimenti(idCantiere, config.key).then(vals => {
      if (!cancelled) setSuggerimenti(vals)
    })
    return () => { cancelled = true }
  }, [idCantiere, config.key])

  // Filtra suggerimenti in base al valore corrente
  const filtrati = useMemo(() => {
    if (!value.trim()) return suggerimenti.slice(0, 8)
    const lower = value.toLowerCase()
    return suggerimenti.filter(s => s.toLowerCase().includes(lower)).slice(0, 8)
  }, [suggerimenti, value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setShowDropdown(true)
    setActiveIdx(-1)
  }, [onChange])

  const handleSelect = useCallback((val: string) => {
    onChange(val)
    setShowDropdown(false)
    setActiveIdx(-1)
    inputRef.current?.focus()
  }, [onChange])

  const handleBlur = useCallback(() => {
    // Salva il valore nella memoria quando l'utente esce dal campo
    if (value.trim()) {
      autocompleteMemory.salvaValore(idCantiere, config.key, value.trim())
    }
    // Delay per permettere click sul dropdown
    setTimeout(() => setShowDropdown(false), 200)
  }, [value, idCantiere, config.key])

  const handleFocus = useCallback(() => {
    setShowDropdown(true)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown || filtrati.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(prev => (prev + 1) % filtrati.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(prev => (prev <= 0 ? filtrati.length - 1 : prev - 1))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      const selected = filtrati[activeIdx]
      if (selected) handleSelect(selected)
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }, [showDropdown, filtrati, activeIdx, handleSelect])

  const hasDropdown = showDropdown && filtrati.length > 0

  return (
    <div className="flex flex-col gap-1.5 relative">
      <label htmlFor={inputId} className="form-label">
        {config.domanda}
        {config.obbligatorio && <span className="text-brand-red-l" aria-label="campo obbligatorio"> *</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={config.placeholder}
          maxLength={config.max}
          className={error ? 'input-field-error' : 'input-field'}
          aria-required={config.obbligatorio}
          aria-invalid={!!error}
          aria-describedby={`${hintId} ${errorId}`}
          aria-autocomplete="list"
          aria-expanded={hasDropdown}
          aria-controls={hasDropdown ? listId : undefined}
          aria-activedescendant={activeIdx >= 0 ? `${listId}-${activeIdx}` : undefined}
          role="combobox"
          autoComplete="off"
        />

        {/* ── Dropdown suggerimenti ───────────────────────── */}
        {hasDropdown && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={`Suggerimenti per ${config.domanda}`}
            className="absolute left-0 right-0 top-full mt-1 z-50
                       bg-brand-card border border-brand-line rounded-xl
                       shadow-card max-h-48 overflow-y-auto"
          >
            {filtrati.map((s, i) => (
              <li
                key={s}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={() => handleSelect(s)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors min-h-[40px]
                  ${i === activeIdx
                    ? 'bg-brand-blue/20 text-brand-text'
                    : 'text-brand-text2 hover:bg-brand-line/20'}`}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex justify-between">
        <p id={hintId} className="form-hint">
          {suggerimenti.length > 0
            ? `${config.hint} · ${suggerimenti.length} valore/i in memoria`
            : config.hint}
        </p>
        {remaining !== null && (
          <span className="form-hint tabular-nums">{remaining}</span>
        )}
      </div>
      {error && <p id={errorId} role="alert" className="form-error">{error}</p>}
    </div>
  )
}

