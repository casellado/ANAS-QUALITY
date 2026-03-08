import { memo } from 'react'
import type { ProvaCalendario, StatoProvaCalendario } from '@verbali/shared'

// ── Config colori stato ──────────────────────────────────────
const STATO_CFG: Record<StatoProvaCalendario, {
  grad: string; badgeCls: string; label: string; dot: string
}> = {
  da_eseguire:     { grad: 'from-brand-blue to-brand-teal',     badgeCls: 'badge-blue',   label: 'Da eseguire', dot: 'bg-brand-blue-l' },
  presa_in_carico: { grad: 'from-brand-amber to-brand-amber-l', badgeCls: 'badge-amber',  label: 'In carico',   dot: 'bg-brand-amber-l' },
  completata:      { grad: 'from-brand-green to-brand-teal',    badgeCls: 'badge-green',  label: 'Completata',  dot: 'bg-brand-green-l' },
  annullata:       { grad: 'from-brand-text3 to-brand-text3',   badgeCls: 'badge-gray',   label: 'Annullata',   dot: 'bg-brand-text3' },
}

interface ProvaCardProps {
  readonly prova:            ProvaCalendario
  readonly ruolo:            'coordinatore' | 'ispettore'
  readonly utenteEmail:      string
  readonly onPrendiInCarico: () => void
  readonly onCompleta:       () => void
}

export const ProvaCard = memo(function ProvaCard({
  prova, ruolo, utenteEmail, onPrendiInCarico, onCompleta,
}: ProvaCardProps) {
  const cfg = STATO_CFG[prova.stato] ?? STATO_CFG.da_eseguire

  const cardBg = prova.stato === 'presa_in_carico'
    ? 'bg-brand-amber/5 border-brand-amber/30'
    : prova.stato === 'completata'
      ? 'bg-brand-green/5 border-brand-green/20'
      : 'bg-brand-card border-brand-line'

  const isIspettore = ruolo === 'ispettore'
  const isMio       = prova.ispettore_email === utenteEmail

  return (
    <article
      className={`rounded-2xl border p-4 transition-all duration-200 ${cardBg}`}
      role="article"
      aria-label={`Prova ${prova.tipo_prova} del ${prova.data}`}
    >
      {/* Bordo superiore colorato */}
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${cfg.grad} rounded-t-2xl`} aria-hidden="true" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badge stato + categoria */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={cfg.badgeCls}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
              {cfg.label}
            </span>
            <span className="badge badge-gray">{prova.categoria}</span>
          </div>

          {/* Tipo prova */}
          <p className="font-semibold text-brand-text text-sm mb-1.5">{prova.tipo_prova}</p>

          {/* Dettagli griglia */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-brand-text2">
            <span>📅 {prova.data} · {prova.ora}</span>
            <span>📍 {prova.pk || '—'}</span>
            <span className="truncate">🏗️ {prova.lotto}</span>
            <span className="truncate">🔬 {prova.laboratorio || '—'}</span>
          </div>

          {/* WBS */}
          {prova.wbs && (
            <p className="font-mono text-brand-text3 text-xs mt-1">{prova.wbs}</p>
          )}

          {/* Ispettore chip */}
          {prova.ispettore && (
            <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
              ${prova.stato === 'presa_in_carico'
                ? 'bg-brand-amber/15 text-brand-amber-l'
                : 'bg-brand-green/15 text-brand-green-l'}`}
              aria-label={`Preso in carico da ${prova.ispettore}`}
            >
              <span aria-hidden="true">{prova.stato === 'completata' ? '✓' : '👤'}</span>
              {prova.ispettore}
            </div>
          )}
        </div>

        {/* Bottoni azione — solo ispettore */}
        {isIspettore && (
          <div className="flex flex-col gap-1.5 shrink-0">
            {prova.stato === 'da_eseguire' && (
              <button
                onClick={onPrendiInCarico}
                aria-label={`Prendo in carico la prova: ${prova.tipo_prova}`}
                className="btn-primary text-xs px-3 py-2 whitespace-nowrap"
              >
                Prendo in carico
              </button>
            )}
            {prova.stato === 'presa_in_carico' && isMio && (
              <button
                onClick={onCompleta}
                aria-label={`Segna come completata la prova: ${prova.tipo_prova}`}
                className="btn-secondary text-xs px-3 py-2 whitespace-nowrap"
              >
                ✓ Completata
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
})

ProvaCard.displayName = 'ProvaCard'

