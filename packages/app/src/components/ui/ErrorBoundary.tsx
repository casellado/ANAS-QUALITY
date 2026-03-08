import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  readonly children: ReactNode
  readonly fallback?: ReactNode
}

interface State {
  hasError: boolean
  error:    Error | null
}

/**
 * Error boundary React — cattura errori di rendering non gestiti.
 * Mostra un fallback pulito invece di un crash bianco.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg gap-6 p-8"
             role="alert">
          <div className="text-4xl" aria-hidden="true">⚠️</div>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-brand-text mb-2">
              Qualcosa è andato storto
            </h1>
            <p className="text-sm text-brand-text2 mb-6">
              {this.state.error?.message ?? 'Errore sconosciuto'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
              aria-label="Ricarica l'applicazione"
            >
              Ricarica l'app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
