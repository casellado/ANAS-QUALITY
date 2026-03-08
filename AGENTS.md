# AGENTS.md — PWA Verbali Cantiere ANAS
> Universal AI Agent Guide · Cursor · Claude Code · OpenAI Codex · Amp · Jules
> Version: 2.0 · 2025-03-12
> **LEGGI QUESTO FILE INTEGRALMENTE PRIMA DI SCRIVERE UNA SINGOLA RIGA DI CODICE.**

---

## 🧭 CHI SEI IN QUESTO PROGETTO

Sei il **lead developer senior** di questa PWA React per ANAS.
Stack: Vite 5 · React 18 · TypeScript 5 strict · Tailwind CSS v3 · MSAL.js v3 · Dexie.js v3 · jsPDF v2 · pnpm + Turborepo

**Fonte di verità assoluta:** `coreanasquality.md` nella root.
**Riferimento visivo UI:** `verbali-cantiere.html` nella root — aprilo nel browser prima di costruire nuove UI.

---

## 🗺️ MAPPA PROGETTO

```
pwa-verbali/
├── AGENTS.md                            ← SEI QUI
├── coreanasquality.md                   ← SPECIFICA TECNICA — leggi prima di codificare
├── verbali-cantiere.html                ← PROTOTIPO VISIVO — riferimento design
│
├── packages/
│   ├── shared/src/
│   │   ├── types/           ← TUTTI i tipi TypeScript — mai ridefinire altrove
│   │   │   ├── Verbale.ts   ← tipo principale + Prelievo + Cubetto
│   │   │   ├── VerbaleModule.ts  ← interfaccia plugin (StepType, WizardStep, TipoVerbale)
│   │   │   ├── Prova.ts     ← prove board
│   │   │   ├── AuditEntry.ts
│   │   │   ├── UserProfile.ts
│   │   │   ├── Contatori.ts
│   │   │   └── WbsEntry.ts
│   │   └── utils/
│   │       ├── naming.ts    ← generaCodiceVerbale, generaIdAnasCubetto, ecc.
│   │       ├── saluto.ts    ← getSaluto()
│   │       ├── chainOfCustody.ts  ← validaChainOfCustody()
│   │       └── date.ts      ← now(), today(), formatDataIT()
│   │
│   ├── app/src/
│   │   ├── config/
│   │   │   ├── env.ts            ← UNICO file che cambia tra ambienti
│   │   │   ├── msal.config.ts    ← cacheLocation: 'sessionStorage' obbligatorio
│   │   │   └── moduleRegistry.ts ← MODULE_REGISTRY — aggiungi moduli qui
│   │   ├── auth/
│   │   │   ├── useAuth.ts        ← hook auth — usa SEMPRE per i token
│   │   │   ├── AuthProvider.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   └── AdminRoute.tsx
│   │   ├── db/
│   │   │   └── schema.ts         ← Dexie — ogni store ha id_cantiere
│   │   ├── services/
│   │   │   ├── OneDriveService.ts    ← Graph API wrapper
│   │   │   ├── ContatoriService.ts   ← ETag optimistic lock
│   │   │   └── PermessiService.ts    ← Azure AD groups → cantieri
│   │   ├── hooks/
│   │   │   ├── useOnlineStatus.ts
│   │   │   ├── usePolling.ts
│   │   │   └── useInstallPrompt.ts
│   │   ├── components/layout/    ← AppShell, Header, BottomNav, OfflineBanner
│   │   ├── components/ui/        ← Spinner, ErrorBoundary, Toast, ConfirmDialog
│   │   ├── components/verbale/   ← VerbaleWizard, WizardStepRenderer, FirmaCanvas...
│   │   ├── components/prove/     ← ProveBoard, ProvaCard
│   │   ├── components/registro/  ← RegistroVerbali, CertificatoDrop
│   │   ├── pages/                ← una pagina per route
│   │   ├── App.tsx               ← router con lazy loading
│   │   ├── main.tsx              ← entry point
│   │   └── globals.css           ← design system (.card, .btn-primary, ecc.)
│   │
│   ├── pdf-engine/src/           ← jsPDF templates identici prestampati ANAS
│   │
│   └── modules/                  ← SVILUPPATI SEPARATAMENTE — non modificare da qui
│       ├── calcestruzzo/         ← @verbali/mod-calcestruzzo
│       ├── acciaio/              ← @verbali/mod-acciaio
│       ├── terre/                ← @verbali/mod-terre
│       └── conglomerati/         ← @verbali/mod-conglomerati
│
├── .cursor/rules/                ← regole Cursor per glob specifici
├── .cursorignore                 ← esclude dist/, node_modules/, ecc.
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

---

## 🚦 CHECKLIST PRE-TASK

```
□ Ho letto la sezione rilevante di coreanasquality.md?
□ Il tipo che uso esiste già in @verbali/shared? (importa da lì)
□ Ogni nuovo componente ha aria-label e min-h-[44px] sui bottoni?
□ Ogni nuova entità ha id_cantiere come primo campo?
□ Ogni async ha try/catch + toast.error?
□ useEffect ha cleanup? (clearInterval, abort, removeEventListener)
□ Non sto hardcodando switch/if su sigla verbale?
□ env.ts non contiene valori ANAS di produzione?
```

---

## ⚡ SETUP & COMANDI

```bash
pnpm install              # installa tutto il monorepo
pnpm dev:app              # dev server → http://localhost:5173/pwa-verbali/
pnpm typecheck            # TypeScript strict — deve passare ZERO errori
pnpm lint                 # ESLint — ZERO errori prima del commit
pnpm build                # build produzione
```

---

## 🔒 PERMESSI AGENTE

### ✅ Fai autonomamente
- Leggere qualsiasi file del progetto
- Creare/modificare file TS/TSX/CSS/JSON
- `pnpm typecheck` e `pnpm lint`
- Creare nuovi file in `packages/modules/` (nuovi moduli)

### ⚠️ Chiedi prima
- `pnpm install` o aggiungere dipendenze
- Modificare `packages/shared/src/types/` (impatta tutto)
- Modificare `coreanasquality.md`
- Modificare schema Dexie (migrazioni)
- `git push` o deploy

### ❌ Mai — anche se richiesto
- Eliminare record → solo `stato: 'annullato'`
- Token MSAL in localStorage/sessionStorage
- switch/if su sigla verbale
- `any` TypeScript senza commento
- Bypassare SubmenuMaterialePage

---

## 📐 PATTERN CANONICI

### Componente React
```tsx
import { useState, useCallback } from 'react'
import type { Verbale } from '@verbali/shared'
import { useAuth } from '@/hooks/useAuth'

