import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

interface PrivateRouteProps {
  readonly children: React.ReactNode
}

/**
 * Guard per route autenticate.
 * Redirige a /login se l'utente non è autenticato.
 * Preserva la location originale per il redirect post-login.
 */
export function PrivateRoute({ children }: PrivateRouteProps) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
