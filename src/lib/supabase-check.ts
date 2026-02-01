/**
 * Utility per diagnosticare la configurazione Supabase
 * Usa questo per verificare se le variabili d'ambiente sono lette correttamente
 */

// Leggi tutte le possibili variabili Supabase
const getAllSupabaseVars = () => {
  try {
    // @ts-ignore
    const env = import.meta.env || {};
    
    return {
      // URL variants
      VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_URL: env.SUPABASE_URL,
      
      // Key variants
      VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
      VITE_SUPABASESUPABASE_ANON_KEY: env.VITE_SUPABASESUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_SUPABASESUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASESUPABASE_PUBLISHABLE_KEY,
      
      // Environment info
      MODE: env.MODE,
      DEV: env.DEV,
      PROD: env.PROD,
    };
  } catch (e) {
    return { error: String(e) };
  }
};

const vars = getAllSupabaseVars();

// Trova quelle effettivamente settate
const activeUrl = vars.VITE_SUPABASE_URL || vars.NEXT_PUBLIC_SUPABASE_URL || vars.SUPABASE_URL;
const activeKey = vars.VITE_SUPABASE_ANON_KEY || vars.VITE_SUPABASESUPABASE_ANON_KEY || 
                  vars.NEXT_PUBLIC_SUPABASE_ANON_KEY || vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                  vars.VITE_SUPABASE_PUBLISHABLE_KEY || vars.VITE_SUPABASESUPABASE_PUBLISHABLE_KEY;

console.log('========== SUPABASE DIAGNOSTIC ==========');
console.log('Environment:', { MODE: vars.MODE, DEV: vars.DEV, PROD: vars.PROD });
console.log('');
console.log('URL Variables:');
console.log('  VITE_SUPABASE_URL:', vars.VITE_SUPABASE_URL ? '✓ SET (' + vars.VITE_SUPABASE_URL.substring(0, 30) + '...)' : '✗ NOT SET');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', vars.NEXT_PUBLIC_SUPABASE_URL ? '✓ SET' : '✗ NOT SET');
console.log('  SUPABASE_URL:', vars.SUPABASE_URL ? '✓ SET' : '✗ NOT SET');
console.log('');
console.log('Key Variables:');
console.log('  VITE_SUPABASE_ANON_KEY:', vars.VITE_SUPABASE_ANON_KEY ? '✓ SET (' + vars.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...)' : '✗ NOT SET');
console.log('  VITE_SUPABASESUPABASE_ANON_KEY:', vars.VITE_SUPABASESUPABASE_ANON_KEY ? '✓ SET' : '✗ NOT SET');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', vars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ SET' : '✗ NOT SET');
console.log('  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', vars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✓ SET' : '✗ NOT SET');
console.log('  VITE_SUPABASE_PUBLISHABLE_KEY:', vars.VITE_SUPABASE_PUBLISHABLE_KEY ? '✓ SET' : '✗ NOT SET');
console.log('  VITE_SUPABASESUPABASE_PUBLISHABLE_KEY:', vars.VITE_SUPABASESUPABASE_PUBLISHABLE_KEY ? '✓ SET' : '✗ NOT SET');
console.log('');
console.log('ACTIVE CONFIGURATION:');
console.log('  URL:', activeUrl ? '✓ FOUND' : '✗ NOT FOUND');
console.log('  KEY:', activeKey ? '✓ FOUND' : '✗ NOT FOUND');
console.log('  SUPABASE ENABLED:', activeUrl && activeKey ? '✓ YES' : '✗ NO - Using localStorage');
console.log('=========================================');

export { vars, activeUrl, activeKey };
export const isSupabaseActive = () => Boolean(activeUrl && activeKey);
