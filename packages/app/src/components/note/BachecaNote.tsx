import { useState, useCallback, useEffect, useRef } from 'react'
import { db, type Nota } from '@/db/schema'
import { useAuth } from '@/auth/useAuth'
import { usePolling } from '@/hooks/usePolling'
import { useToast } from '@/components/ui/ToastContext'
import { OneDriveService } from '@/services/OneDriveService'
import { ENV } from '@/config/env'

const MAX_CHARS   = 500
const DB_PATH     = '_db/note.json'

interface BachecaProps {
  readonly idCantiere: string
}

export function BachecaNote({ idCantiere }: BachecaProps) {
  const { getToken, account } = useAuth()
  const toast                 = useToast()
  const [note, setNote]       = useState<Nota[]>([])
  const [testo, setTesto]     = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const driveRef = useRef<OneDriveService | null>(null)

  if (!driveRef.current) {
    driveRef.current = new OneDriveService(getToken)
  }

  // ── Fetch note ──────────────────────────────────────────
  const fetchNote = useCallback(async () => {
    try {
      if (navigator.onLine && driveRef.current) {
        const data = await driveRef.current.read<Nota[]>(idCantiere, DB_PATH)
        await db.transaction('rw', db.note_bacheca, async () => {
          for (const n of data) await db.note_bacheca.put(n)
        })
        setNote(data.sort((a, b) => b.created_at.localeCompare(a.created_at)))
        return
      }
    } catch { /* fallback Dexie */ }
    const local = await db.note_bacheca.where('id_cantiere').equals(idCantiere).toArray()
    setNote(local.sort((a, b) => b.created_at.localeCompare(a.created_at)))
  }, [idCantiere])

  useEffect(() => {
    fetchNote()
  }, [fetchNote])

  usePolling(fetchNote, ENV.POLLING_INTERVAL)

  // ── Pubblica nota ──────────────────────────────────────
  const handlePost = useCallback(async () => {
    if (!testo.trim() || !account) return
    setIsPosting(true)
    try {
      const nuova: Nota = {
        id:           crypto.randomUUID(),
        id_cantiere:  idCantiere,
        autore:       account.name,
        autore_email: account.username,
        testo:        testo.trim(),
        created_at:   new Date().toISOString(),
      }

      // Dexie prima
      await db.note_bacheca.put(nuova)
      setNote(prev => [nuova, ...prev])
      setTesto('')

      // OneDrive dopo
      if (navigator.onLine && driveRef.current) {
        const all = await db.note_bacheca.where('id_cantiere').equals(idCantiere).toArray()
        await driveRef.current.write(idCantiere, DB_PATH, all)
      }

      toast.success('Nota pubblicata!')
    } catch (err) {
      toast.error(`Errore: ${err instanceof Error ? err.message : 'Sconosciuto'}`)
    } finally {
      setIsPosting(false)
    }
  }, [testo, account, idCantiere, toast])

  const remaining = MAX_CHARS - testo.length

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-card2 flex items-center justify-center text-xl"
             aria-hidden="true">📌</div>
        <div>
          <h2 className="font-bold text-brand-text text-lg leading-none">NOTE</h2>
          <p className="text-xs text-brand-text2 mt-0.5">Bacheca condivisa</p>
        </div>
      </div>

      {/* Composer */}
      <div className="card flex flex-col gap-3">
        <textarea
          value={testo}
          onChange={e => setTesto(e.target.value.slice(0, MAX_CHARS))}
          rows={3}
          aria-label="Scrivi una nota per la bacheca condivisa"
          className="textarea-field"
          placeholder="Scrivi un messaggio per tutto il team..."
        />
        <div className="flex items-center justify-between">
          <span className={`text-xs font-mono ${remaining < 50 ? 'text-brand-red-l' : 'text-brand-text3'}`}>
            {remaining} caratteri
          </span>
          <button
            onClick={handlePost}
            disabled={!testo.trim() || isPosting}
            aria-label="Pubblica nota in bacheca"
            aria-busy={isPosting}
            className="btn-primary text-sm px-5 py-2"
          >
            {isPosting ? 'Invio...' : 'Pubblica →'}
          </button>
        </div>
      </div>

      {/* Lista note */}
      <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[360px]">
        {note.length === 0 && (
          <p className="text-center text-brand-text3 text-sm py-8">
            Nessuna nota ancora. Scrivi la prima!
          </p>
        )}
        {note.map(n => (
          <article key={n.id} className="card" role="article" aria-label={`Nota di ${n.autore}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-brand-amber-l">{n.autore}</span>
              <span className="text-xs text-brand-text3 font-mono">
                {new Date(n.created_at).toLocaleString('it-IT', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            <p className="text-sm text-brand-text leading-relaxed">{n.testo}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

