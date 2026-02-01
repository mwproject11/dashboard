/**
 * Supabase Client Configuration
 * Configura la connessione al backend Supabase
 * 
 * NOTA: Se @supabase/supabase-js non è installato, questo modulo
 * esporta valori null che attivano il fallback a localStorage
 */

// Check env vars - supporta vari formati (VITE_, NEXT_PUBLIC_, SUPABASE_)
const getEnvVar = (keys: string[]): string => {
  try {
    // @ts-ignore - import.meta.env is provided by Vite
    const env = import.meta.env || {};
    for (const key of keys) {
      if (env[key]) return env[key];
    }
    return '';
  } catch {
    return '';
  }
};

// Prova vari nomi di variabili in ordine di priorità
const supabaseUrl = getEnvVar([
  'VITE_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL', 
  'SUPABASE_URL'
]);

const supabaseAnonKey = getEnvVar([
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASESUPABASE_ANON_KEY', // typo nel tuo env
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASESUPABASE_PUBLISHABLE_KEY', // typo nel tuo env
  'SUPABASE_ANON_KEY'
]);

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
  urlSource: supabaseUrl ? 'found' : 'not-found',
  keySource: supabaseAnonKey ? 'found' : 'not-found',
});

// Export sync placeholder (will be null until getSupabase is called)
export const supabase: any = null;

export default supabase;
