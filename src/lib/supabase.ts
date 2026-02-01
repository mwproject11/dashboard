/**
 * Supabase Client Configuration
 * Configura la connessione al backend Supabase
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Queste variabili d'ambiente devono essere configurate su Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Supabase non configurato. Usa localStorage come fallback.\n' +
    '    Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env'
  );
}

// Client Supabase tipizzato
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'mw_mgr_supabase_auth',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper per verificare se Supabase è configurato
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Re-export per comodità
export default supabase;
