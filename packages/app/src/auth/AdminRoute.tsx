import { Navigate } from 'react-router-dom'

interface AdminRouteProps {
  readonly children: React.ReactNode
  readonly isAdmin: boolean
}

/**
 * Guard per route admin-only.
 * Usato in combinazione con PrivateRoute.
 * Redirige alla dashboard se l'utente non è admin.
 */
export function AdminRoute({ children, isAdmin }: AdminRouteProps) {
  if (!isAdmin) {
    return <Navigate to="/cantiere" replace />
  }
  return <>{children}</>
}
