import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { OfflineBanner } from './OfflineBanner'

/**
 * Shell dell'app — layout condiviso per tutte le route autenticate.
 * Header + OfflineBanner (condizionale) + contenuto pagina + BottomNav.
 */
export function AppShell() {
  return (
    <div className="page-container">
      <Header />
      <OfflineBanner />
      <main className="content-area pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
