import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSaluto } from '@verbali/shared'
import { DashboardStats } from '@/components/pes/DashboardStats'
import { PesModulo } from '@/components/pes/PesModulo'
import { BachecaNote } from '@/components/note/BachecaNote'
import { ModalPanel } from '@/components/ui/ModalPanel'

// ── Profilo utente da localStorage ───────────────────────────
function leggiProfilo(): { cognome: string; qualifica: string; email: string; ruolo: 'coordinatore' | 'ispettore' } {
  try {
    const p = JSON.parse(localStorage.getItem('userProfile') ?? '{}')
    return {
      cognome:   p.cognome ?? '',
      qualifica: p.qualifica ?? '',
      email:     p.email ?? 'admin@dev.local',
      ruolo:     p.is_funzionario ? 'coordinatore' : 'ispettore',
    }
  } catch {
    return { cognome: '', qualifica: '', email: 'admin@dev.local', ruolo: 'ispettore' }
  }
}

// ── Config card griglia ──────────────────────────────────────
const CARD_CFG = [
  { id: 'pes',           label: 'PES',           sub: 'Piano Esecutivo Prove',   icon: '📋', grad: 'from-brand-amber to-brand-amber-l',   textCls: 'text-brand-bg' },
  { id: 'calcestruzzo',  label: 'CALCESTRUZZO',  sub: 'Verbali & Prelievi',      icon: '🏗️', grad: 'from-brand-blue to-brand-blue-l',     textCls: 'text-white' },
  { id: 'acciaio',       label: 'ACCIAIO',       sub: 'Controlli & Certificati', icon: '⚙️', grad: 'from-brand-violet to-brand-violet-l', textCls: 'text-white' },
  { id: 'terre',         label: 'TERRE',         sub: 'Prove & Analisi',         icon: '🌍', grad: 'from-brand-teal to-brand-teal-l',     textCls: 'text-white' },
  { id: 'conglomerato',  label: 'CONGLOMERATI',  sub: 'Bituminosi & Strati',     icon: '🛣️', grad: 'from-brand-amber to-brand-amber-l',   textCls: 'text-white' },
  { id: 'note',          label: 'NOTE',          sub: 'Bacheca condivisa',       icon: '📌', grad: 'from-brand-text3 to-brand-line2',     textCls: 'text-white' },
] as const

export default function DashboardPage() {
  const navigate       = useNavigate()
  const { cantiereId } = useParams<{ cantiereId: string }>()
  const profilo        = leggiProfilo()
  const saluto         = getSaluto(profilo.cognome, profilo.qualifica)

  const [modalePes, setModalePes]   = useState(false)
  const [modaleNote, setModaleNote] = useState(false)

  const handleCardClick = useCallback((id: string) => {
    if (id === 'pes')  return setModalePes(true)
    if (id === 'note') return setModaleNote(true)
    navigate(`/cantiere/${cantiereId}/${id}`)
  }, [cantiereId, navigate])

  if (!cantiereId) return null

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* ── Hero ──────────────────────────────────────────── */}
      <div>
        <p className="text-sm text-brand-text2 mb-1">
          Benvenuto, <span className="text-brand-amber-l">{saluto.split(',')[1]?.trim() ?? ''}</span>
        </p>
        <h1 className="text-2xl font-black tracking-tight text-brand-text">
          Cantiere <span className="text-brand-amber-l">{cantiereId}</span>
        </h1>
        <p className="text-xs text-brand-text3 font-mono mt-1">
          Lotto 1 · Progr. km 10+000 ÷ 25+000
        </p>
      </div>

      {/* ── Stats bar ─────────────────────────────────────── */}
      <DashboardStats cantiereId={cantiereId} />

      {/* ── Griglia 6 card ────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {CARD_CFG.map(cfg => (
          <button
            key={cfg.id}
            onClick={() => handleCardClick(cfg.id)}
            aria-label={`Apri modulo ${cfg.label}: ${cfg.sub}`}
            className="card-hover relative flex flex-col gap-3 text-left min-h-[140px]
                       overflow-hidden p-5"
          >
            {/* Glow top */}
            <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${cfg.grad} opacity-70`}
                 aria-hidden="true" />

            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.grad}
                            flex items-center justify-center text-xl shadow-card`}
                 aria-hidden="true">
              {cfg.icon}
            </div>

            {/* Text */}
            <div>
              <p className="font-bold text-brand-text text-sm leading-tight">{cfg.label}</p>
              <p className="text-xs text-brand-text3 mt-0.5">{cfg.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Ruolo badge ───────────────────────────────────── */}
      <div className="text-center">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
          ${profilo.ruolo === 'coordinatore'
            ? 'badge-amber border border-brand-amber/20'
            : 'badge-blue border border-brand-blue/20'}`}
          role="status" aria-label={`Ruolo attuale: ${profilo.ruolo}`}>
          <span aria-hidden="true">{profilo.ruolo === 'coordinatore' ? '🔑' : '👷'}</span>
          {profilo.ruolo === 'coordinatore' ? 'Coordinatore Prove' : 'Ispettore'}
        </span>
      </div>

      {/* ── Modale PES ────────────────────────────────────── */}
      <ModalPanel isOpen={modalePes} onClose={() => setModalePes(false)} title="ANAS PES" icon="📋">
        <PesModulo idCantiere={cantiereId} ruolo={profilo.ruolo} utenteEmail={profilo.email} />
      </ModalPanel>

      {/* ── Modale Note ───────────────────────────────────── */}
      <ModalPanel isOpen={modaleNote} onClose={() => setModaleNote(false)} title="NOTE" icon="📌">
        <BachecaNote idCantiere={cantiereId} />
      </ModalPanel>
    </div>
  )
}
