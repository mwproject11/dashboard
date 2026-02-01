import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// DEBUG: Mostra stato Supabase all'avvio
try {
  // @ts-ignore
  const env = import.meta.env || {};
  const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    alert('⚠️ Supabase NON configurato!\n\nUsando localStorage.\n\nPer attivare Supabase:\n1. Verifica .env.local nella root\n2. Riavvia npm run dev\n3. O configura variabili su Vercel');
  } else {
    alert('✅ Supabase configurato!\nURL: ' + url.substring(0, 30) + '...\n\nI dati saranno salvati sul cloud.');
  }
} catch (e) {
  alert('Errore lettura env: ' + String(e));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
