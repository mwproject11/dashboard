/**
 * Supabase Client Configuration
 * Configura la connessione al backend Supabase
 * 
 * NOTA: Se @supabase/supabase-js non è installato, questo modulo
 * esporta valori null che attivano il fallback a localStorage
 */

// Check if we're in a browser environment with import.meta.env
const getEnv = (key: string): string => {
  try {
    return (import.meta as any).env?.[key] || '';
  } catch {
    return '';
  }
};

// Dynamic import to avoid errors if package is not installed
let supabaseClient: any = null;
let isConfigured = false;

try {
  // Only try to load if env vars are set
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
  
  if (supabaseUrl && supabaseAnonKey) {
    // Try to load the module
    const supabaseModule = require('@supabase/supabase-js');
    
    if (supabaseModule && supabaseModule.createClient) {
      supabaseClient = supabaseModule.createClient(supabaseUrl, supabaseAnonKey, {
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
      isConfigured = true;
    }
  }
} catch {
  // Supabase not installed or not configured
  supabaseClient = null;
  isConfigured = false;
}

/**
 * Client Supabase (null se non configurato)
 */
export const supabase = supabaseClient;

/**
 * Verifica se Supabase è configurato
 */
export const isSupabaseConfigured = (): boolean => isConfigured;

/**
 * Helper per ottenere lo stato di configurazione
 */
export const getSupabaseStatus = () => ({
  configured: isConfigured,
  url: getEnv('VITE_SUPABASE_URL') ? '***set***' : '***missing***',
  key: getEnv('VITE_SUPABASE_ANON_KEY') ? '***set***' : '***missing***',
});

export default supabase;
