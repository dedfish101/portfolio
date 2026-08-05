import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { StoreProvider } from './lib/store.tsx'
import { AuthProvider } from './components/Auth.tsx'
import { Toaster } from './components/Toast.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
)
