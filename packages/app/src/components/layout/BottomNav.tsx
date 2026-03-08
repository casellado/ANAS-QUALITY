import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { LayoutGrid, ClipboardList, FlaskConical, Settings } from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Cantiere', icon: LayoutGrid,     path: (id: string) => `/cantiere/${id}` },
  { id: 'registro',  label: 'Registro', icon: ClipboardList,  path: (id: string) => `/cantiere/${id}/registro` },
  { id: 'prove',     label: 'Prove',    icon: FlaskConical,   path: (id: string) => `/cantiere/${id}/prove` },
  { id: 'admin',     label: 'Admin',    icon: Settings,       path: () => '/admin' },
] as const

/**
 * Navigazione inferiore — safe-area-inset per iPhone notch.
 */
export function BottomNav() {
  const navigate      = useNavigate()
  const { cantiereId } = useParams()
  const location      = useLocation()

  if (!cantiereId) return null

  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      {navItems.map(item => {
        const href      = item.path(cantiereId)
        const isActive  = location.pathname === href
        const Icon      = item.icon

        return (
          <button
            key={item.id}
            onClick={() => navigate(href)}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
