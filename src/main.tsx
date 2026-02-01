import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Diagnostic import - check console for Supabase config status
import './lib/supabase-check'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
