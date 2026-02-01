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
  useNotificationsStore,
  useThemeStore,
  useUIStore,
  
  // Re-export con nomi alternativi per chiarezza
  useUsersStore as useSupabaseUsersStore,
  useAuthStore as useSupabaseAuthStore,
  useArticlesStore as useSupabaseArticlesStore,
  useChatStore as useSupabaseChatStore,
  useTodoStore as useSupabaseTodoStore,
  useNotificationsStore as useSupabaseNotificationsStore,
  useThemeStore as useSupabaseThemeStore,
  useUIStore as useSupabaseUIStore,
} from './useSupabaseStore';

// Re-export vecchi store per retrocompatibilità (verranno rimossi in futuro)
// Questi import mantengono il codice esistente funzionante
export { useNotificationStore } from './useNotificationStore';

// Nota: useStore.ts originale è ancora disponibile per retrocompatibilità
// ma è consigliato importare da qui per nuovo codice
