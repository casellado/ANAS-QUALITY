import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getModule } from '@/config/moduleRegistry'
import { db } from '@/db/schema'
import type { Verbale, VerbaleIndex } from '@verbali/shared'
import { formatDataIT } from '@verbali/shared'
import { Spinner } from '@/components/ui/Spinner'

/**
 * SubmenuMaterialePage — schermata OBBLIGATORIA tra Dashboard e Wizard.
 *
 * Scopo:
 * 1. Mostra il progressivo prossimo → ispettore prepara etichette fisiche
 * 2. Mostra gli ultimi verbali del materiale → contesto di cantiere
 * 3. Lista i TipoVerbale del modulo per la selezione
 *
 * Route: /cantiere/:cantiereId/:materiale
 * MAI bypassare questa route — è il punto di accesso al wizard.
 */
export default function SubmenuMaterialePage() {
  const navigate                     = useNavigate()
  const { cantiereId, materiale }    = useParams<{ cantiereId: string; materiale: string }>()
  const modulo                       = getModule(materiale ?? '')
  const [ultimi, setUltimi]          = useState<VerbaleIndex[]>([])
  const [isLoading, setIsLoading]    = useState(true)

  useEffect(() => {
    if (!cantiereId || !materiale) return
    const controller = new AbortController()

    db.verbali
      .where({ id_cantiere: cantiereId })
      .filter((v: Verbale) => modulo?.tipiVerbale.some(t => t.sigla === v.tipo) ?? false)
      .reverse()
      .limit(5)
      .toArray()
      .then((rows: Verbale[]) => {
        if (!controller.signal.aborted) setUltimi(rows as VerbaleIndex[])
      })
      .catch(() => { /* errore lettura Dexie — non bloccante */ })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [cantiereId, materiale, modulo])

  if (!modulo) {
    return (
      <div className="card text-center py-12" role="alert">
        <p className="text-brand-red-l">Modulo "{materiale}" non trovato</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Intestazione modulo */}
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">{modulo.icona}</span>
        <div>
          <h1 className="text-xl font-bold text-brand-text">{modulo.nome}</h1>
          <p className="text-sm text-brand-text2">Scegli il tipo di verbale</p>
        </div>
      </div>

      {/* Tipi verbale del modulo */}
      <div className="flex flex-col gap-3">
        <p className="section-title">Nuovo verbale</p>
        {modulo.tipiVerbale.map(tipo => (
          <button
            key={tipo.sigla}
            onClick={() => navigate(`/cantiere/${cantiereId}/${materiale}/${tipo.sigla}/nuovo`)}
            className="card-hover flex items-center gap-4 p-4 text-left"
            aria-label={`Crea nuovo ${tipo.nome} — ${tipo.sigla}`}
          >
            <span className="text-2xl" aria-hidden="true">{tipo.icona}</span>
            <div className="flex-1">
              <p className="font-semibold text-brand-text text-sm">{tipo.nome}</p>
              <p className="text-xs text-brand-text2 mt-0.5">{tipo.descrizione}</p>
              {tipo.normativa && (
                <p className="text-xs text-brand-text3 mt-1 font-mono">{tipo.normativa}</p>
              )}
            </div>
            <span className="badge badge-blue font-mono">{tipo.sigla}</span>
          </button>
        ))}
      </div>

      {/* Ultimi verbali */}
      <div>
        <p className="section-title">Ultimi verbali</p>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner label="Caricamento verbali..." />
          </div>
        ) : ultimi.length === 0 ? (
          <p className="text-sm text-brand-text3 text-center py-6">
            Nessun verbale ancora compilato per questo materiale
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {ultimi.map(v => (
              <div key={v.id} className="card flex items-center gap-3">
                <span className="verbale-codice">{v.codice}</span>
                <div className="flex-1">
                  <p className="text-sm text-brand-text">{v.wbs}</p>
                  <p className="text-xs text-brand-text2">{formatDataIT(v.data)}</p>
                </div>
                <span className={`badge ${
                  v.stato === 'completo'   ? 'badge-green' :
                  v.stato === 'annullato' ? 'badge-red'   : 'badge-amber'
                }`}>{v.stato}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
