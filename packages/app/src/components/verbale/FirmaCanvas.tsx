import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'

// ── Props ───────────────────────────────────────────────────
interface FirmaCanvasProps {
  readonly onFirma: (dataUrl: string) => void
  readonly onReset: () => void
  readonly disabled?: boolean
}

const STROKE_COLOR = '#3B8EF0'
const BG_COLOR     = '#0C1524'
const LINE_WIDTH   = 2.5

/** Restituisce coordinate unificate per touch e mouse */
function getPos(
  e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect  = canvas.getBoundingClientRect()
  const ratio = canvas.width / rect.width

  if ('touches' in e) {
    const touch = e.touches[0] ?? e.changedTouches[0]
    if (touch) {
      return { x: (touch.clientX - rect.left) * ratio, y: (touch.clientY - rect.top) * ratio }
    }
  }

  const mouseEvt = e as React.MouseEvent<HTMLCanvasElement>
  return { x: (mouseEvt.clientX - rect.left) * ratio, y: (mouseEvt.clientY - rect.top) * ratio }
}

export function FirmaCanvas({ onFirma, onReset, disabled = false }: FirmaCanvasProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const isDrawing  = useRef(false)
  const [hasStrokes, setHasStrokes] = useState(false)

  // ── Setup canvas DPI-safe ─────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr  = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width  = rect.width  * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = STROKE_COLOR
    ctx.lineWidth   = LINE_WIDTH
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    // No cleanup needed — canvas is self-contained
  }, [])

  // ── Start stroke ──────────────────────────────────────────
  const handleStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
      if (disabled) return
      const canvas = canvasRef.current
      if (!canvas) return

      isDrawing.current = true
      const { x, y } = getPos(e, canvas)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.beginPath()
      ctx.moveTo(x / (window.devicePixelRatio || 1), y / (window.devicePixelRatio || 1))
    },
    [disabled]
  )

  // ── Move stroke ───────────────────────────────────────────
  const handleMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current || disabled) return
      const canvas = canvasRef.current
      if (!canvas) return

      const { x, y } = getPos(e, canvas)
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.lineTo(x / (window.devicePixelRatio || 1), y / (window.devicePixelRatio || 1))
      ctx.stroke()
    },
    [disabled]
  )

  // ── End stroke → salva base64 ─────────────────────────────
  const handleEnd = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false
    setHasStrokes(true)

    const canvas = canvasRef.current
    if (!canvas) return

    onFirma(canvas.toDataURL('image/png'))
  }, [onFirma])

  // ── Reset ─────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = STROKE_COLOR
    ctx.lineWidth   = LINE_WIDTH
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    setHasStrokes(false)
    onReset()
  }, [onReset])

  return (
    <div role="group" aria-label="Area firma digitale" className="flex flex-col gap-3">
      <p id="firma-istr" className="text-sm text-brand-text2">
        Firma con il dito o stilo nell&apos;area sottostante
      </p>

      <div className="firma-container">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Area firma digitale"
          aria-describedby="firma-istr"
          className="firma-canvas w-full"
          style={{ height: '200px' }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>

      <button
        onClick={handleReset}
        disabled={disabled || !hasStrokes}
        className="btn-ghost min-h-[44px] flex items-center justify-center gap-2 self-end"
        aria-label="Cancella la firma e ricomincia"
      >
        <Eraser className="w-4 h-4" aria-hidden="true" />
        Cancella firma
      </button>
    </div>
  )
}

