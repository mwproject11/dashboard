/**
 * Store Index - Entry point per tutti gli store
 * 
 * Questo file re-esporta gli store da useSupabaseStore mantenendo
 * la compatibilità con il codice esistente.
 * 
 * Se Supabase è configurato, usa il backend.
 * Altrimenti, fa fallback a localStorage.
 */

export {
  // Store principali
  useUsersStore,
  useAuthStore,
  useArticlesStore,
  useChatStore,
  useTodoStore,
  useThemeStore,
  useUIStore,
  
  // Re-export con nomi alternativi per chiarezza
  useUsersStore as useSupabaseUsersStore,
  useAuthStore as useSupabaseAuthStore,
  useArticlesStore as useSupabaseArticlesStore,
  useChatStore as useSupabaseChatStore,
  useTodoStore as useSupabaseTodoStore,
  useThemeStore as useSupabaseThemeStore,
  useUIStore as useSupabaseUIStore,
} from './useSupabaseStore';

// Notification store (rimane separato)
export { useNotificationStore } from './useNotificationStore';

// Nota: useStore.ts originale è ancora disponibile per retrocompatibilità
// ma è consigliato importare da qui per nuovo codice
