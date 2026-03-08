import { useState, useCallback } from 'react'
import type { MemoriaPES, CategoriaProva } from '@verbali/shared'
import { AutocompleteInput } from '@/components/ui/AutocompleteInput'

const CATEGORIE: CategoriaProva[] = [
  'CALCESTRUZZO', 'ACCIAIO', 'TERRE', 'CONGLOMERATO BITUMINOSO',
]

interface PesFormData {
  lotto:       string
  data:        string
  ora:         string
  wbs:         string
  sezione:     string
  pk:          string
  laboratorio: string
  categoria:   string
  tipo_prova:  string
  note:        string
  created_by:  string
}

interface PesFormProps {
  readonly idCantiere: string
  readonly memoria:    MemoriaPES
  readonly onSalva:    (dati: PesFormData) => Promise<void>
  readonly onAnnulla:  () => void
}

const INIT: PesFormData = {
  lotto: '', data: '', ora: '', wbs: '', sezione: '', pk: '',
  laboratorio: '', categoria: '', tipo_prova: '', note: '', created_by: '',
}

export function PesForm({ memoria, onSalva, onAnnulla }: PesFormProps) {
  const [form, setForm]       = useState<PesFormData>({
    ...INIT,
    data: new Date().toISOString().slice(0, 10),
  })
  const [errors, setErrors]   = useState<Partial<Record<keyof PesFormData, string>>>({})
  const [isSaving, setIsSaving] = useState(false)

  const set = useCallback((k: keyof PesFormData) => (v: string) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }, [])

  const validate = useCallback((): boolean => {
    const e: Partial<Record<keyof PesFormData, string>> = {}
    if (!form.lotto.trim())      e.lotto = 'Obbligatorio'
    if (!form.data)              e.data = 'Obbligatorio'
    if (!form.ora)               e.ora = 'Obbligatorio'
    if (!form.categoria)         e.categoria = 'Obbligatorio'
    if (!form.tipo_prova.trim()) e.tipo_prova = 'Obbligatorio'
    setErrors(e)
    return Object.keys(e).length === 0
  }, [form])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return
    setIsSaving(true)
    try {
      await onSalva(form)
    } finally {
      setIsSaving(false)
    }
  }, [form, validate, onSalva])

  const tipoProveSugg = form.categoria
    ? (memoria.tipi_prova[form.categoria as CategoriaProva] ?? [])
    : []

  return (
    <div className="card flex flex-col gap-4 overflow-y-auto">
      <p className="section-title text-brand-amber-l">Nuova Prova</p>

      <div className="grid grid-cols-2 gap-4">
        {/* Lotto — col-span-2 */}
        <div className="col-span-2">
          <AutocompleteInput label="Lotto" value={form.lotto} onChange={set('lotto')}
            suggestions={memoria.lotti} placeholder="es. Lotto 1A - Tratto Nord"
            required {...(errors.lotto ? { error: errors.lotto } : {})} />
        </div>

        {/* Data */}
        <div>
          <label htmlFor="pes-data" className="form-label">
            Data <span className="text-brand-amber-l">*</span>
          </label>
          <input id="pes-data" type="date" value={form.data} onChange={e => set('data')(e.target.value)}
            aria-label="Data prova" aria-required="true"
            className={errors.data ? 'input-field-error' : 'input-field'} />
          {errors.data && <p role="alert" className="form-error">{errors.data}</p>}
        </div>

        {/* Ora */}
        <div>
          <label htmlFor="pes-ora" className="form-label">
            Ora <span className="text-brand-amber-l">*</span>
          </label>
          <input id="pes-ora" type="time" value={form.ora} onChange={e => set('ora')(e.target.value)}
            aria-label="Ora prova" aria-required="true"
            className={errors.ora ? 'input-field-error' : 'input-field'} />
          {errors.ora && <p role="alert" className="form-error">{errors.ora}</p>}
        </div>

        {/* WBS + PK */}
        <AutocompleteInput label="WBS" value={form.wbs} onChange={set('wbs')}
          suggestions={memoria.wbs} placeholder="es. WBS.SS.001.0010" />
        <AutocompleteInput label="PK (Progressiva)" value={form.pk} onChange={set('pk')}
          placeholder="es. 12+400" />

        {/* Sezione — col-span-2 */}
        <div className="col-span-2">
          <AutocompleteInput label="Sezione di Progetto" value={form.sezione} onChange={set('sezione')}
            suggestions={memoria.sezioni} placeholder="es. Sezione A - Km 12+400" />
        </div>

        {/* Laboratorio — col-span-2 */}
        <div className="col-span-2">
          <AutocompleteInput label="Laboratorio" value={form.laboratorio} onChange={set('laboratorio')}
            suggestions={memoria.laboratori} placeholder="es. Laboratorio Tecnotest Napoli" />
        </div>

        {/* Categoria — col-span-1 */}
        <div>
          <label htmlFor="pes-cat" className="form-label">
            Categoria <span className="text-brand-amber-l">*</span>
          </label>
          <select id="pes-cat" value={form.categoria}
            onChange={e => { set('categoria')(e.target.value); set('tipo_prova')('') }}
            aria-label="Categoria materiale" aria-required="true"
            className={errors.categoria ? 'input-field-error cursor-pointer' : 'select-field'}>
            <option value="">-- Seleziona --</option>
            {CATEGORIE.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {errors.categoria && <p role="alert" className="form-error">{errors.categoria}</p>}
        </div>

        {/* Tipo prova */}
        <AutocompleteInput label="Tipo di Prova" value={form.tipo_prova} onChange={set('tipo_prova')}
          suggestions={tipoProveSugg} placeholder="es. Prelievo cls fresco"
          required {...(errors.tipo_prova ? { error: errors.tipo_prova } : {})} />

        {/* Note — col-span-2 */}
        <div className="col-span-2">
          <label htmlFor="pes-note" className="form-label">Note</label>
          <textarea id="pes-note" value={form.note} onChange={e => set('note')(e.target.value)}
            rows={2} aria-label="Note aggiuntive" className="textarea-field"
            placeholder="Note aggiuntive..." />
        </div>
      </div>

      {/* Azioni */}
      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={isSaving}
          aria-label="Salva nuova prova nel PES" aria-busy={isSaving}
          className="btn-primary flex-1">
          {isSaving ? 'Salvataggio...' : '✓ Salva Prova nel PES'}
        </button>
        <button onClick={onAnnulla} className="btn-ghost" aria-label="Annulla creazione prova">
          Annulla
        </button>
      </div>
    </div>
  )
}

export type { PesFormData }

