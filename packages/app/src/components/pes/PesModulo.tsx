import { useState, useCallback, useMemo } from 'react'
import type { CategoriaProva } from '@verbali/shared'
import { usePes } from '@/hooks/usePes'
import { useToast } from '@/components/ui/ToastContext'
import { Spinner } from '@/components/ui/Spinner'
import { PesFiltri, type FiltroStato } from './PesFiltri'
import { ProvaCard } from './ProvaCard'
import { PesForm, type PesFormData } from './PesForm'

interface PesModuloProps {
  readonly idCantiere: string
  readonly ruolo:      'coordinatore' | 'ispettore'
  readonly utenteEmail: string
}

export function PesModulo({ idCantiere, ruolo, utenteEmail }: PesModuloProps) {
  const { prove, memoria, isLoading, creaProva, prendiInCarico, completaProva } = usePes(idCantiere)
  const toast = useToast()
  const isCoord = ruolo === 'coordinatore'

  // ── View state ─────────────────────────────────────────────
  const [view, setView] = useState<'lista' | 'nuova'>('lista')

  // ── Filtri ─────────────────────────────────────────────────
  const [filtroStato, setFiltroStato]       = useState<FiltroStato>('tutti')
  const [filtroData, setFiltroData]         = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const proveFiltrate = useMemo(() => prove.filter(p => {
    if (filtroStato !== 'tutti' && p.stato !== filtroStato) return false
    if (filtroData && p.data !== filtroData) return false
    if (filtroCategoria && p.categoria !== filtroCategoria) return false
    return true
  }), [prove, filtroStato, filtroData, filtroCategoria])

  // ── Handler ────────────────────────────────────────────────
  const handleSalva = useCallback(async (dati: PesFormData) => {
    try {
      await creaProva({
        lotto:       dati.lotto,
        data:        dati.data,
        ora:         dati.ora,
        wbs:         dati.wbs,
        sezione:     dati.sezione,
        pk:          dati.pk,
        laboratorio: dati.laboratorio,
        categoria:   dati.categoria as CategoriaProva,
        tipo_prova:  dati.tipo_prova,
        note:        dati.note,
        created_by:  dati.created_by,
      })
      toast.success('Prova creata con successo!')
      setView('lista')
    } catch (err) {
      toast.error(`Errore: ${err instanceof Error ? err.message : 'Sconosciuto'}`)
    }
  }, [creaProva, toast])

  const handlePrendiInCarico = useCallback(async (provaId: string) => {
    try {
      await prendiInCarico(provaId)
      toast.success('Prova presa in carico!')
    } catch (err) {
      toast.error(`Errore: ${err instanceof Error ? err.message : 'Sconosciuto'}`)
    }
  }, [prendiInCarico, toast])

  const handleCompleta = useCallback(async (provaId: string) => {
    try {
      await completaProva(provaId, 'Eseguita regolarmente')
      toast.success('Prova completata!')
    } catch (err) {
      toast.error(`Errore: ${err instanceof Error ? err.message : 'Sconosciuto'}`)
    }
  }, [completaProva, toast])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header PES */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-amber/20 flex items-center justify-center text-xl"
               aria-hidden="true">📋</div>
          <div>
            <h2 className="font-bold text-brand-text text-lg leading-none">ANAS PES</h2>
            <p className="text-xs text-brand-text2 mt-0.5">Piano Esecutivo Prove</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-gray text-xs">
            {proveFiltrate.length} prov{proveFiltrate.length !== 1 ? 'e' : 'a'}
          </span>
          {isCoord && (
            <button
              onClick={() => setView(v => v === 'nuova' ? 'lista' : 'nuova')}
              aria-label={view === 'nuova' ? 'Torna alla lista prove' : 'Aggiungi nuova prova'}
              className={`px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px] transition-all duration-150
                ${view === 'nuova'
                  ? 'btn-ghost'
                  : 'bg-brand-amber text-brand-bg hover:bg-brand-amber-l'}`}
            >
              {view === 'nuova' ? '← Lista' : '+ Nuova prova'}
            </button>
          )}
        </div>
      </div>

      {/* View nuova */}
      {view === 'nuova' && isCoord ? (
        <PesForm
          idCantiere={idCantiere}
          memoria={memoria}
          onSalva={handleSalva}
          onAnnulla={() => setView('lista')}
        />
      ) : (
        /* View lista */
        <div className="flex flex-col gap-3">
          <PesFiltri
            filtroStato={filtroStato} setFiltroStato={setFiltroStato}
            filtroData={filtroData} setFiltroData={setFiltroData}
            filtroCategoria={filtroCategoria} setFiltroCategoria={setFiltroCategoria}
          />

          {isLoading ? (
            <div className="flex justify-center py-12" role="status">
              <Spinner className="w-6 h-6" label="Caricamento prove..." />
            </div>
          ) : proveFiltrate.length === 0 ? (
            <div className="text-center py-12 text-brand-text3 text-sm">
              Nessuna prova trovata
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[420px] pr-1">
              {proveFiltrate.map(p => (
                <ProvaCard
                  key={p.id}
                  prova={p}
                  ruolo={ruolo}
                  utenteEmail={utenteEmail}
                  onPrendiInCarico={() => handlePrendiInCarico(p.id)}
                  onCompleta={() => handleCompleta(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

