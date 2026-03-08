import { useState, useEffect } from 'react'
import { db } from '@/db/schema'

interface StatsData {
  daEseguire:    number
  presaInCarico: number
  completate:    number
}

const STAT_CFG = [
  { key: 'daEseguire'    as const, label: 'Da eseguire', color: 'text-brand-blue-l',  bg: 'bg-brand-blue/10 border-brand-blue/20' },
  { key: 'presaInCarico' as const, label: 'In carico',   color: 'text-brand-amber-l', bg: 'bg-brand-amber/10 border-brand-amber/20' },
  { key: 'completate'    as const, label: 'Completate',  color: 'text-brand-green-l', bg: 'bg-brand-green/10 border-brand-green/20' },
]

interface DashboardStatsProps {
  readonly cantiereId: string
}

export function DashboardStats({ cantiereId }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData>({ daEseguire: 0, presaInCarico: 0, completate: 0 })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const rows = await db.prove_calendario
          .where('id_cantiere').equals(cantiereId).toArray()
        if (cancelled) return
        setStats({
          daEseguire:    rows.filter(p => p.stato === 'da_eseguire').length,
          presaInCarico: rows.filter(p => p.stato === 'presa_in_carico').length,
          completate:    rows.filter(p => p.stato === 'completata').length,
        })
      } catch { /* silenzioso */ }
    }
    load()
    return () => { cancelled = true }
  }, [cantiereId])

  return (
    <div className="grid grid-cols-3 gap-3">
      {STAT_CFG.map(s => (
        <div key={s.key}
          className={`${s.bg} border rounded-2xl p-3 text-center`}
          role="status"
          aria-label={`${s.label}: ${stats[s.key]}`}
        >
          <p className={`text-2xl font-black tabular-nums font-mono ${s.color}`}>
            {stats[s.key]}
          </p>
          <p className="text-xs text-brand-text3 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

