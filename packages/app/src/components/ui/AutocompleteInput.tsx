import { useState, useEffect, useRef, useCallback, useId } from 'react'

interface AutocompleteInputProps {
  readonly label:         string
  readonly value:         string
  readonly onChange:       (value: string) => void
  readonly suggestions?:  string[]
  readonly placeholder?:  string
  readonly required?:     boolean
  readonly error?:        string
  readonly hint?:         string
  readonly className?:    string
  readonly type?:         string
}

const MAX_VISIBLE = 6

export function AutocompleteInput({
  label, value, onChange, suggestions = [], placeholder = '',
  required, error, hint, className = '', type = 'text',
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen]       = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef      = useRef<HTMLUListElement>(null)
  const uid          = useId()
  const inputId      = `ac-input-${uid}`
  const listId       = `ac-list-${uid}`
  const errorId      = `ac-err-${uid}`
  const hintId       = `ac-hint-${uid}`

  // Filtra case-insensitive, escludi valore corrente
  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(value.toLowerCase()) && s !== value
  )

  // Chiudi dropdown su click esterno
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Reset indice attivo quando filtri cambiano
  useEffect(() => { setActiveIdx(-1) }, [value])

  const handleSelect = useCallback((val: string) => {
    onChange(val)
    setIsOpen(false)
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || filtered.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(prev => (prev + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(prev => (prev <= 0 ? filtered.length - 1 : prev - 1))
    } else if (e.key === 'Enter' && activeIdx >= 0 && filtered[activeIdx]) {
      e.preventDefault()
      handleSelect(filtered[activeIdx])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }, [isOpen, filtered, activeIdx, handleSelect])

  // Scroll item attivo in vista
  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const item = listRef.current.children[activeIdx] as HTMLElement | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIdx])

  const describedBy = [hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label htmlFor={inputId}
        className="block text-xs font-semibold text-brand-text2 uppercase tracking-wider mb-1.5">
        {label}
        {required && <span className="text-brand-amber-l ml-1" aria-label="campo obbligatorio">*</span>}
      </label>

      <input
        id={inputId}
        type={type}
        value={value}
        onChange={e => { onChange(e.target.value); setIsOpen(true) }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={label}
        aria-required={required}
        aria-autocomplete="list"
        aria-expanded={isOpen && filtered.length > 0}
        aria-controls={listId}
        aria-activedescendant={activeIdx >= 0 ? `${listId}-opt-${activeIdx}` : undefined}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className={error ? 'input-field-error' : 'input-field'}
        role="combobox"
      />

      {/* Dropdown suggerimenti */}
      {isOpen && filtered.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={`Suggerimenti per ${label}`}
          className="absolute z-50 w-full mt-1 bg-brand-card border border-brand-line2
                     rounded-xl shadow-card-l overflow-hidden overflow-y-auto"
          style={{ maxHeight: `${MAX_VISIBLE * 2.75}rem` }}
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === activeIdx}
              onClick={() => handleSelect(s)}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
                border-b border-brand-line last:border-0
                ${i === activeIdx
                  ? 'bg-brand-amber/10 text-brand-amber-l'
                  : 'text-brand-text hover:bg-brand-card2 hover:text-brand-text'}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      {hint && !error && (
        <p id={hintId} className="form-hint">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="form-error">{error}</p>
      )}
    </div>
  )
}

