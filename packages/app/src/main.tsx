import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { ToastProvider } from '@/components/ui/Toast'
import { App } from './App'
import './globals.css'

const container = document.getElementById('root')
if (!container) throw new Error('Root element #root non trovato nel DOM')

createRoot(container).render(
  <StrictMode>
    <BrowserRouter basename="/ANAS-QUALITY" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
