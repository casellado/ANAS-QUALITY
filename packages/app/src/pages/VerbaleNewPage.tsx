import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Verbale } from '@verbali/shared'
import { generaNomePdf } from '@verbali/shared'
import { getTipoVerbale } from '@/config/moduleRegistry'
import { useToast } from '@/components/ui/ToastContext'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { VerbaleWizard } from '@/components/verbale/VerbaleWizard'
import { generaPdf, scaricaPdf, apriPdf } from '@/services/PdfService'
import { archiviaVerbale } from '@/services/ArchivioService'

export default function VerbaleNewPage() {
  const { cantiereId, materiale, sigla } = useParams<{
    cantiereId: string
    materiale: string
    sigla: string
  }>()
  const navigate = useNavigate()
  const toast    = useToast()

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pdfBlob, setPdfBlob]     = useState<Blob | null>(null)
  const [pdfNome, setPdfNome]     = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // Cerca tipo verbale nel registry
  const tipoVerbale = useMemo(
    () => (sigla ? getTipoVerbale(sigla) : undefined),
    [sigla],
  )

  // ── Completamento wizard → genera PDF + archivia ────────
  const handleComplete = useCallback(
    async (verbale: Verbale) => {
      setIsGenerating(true)
      try {
        // 1. Genera PDF
        const blob = await generaPdf(verbale)
        const nome = generaNomePdf(verbale.codice)

        // 2. Archivia: Dexie (immediato) + OneDrive (se online, in prod)
        const categoria = materiale ?? 'Calcestruzzo'
        await archiviaVerbale(verbale, blob, nome, categoria)

        // 3. Aggiorna UI
        setPdfBlob(blob)
        setPdfNome(nome)
        toast.success(`${tipoVerbale?.nome ?? 'Verbale'} completato e archiviato — PDF pronto!`)
      } catch (error) {
        toast.error(`Errore: ${error instanceof Error ? error.message : 'Sconosciuto'}`)
      } finally {
        setIsGenerating(false)
      }
    },
    [materiale, tipoVerbale?.nome, toast],
  )

  // ── Annullamento con conferma ───────────────────────────
  const handleCancelRequest = useCallback(() => {
    setIsConfirmOpen(true)
  }, [])

  const handleCancelConfirm = useCallback(() => {
    setIsConfirmOpen(false)
    navigate(-1)
  }, [navigate])

  const handleCancelDismiss = useCallback(() => {
    setIsConfirmOpen(false)
  }, [])

  // ── Azioni PDF ──────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!pdfBlob || !pdfNome) return
    scaricaPdf(pdfBlob, pdfNome)
    toast.success('PDF scaricato!')
  }, [pdfBlob, pdfNome, toast])

  const handlePreview = useCallback(() => {
    if (!pdfBlob) return
    apriPdf(pdfBlob)
  }, [pdfBlob])

  const handleNuovoVerbale = useCallback(() => {
    setPdfBlob(null)
    setPdfNome('')
  }, [])

  const handleTornaSubmenu = useCallback(() => {
    navigate(`/cantiere/${cantiereId}/${materiale}`)
  }, [cantiereId, materiale, navigate])

  // ── Guard clauses ───────────────────────────────────────
  if (!cantiereId || !materiale || !sigla) {
    return (
      <div className="content-area pt-4" role="alert">
        <p className="text-brand-red-l">Parametri mancanti nella URL</p>
      </div>
    )
  }

  if (!tipoVerbale) {
    toast.warning(`Tipo verbale "${sigla}" non trovato nel registry`)
    navigate(`/cantiere/${cantiereId}/${materiale}`, { replace: true })
    return null
  }

  // ── Schermata PDF completato ────────────────────────────
  if (pdfBlob) {
    return (
      <div className="content-area pt-4 flex flex-col items-center gap-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-brand-green/20 flex items-center justify-center text-4xl border-2 border-brand-green/40">
          ✅
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-brand-text">Verbale completato</h2>
          <p className="text-brand-text2 text-sm mt-1">
            PDF: <span className="font-mono text-brand-blue-l">{pdfNome}</span>
          </p>
        </div>

        <div className="w-full max-w-md flex flex-col gap-3">
          <button
            onClick={handlePreview}
            aria-label="Apri anteprima PDF"
            className="btn-primary min-h-[48px] w-full text-sm flex items-center justify-center gap-2"
          >
            👁 Anteprima PDF
          </button>
          <button
            onClick={handleDownload}
            aria-label="Scarica PDF firmato"
            className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-bold rounded-xl py-3.5 min-h-[48px] transition-all text-sm"
          >
            ⬇ Scarica PDF firmato
          </button>
          <button
            onClick={handleNuovoVerbale}
            aria-label="Crea un nuovo verbale"
            className="btn-ghost min-h-[44px] w-full text-sm"
          >
            + Nuovo verbale {sigla}
          </button>
          <button
            onClick={handleTornaSubmenu}
            aria-label="Torna al sottomenu materiale"
            className="btn-ghost min-h-[44px] w-full text-sm text-brand-text3"
          >
            ← Torna al sottomenu
          </button>
        </div>
      </div>
    )
  }

  // ── Wizard attivo ───────────────────────────────────────
  return (
    <div className="content-area pt-4">
      <header className="mb-6">
        <h1 className="text-xl font-bold text-brand-text">
          {tipoVerbale.icona} {tipoVerbale.nome}
        </h1>
        {tipoVerbale.normativa && (
          <p className="text-xs text-brand-text3 mt-1 font-mono">
            {tipoVerbale.normativa}
          </p>
        )}
      </header>

      {isGenerating ? (
        <div className="card flex flex-col items-center gap-4 py-12">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-brand-text2 text-sm">Generazione PDF in corso…</p>
        </div>
      ) : (
        <VerbaleWizard
          sigla={sigla}
          idCantiere={cantiereId}
          tipoVerbale={tipoVerbale}
          onComplete={handleComplete}
          onCancel={handleCancelRequest}
        />
      )}

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Abbandonare il verbale?"
        message="I dati non salvati andranno persi. La bozza locale rimarrà disponibile."
        variant="danger"
        confirmLabel="Abbandona"
        cancelLabel="Continua"
        onConfirm={handleCancelConfirm}
        onCancel={handleCancelDismiss}
      />
    </div>
  )
}
