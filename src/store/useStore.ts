/**
 * @deprecated Questo file è mantenuto per retrocompatibilità.
 * Usa `import { ... } from '@/store'` per nuovo codice.
 * 
 * Gli store sono stati migrati a Supabase.
 * Se Supabase non è configurato, fanno automaticamente fallback a localStorage.
 */

// Re-export tutti gli store dal nuovo file Supabase
export {
  useUsersStore,
  useAuthStore,
  useArticlesStore,
  useChatStore,
  useTodoStore,
  useThemeStore,
  useUIStore,
} from './useSupabaseStore';

// Re-export notification store
export { useNotificationStore } from './useNotificationStore';

// Re-export types
export type { User } from '@/types';

// ============================================
// NOTA: La vecchia implementazione è stata rimossa.
// Il codice legacy è in ./useSupabaseStore.ts con fallback a localStorage.
// ============================================
