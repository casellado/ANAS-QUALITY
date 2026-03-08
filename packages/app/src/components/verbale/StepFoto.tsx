import { useState, useCallback, useMemo, useRef } from 'react'
import type { WizardStep } from '@verbali/shared'
import { Camera, Trash2, Plus } from 'lucide-react'

// ── Props ───────────────────────────────────────────────────
interface StepFotoProps {
  readonly config: WizardStep
  readonly value:  string   // JSON string[] di base64 data URLs
  readonly onChange: (value: string) => void
  readonly error?: string | undefined
}

const MAX_FOTO_DEFAULT = 3
const MAX_SIZE_MB      = 2

/**
 * StepFoto — permette di allegare fino a N foto (facoltativo).
 * Le foto vengono salvate come base64 data URL nel verbale.
 */
export function StepFoto({ config, value, onChange, error }: StepFotoProps) {
  const maxFoto = config.maxFoto ?? MAX_FOTO_DEFAULT
  const inputRef = useRef<HTMLInputElement>(null)
  const [loadingIdx, setLoadingIdx] = useState(-1)

  const foto = useMemo<string[]>(() => {
    try { return JSON.parse(value || '[]') as string[] }
    catch { return [] }
  }, [value])

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validazione dimensione
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      // Ignora — troppo grande
      return
    }

    setLoadingIdx(foto.length)
    try {
      const dataUrl = await fileToBase64(file)
      const nuoveFoto = [...foto, dataUrl]
      onChange(JSON.stringify(nuoveFoto))
    } finally {
      setLoadingIdx(-1)
      // Reset input per permettere re-selezione
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [foto, onChange])

  const handleRemove = useCallback((idx: number) => {
    const nuoveFoto = foto.filter((_, i) => i !== idx)
    onChange(JSON.stringify(nuoveFoto))
  }, [foto, onChange])

  const handleAdd = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const canAdd = foto.length < maxFoto

  return (
    <div className="flex flex-col gap-4" role="group" aria-label="Allegati fotografici">
      {/* Domanda */}
      <div>
        <p className="form-label">
          {config.domanda}
          {!config.obbligatorio && (
            <span className="text-brand-text3 text-xs ml-2">(facoltativo)</span>
          )}
        </p>
        <p className="form-hint mt-1">{config.hint}</p>
      </div>

      {/* Griglia foto */}
      <div className="grid grid-cols-3 gap-3">
        {foto.map((dataUrl, i) => (
          <div
            key={`foto-${i}`}
            className="relative aspect-square rounded-xl overflow-hidden border border-brand-line/30 bg-brand-bg2"
          >
            <img
              src={dataUrl}
              alt={`Foto allegata ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => handleRemove(i)}
              aria-label={`Rimuovi foto ${i + 1}`}
              className="absolute top-1 right-1 w-7 h-7 rounded-full bg-brand-red/80
                         flex items-center justify-center min-h-[28px]"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </button>
            <span
              className="absolute bottom-1 left-1 bg-black/60 text-white text-xs
                         px-1.5 py-0.5 rounded-md font-mono"
            >
              {i + 1}/{maxFoto}
            </span>
          </div>
        ))}

        {/* Slot aggiunta */}
        {canAdd && (
          <button
            onClick={handleAdd}
            aria-label={`Aggiungi foto (${foto.length} di ${maxFoto})`}
            className="aspect-square rounded-xl border-2 border-dashed border-brand-line/40
                       flex flex-col items-center justify-center gap-2
                       hover:border-brand-blue/50 transition-colors bg-brand-bg2/50 min-h-[44px]"
          >
            {loadingIdx >= 0 ? (
              <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6 text-brand-text3" aria-hidden="true" />
                <span className="text-xs text-brand-text3">
                  <Camera className="w-3 h-3 inline mr-1" aria-hidden="true" />
                  Foto
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Contatore */}
      <p className="text-xs text-brand-text3 text-center" role="status" aria-live="polite">
        {foto.length} di {maxFoto} foto allegate
        {!config.obbligatorio && foto.length === 0 && ' — puoi proseguire senza foto'}
      </p>

      {/* Input file nascosto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}

/** Converte un File in base64 data URL, ridimensionando se necessario */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Ridimensiona se > 1200px su un lato
        const maxDim = 1200
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height)
          width  = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width  = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas non supportato')); return }
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

