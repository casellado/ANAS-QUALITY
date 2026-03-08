import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Verbale } from '@verbali/shared'
import { getTipoVerbale } from '@/config/moduleRegistry'
import { useToast } from '@/components/ui/ToastContext'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { VerbaleWizard } from '@/components/verbale/VerbaleWizard'

export default function VerbaleNewPage() {
  const { cantiereId, materiale, sigla } = useParams<{
    cantiereId: string
    materiale: string
    sigla: string
  }>()
  const navigate = useNavigate()
  const toast    = useToast()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Cerca tipo verbale nel registry — PRIMA degli early return
  const tipoVerbale = useMemo(
    () => (sigla ? getTipoVerbale(sigla) : undefined),
    [sigla]
  )

  // ── Completamento wizard ──────────────────────────────────
  const handleComplete = useCallback(
    (_verbale: Verbale) => {
      toast.success(`${tipoVerbale?.nome ?? 'Verbale'} compilato con successo!`)
      navigate(`/cantiere/${cantiereId}/${materiale}`)
    },
    [cantiereId, materiale, tipoVerbale?.nome, navigate, toast]
  )

  // ── Annullamento con conferma ─────────────────────────────
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

  // ── Guard clauses — DOPO tutti gli hooks ──────────────────
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

  return (
    <div className="content-area pt-4">
      {/* ── Titolo ──────────────────────────────────────── */}
      <header className="mb-6">
        <h1 className="text-xl font-bold text-brand-text">
          {tipoVerbale.icona} {tipoVerbale.nome}
        </h1>
        {tipoVerbale.normativa && (
          <p className="text-xs text-brand-text3 mt-1 font-mono">{tipoVerbale.normativa}</p>
        )}
      </header>

      {/* ── Wizard ──────────────────────────────────────── */}
      <VerbaleWizard
        sigla={sigla}
        idCantiere={cantiereId}
        tipoVerbale={tipoVerbale}
        onComplete={handleComplete}
        onCancel={handleCancelRequest}
      />

      {/* ── Dialog conferma annullamento ────────────────── */}
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
