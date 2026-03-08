import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Verbale } from '@verbali/shared'
import { formatDataIT, generaNomePdf } from '@verbali/shared'
import { getModule } from '@/config/moduleRegistry'
import { db } from '@/db/schema'
import { generaPdf, scaricaPdf, apriPdf } from '@/services/PdfService'
import { useToast } from '@/components/ui/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import {
  FolderOpen, Download, Eye, ChevronLeft, FileText, Calendar, User,
} from 'lucide-react'

/**
 * ArchivioVerbaliPage — browser dell'archivio verbali per un materiale.
 *
 * Route: /cantiere/:cantiereId/:materiale/archivio
 *
 * Funzionalità:
 * - Lista tutti i verbali completati del materiale (da Dexie)
 * - Rigenera il PDF on-demand dai dati archiviati
 * - Apre / scarica il PDF
 * - In produzione: link diretto a OneDrive
 */
export default function ArchivioVerbaliPage() {
  const { cantiereId, materiale } = useParams<{ cantiereId: string; materiale: string }>()
  const navigate = useNavigate()
  const toast    = useToast()
  const modulo   = getModule(materiale ?? '')

  const [verbali, setVerbali]       = useState<Verbale[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  // ── Carica verbali da Dexie ────────────────────────────────
  useEffect(() => {
    if (!cantiereId || !modulo) return
    const controller = new AbortController()

    const sigle = modulo.tipiVerbale.map(t => t.sigla)

    db.verbali
      .where({ id_cantiere: cantiereId })
      .filter((v: Verbale) => sigle.includes(v.tipo) && v.stato === 'completo')
      .reverse()
      .sortBy('progressivo')
      .then((rows: Verbale[]) => {
        if (!controller.signal.aborted) {
          // Ordine decrescente per progressivo
          setVerbali(rows.sort((a, b) => b.progressivo - a.progressivo))
        }
      })
      .catch(() => { /* errore Dexie — non bloccante */ })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [cantiereId, modulo])

  // ── Rigenera + apri PDF ───────────────────────────────────
  const handleApri = useCallback(async (verbale: Verbale) => {
    setGenerating(verbale.id)
    try {
      const blob = await generaPdf(verbale)
      apriPdf(blob)
    } catch (error) {
      toast.error(`Errore PDF: ${error instanceof Error ? error.message : 'Sconosciuto'}`)
    } finally {
      setGenerating(null)
    }
  }, [toast])

  // ── Rigenera + scarica PDF ────────────────────────────────
  const handleScarica = useCallback(async (verbale: Verbale) => {
    setGenerating(verbale.id)
    try {
      const blob = await generaPdf(verbale)
      const nome = generaNomePdf(verbale.codice)
      scaricaPdf(blob, nome)
      toast.success(`Scaricato: ${nome}`)
    } catch (error) {
      toast.error(`Errore PDF: ${error instanceof Error ? error.message : 'Sconosciuto'}`)
    } finally {
      setGenerating(null)
    }
  }, [toast])

  // ── Torna al sottomenu ────────────────────────────────────
  const handleBack = useCallback(() => {
    navigate(`/cantiere/${cantiereId}/${materiale}`)
  }, [cantiereId, materiale, navigate])

  // ── Guard clauses ─────────────────────────────────────────
  if (!cantiereId || !materiale) {
    return (
      <div className="content-area pt-4" role="alert">
        <p className="text-brand-red-l">Parametri URL mancanti</p>
      </div>
    )
  }

  if (!modulo) {
    return (
      <div className="card text-center py-12" role="alert">
        <p className="text-brand-red-l">Modulo &quot;{materiale}&quot; non trovato</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="btn-ghost min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Torna al sottomenu materiale"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <FolderOpen className="w-6 h-6 text-brand-blue" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-bold text-brand-text">Archivio {modulo.nome}</h1>
          <p className="text-sm text-brand-text2">
            Verbali completati e archiviati
          </p>
        </div>
      </div>

      {/* ── Statistiche rapide ─────────────────────────────── */}
      {!isLoading && (
        <div className="flex gap-3">
          <div className="card flex-1 text-center py-3">
            <p className="text-2xl font-black text-brand-blue tabular-nums">{verbali.length}</p>
            <p className="text-xs text-brand-text2">Verbali archiviati</p>
          </div>
          {verbali.length > 0 && (
            <div className="card flex-1 text-center py-3">
              <p className="text-2xl font-black text-brand-green tabular-nums">
                {String(verbali[0]?.progressivo ?? 0).padStart(3, '0')}
              </p>
              <p className="text-xs text-brand-text2">Ultimo progressivo</p>
            </div>
          )}
        </div>
      )}

      {/* ── Lista verbali ──────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner label="Caricamento archivio..." />
        </div>
      ) : verbali.length === 0 ? (
        <div className="card text-center py-12">
          <FolderOpen className="w-12 h-12 mx-auto text-brand-text3 mb-3" />
          <p className="text-brand-text2 text-sm">
            Nessun verbale ancora archiviato per {modulo.nome}
          </p>
          <button
            onClick={handleBack}
            className="btn-primary mt-4 min-h-[44px]"
            aria-label="Torna al sottomenu per creare un nuovo verbale"
          >
            Crea il primo verbale
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {verbali.map(v => {
            const isGen = generating === v.id
            return (
              <article
                key={v.id}
                className="card flex flex-col gap-3"
                aria-label={`Verbale ${v.codice}`}
              >
                {/* ── Riga superiore: codice + badge ─────── */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-brand-blue text-sm truncate">
                      {v.codice || `${v.tipo}-${String(v.progressivo).padStart(3, '0')}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-brand-text2">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" aria-hidden="true" />
                        {v.tipo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" aria-hidden="true" />
                        {formatDataIT(v.data)}
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-green text-xs whitespace-nowrap">
                    N° {String(v.progressivo).padStart(3, '0')}
                  </span>
                </div>

                {/* ── Dettagli ────────────────────────────── */}
                <div className="flex flex-col gap-1 text-xs text-brand-text2">
                  {v.opera && (
                    <p className="truncate">
                      <strong className="text-brand-text">Opera:</strong> {v.opera}
                    </p>
                  )}
                  {v.wbs && (
                    <p className="truncate font-mono">
                      <strong className="text-brand-text font-sans">WBS:</strong> {v.wbs}
                    </p>
                  )}
                  {v.ispettore && (
                    <p className="flex items-center gap-1">
                      <User className="w-3 h-3" aria-hidden="true" />
                      {v.ispettore}
                    </p>
                  )}
                </div>

                {/* ── Azioni ──────────────────────────────── */}
                <div className="flex gap-2 pt-1 border-t border-brand-line/30">
                  <button
                    onClick={() => handleApri(v)}
                    disabled={isGen}
                    className="btn-primary flex-1 min-h-[44px] text-sm flex items-center justify-center gap-2"
                    aria-label={`Apri PDF ${v.codice}`}
                    aria-busy={isGen}
                  >
                    {isGen ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    )}
                    {isGen ? 'Generazione…' : 'Apri PDF'}
                  </button>
                  <button
                    onClick={() => handleScarica(v)}
                    disabled={isGen}
                    className="btn-ghost min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`Scarica PDF ${v.codice}`}
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

    </div>
  )
}

