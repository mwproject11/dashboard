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
    // @ts-ignore - import.meta.env is provided by Vite
    return import.meta.env?.[key] || '';
  } catch {
    return '';
  }
};

// Check if Supabase env vars are set
const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
const hasCredentials = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Client Supabase (null se non configurato)
 * Usa lazy initialization per evitare errori se il pacchetto non è installato
 */
let supabaseClient: any = null;

/**
 * Ottieni il client Supabase (inizializza al primo uso)
 */
export const getSupabase = async () => {
  if (!hasCredentials) return null;
  if (supabaseClient) return supabaseClient;
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
    return supabaseClient;
  } catch {
    return null;
  }
};

/**
 * Verifica se Supabase è configurato
 */
export const isSupabaseConfigured = (): boolean => hasCredentials;

/**
 * Helper per ottenere lo stato di configurazione
 */
export const getSupabaseStatus = () => ({
  configured: hasCredentials,
  url: supabaseUrl ? '***set***' : '***missing***',
  key: supabaseAnonKey ? '***set***' : '***missing***',
});

// Export sync placeholder (will be null until getSupabase is called)
export const supabase: any = null;

export default supabase;
