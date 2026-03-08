import { useState, useEffect, useCallback, useRef } from 'react'
import type { ProvaCalendario, MemoriaPES, UserProfile } from '@verbali/shared'
import { useAuth } from '@/auth/useAuth'
import { usePolling } from '@/hooks/usePolling'
import { OneDriveService } from '@/services/OneDriveService'
import { PesService } from '@/services/PesService'
import { ENV } from '@/config/env'

// ── Profilo di fallback da localStorage ─────────────────────
function leggiProfilo(account: { name: string; username: string } | null): UserProfile {
  try {
    const stored = localStorage.getItem('userProfile')
    if (stored) return JSON.parse(stored) as UserProfile
  } catch { /* fallback sotto */ }

  return {
    email:                account?.username ?? 'unknown@anas.it',
    nome:                 account?.name.split(' ')[0] ?? 'Utente',
    cognome:              account?.name.split(' ').slice(1).join(' ') ?? '',
    qualifica:            'Altro',
    mansione:             'Ispettore di Cantiere',
    cantieri_autorizzati: [],
    is_admin:             false,
    is_funzionario:       false,
    created_at:           new Date().toISOString(),
    updated_at:           new Date().toISOString(),
  }
}

interface UsePesReturn {
  readonly prove:           ProvaCalendario[]
  readonly memoria:         MemoriaPES
  readonly isLoading:       boolean
  readonly error:           string | null
  readonly creaProva:       (dati: Omit<ProvaCalendario,
    'id' | 'id_cantiere' | 'stato' | 'ispettore' | 'ispettore_email' |
    'storia' | 'created_at' | 'updated_at'>) => Promise<void>
  readonly prendiInCarico:  (provaId: string) => Promise<void>
  readonly completaProva:   (provaId: string, note: string) => Promise<void>
  readonly refetch:         () => Promise<void>
}

export function usePes(idCantiere: string): UsePesReturn {
  const { getToken, account }       = useAuth()
  const [prove, setProve]           = useState<ProvaCalendario[]>([])
  const [memoria, setMemoria]       = useState<MemoriaPES>({
    id_cantiere: idCantiere,
    lotti: [], wbs: [], sezioni: [], laboratori: [],
    tipi_prova: { CALCESTRUZZO: [], ACCIAIO: [], TERRE: [], 'CONGLOMERATO BITUMINOSO': [] },
    updated_at: '',
  })
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const serviceRef = useRef<PesService | null>(null)
  const profiloRef = useRef<UserProfile>(leggiProfilo(account))

  // Inizializza service
  if (!serviceRef.current) {
    const drive = new OneDriveService(getToken)
    serviceRef.current = new PesService(getToken, drive)
  }

  // ── Fetch iniziale ──────────────────────────────────────
  const refetch = useCallback(async () => {
    const svc = serviceRef.current
    if (!svc) return
    try {
      const [p, m] = await Promise.all([
        svc.leggiProve(idCantiere),
        svc.leggiMemoria(idCantiere),
      ])
      setProve(p)
      setMemoria(m)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore caricamento prove')
    }
  }, [idCantiere])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    refetch().finally(() => {
      if (!cancelled) setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [refetch])

  // ── Polling silenzioso (senza isLoading) ────────────────
  usePolling(refetch, ENV.POLLING_INTERVAL)

  // ── Crea prova ──────────────────────────────────────────
  const creaProva = useCallback(async (
    dati: Omit<ProvaCalendario,
      'id' | 'id_cantiere' | 'stato' | 'ispettore' | 'ispettore_email' |
      'storia' | 'created_at' | 'updated_at'>
  ) => {
    const svc = serviceRef.current
    if (!svc) return
    const now = new Date().toISOString()
    const prova: ProvaCalendario = {
      id_cantiere:     idCantiere,
      id:              crypto.randomUUID(),
      ...dati,
      stato:           'da_eseguire',
      ispettore:       null,
      ispettore_email: null,
      created_by:      profiloRef.current.email,
      created_at:      now,
      updated_at:      now,
      storia:          [{ timestamp: now, utente: `${profiloRef.current.nome} ${profiloRef.current.cognome}`,
        utente_email: profiloRef.current.email, azione: 'creazione' }],
    }
    await svc.salvaProva(prova)
    await refetch()
  }, [idCantiere, refetch])

  // ── Prendi in carico ────────────────────────────────────
  const prendiInCarico = useCallback(async (provaId: string) => {
    const svc = serviceRef.current
    if (!svc) return
    await svc.prendiInCarico(idCantiere, provaId, profiloRef.current)
    await refetch()
  }, [idCantiere, refetch])

  // ── Completa prova ──────────────────────────────────────
  const completaProva = useCallback(async (provaId: string, note: string) => {
    const svc = serviceRef.current
    if (!svc) return
    await svc.completaProva(idCantiere, provaId, note, profiloRef.current)
    await refetch()
  }, [idCantiere, refetch])

  return { prove, memoria, isLoading, error, creaProva, prendiInCarico, completaProva, refetch }
}

