import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { PrivateRoute } from '@/auth/PrivateRoute'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'

// ── Lazy loading pagine — code splitting ───────────────────────
const LoginPage             = lazy(() => import('@/pages/LoginPage'))
const ProfileSetupPage      = lazy(() => import('@/pages/ProfileSetupPage'))
const CantiereSelectPage    = lazy(() => import('@/pages/CantiereSelectPage'))
const DashboardPage         = lazy(() => import('@/pages/DashboardPage'))
const SubmenuMaterialePage  = lazy(() => import('@/pages/SubmenuMaterialePage'))
const VerbaleNewPage        = lazy(() => import('@/pages/VerbaleNewPage'))
const VerbaleEditPage       = lazy(() => import('@/pages/VerbaleEditPage'))
const ProvePage             = lazy(() => import('@/pages/ProvePage'))
const RegistroPage          = lazy(() => import('@/pages/RegistroPage'))
const RegistroCubettiPage   = lazy(() => import('@/pages/RegistroCubettiPage'))
const ArchivioVerbaliPage   = lazy(() => import('@/pages/ArchivioVerbaliPage'))
const AdminPage             = lazy(() => import('@/pages/AdminPage'))

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-brand-bg">
    <Spinner className="w-8 h-8" />
  </div>
)

/**
 * RootRedirect — redirect intelligente dalla root in base allo stato auth.
 *
 * Non autenticato        → /login
 * Autenticato, no profilo → /profilo
 * Autenticato, profilo ok → /cantiere
 */
function RootRedirect() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  const profiloSalvato = localStorage.getItem('userProfile')
  if (!profiloSalvato) return <Navigate to="/profilo" replace />
  return <Navigate to="/cantiere" replace />
}

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* ── Pubbliche ──────────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── Setup profilo (post primo login) ────────────────── */}
        <Route path="/profilo" element={
          <PrivateRoute><ProfileSetupPage /></PrivateRoute>
        } />

        {/* ── Selezione cantiere ───────────────────────────────── */}
        <Route path="/cantiere" element={
          <PrivateRoute><CantiereSelectPage /></PrivateRoute>
        } />

        {/* ── Area cantiere — con AppShell ─────────────────────── */}
        <Route element={<AppShell />}>

          {/* Dashboard — griglia moduli da MODULE_REGISTRY */}
          <Route path="/cantiere/:cantiereId" element={
            <PrivateRoute><DashboardPage /></PrivateRoute>
          } />

          {/* ← ROUTE OBBLIGATORIA — MAI bypassare */}
          <Route path="/cantiere/:cantiereId/:materiale" element={
            <PrivateRoute><SubmenuMaterialePage /></PrivateRoute>
          } />

          {/* Archivio verbali per materiale */}
          <Route path="/cantiere/:cantiereId/:materiale/archivio" element={
            <PrivateRoute><ArchivioVerbaliPage /></PrivateRoute>
          } />

          {/* Wizard nuovo verbale */}
          <Route path="/cantiere/:cantiereId/:materiale/:sigla/nuovo" element={
            <PrivateRoute><VerbaleNewPage /></PrivateRoute>
          } />

          {/* Modifica verbale esistente */}
          <Route path="/cantiere/:cantiereId/verbale/:verbaleId/modifica" element={
            <PrivateRoute><VerbaleEditPage /></PrivateRoute>
          } />

          {/* Prove board */}
          <Route path="/cantiere/:cantiereId/prove" element={
            <PrivateRoute><ProvePage /></PrivateRoute>
          } />

          {/* Registro verbali */}
          <Route path="/cantiere/:cantiereId/registro" element={
            <PrivateRoute><RegistroPage /></PrivateRoute>
          } />

          {/* Registro cubetti */}
          <Route path="/cantiere/:cantiereId/registro/cubetti" element={
            <PrivateRoute><RegistroCubettiPage /></PrivateRoute>
          } />

        </Route>

        {/* ── Admin ────────────────────────────────────────────── */}
        <Route path="/admin" element={
          <PrivateRoute><AdminPage /></PrivateRoute>
        } />

        {/* ── Redirect root — intelligente ────────────────────── */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />

      </Routes>
    </Suspense>
  )
}