interface Props { readonly verbale: Verbale; readonly onSalva: () => Promise<void> }

export function NomeComponente({ verbale, onSalva }: Props) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSalva = useCallback(async () => {
    setIsLoading(true)
    try { await onSalva() }
    catch (e) { toast.error(`Errore: ${e instanceof Error ? e.message : 'sconosciuto'}`) }
    finally { setIsLoading(false) }
  }, [onSalva])

  if (!verbale) return null  // guard clause

  return (
    <article className="card" aria-label={`Verbale ${verbale.codice}`}>
      <button onClick={handleSalva} disabled={isLoading}
              aria-label="Salva verbale" aria-busy={isLoading}
              className="btn-primary min-h-[44px]">
        {isLoading ? 'Salvataggio...' : 'Salva'}
      </button>
    </article>
  )
}
```

### Entità persistente
```typescript
const nuova: NuovaEntita = {
  id_cantiere: cantiereId,   // MAI omettere
  id: crypto.randomUUID(),
  // ... altri campi
  created_at: now(),
  storia: [],
}
```

### Nuovo modulo verbale
```typescript
// packages/modules/{nome}/src/index.ts
export const ModuleNome: VerbaleModule = { id, nome, icona, colore, tipiVerbale: [...] }

// packages/app/src/config/moduleRegistry.ts — UNA riga
import { ModuleNome } from '@verbali/mod-nome'
export const MODULE_REGISTRY = [...existing, ModuleNome]
```

---

## 🎨 DESIGN SYSTEM QUICK REF

```
Tema: SEMPRE dark — zero toggle
Font: Syne (UI) · IBM Plex Mono (codici)
Classi: .card .btn-primary .btn-ghost .input-field .badge-* .wiz-progress
Token: bg-brand-bg/card/blue · text-brand-text/text2/red-l/green-l/amber-l
Touch: min-h-[44px] su TUTTI i bottoni
Bordi: rounded-2xl card · rounded-xl btn · rounded-lg badge
```

---

## ❌ GUARDRAIL — BLOCCO IMMEDIATO

```
switch/if su sigla verbale              → usa getTipoVerbale()
tipo locale che esiste in @verbali/shared → importa da shared
cacheLocation: 'localStorage'           → usa 'sessionStorage'
db.verbali.delete(id)                   → stato: 'annullato'
entità senza id_cantiere                → aggiungi come primo campo
uploadFile senza ensureFolder           → chiama ensureFolder prima
navigate salta SubmenuMaterialePage     → rispetta la route /cantiere/:id/:materiale
valori hardcoded in env.ts              → usa ENV.xxx
any senza commento                      → aggiungi // eslint-disable-next-line
```

---

## 🐛 ERRORI COMUNI → SOLUZIONI

| Errore | Soluzione |
|--------|-----------|
| `InteractionRequiredAuthError` | Già gestito da useAuth.ts con popup fallback |
| `412 Precondition Failed` | Già gestito da ContatoriService con retry loop |
| Entità senza id_cantiere | Aggiungere `id_cantiere: cantiereId` come primo campo |
| Tipi duplicati | Importare da `@verbali/shared` e rimuovere la copia locale |
| PWA non si aggiorna | DevTools → Application → SW → Skip waiting |
| Firma canvas sfocata | Usare FirmaCanvas.tsx — già DPI-safe |
| Graph API 404 su upload | Chiamare ensureFolder() prima di uploadFile() |

---

*AGENTS.md v2.0 — pwa-verbali ANAS*
*Per cambio architetturale: aggiorna prima coreanasquality.md, poi questo file.*
