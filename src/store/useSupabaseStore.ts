/**
 * Supabase Store - Sostituisce localStorage con backend persistente
 * 
 * Questo store utilizza Supabase per:
 * - Autenticazione (sostituisce il sistema custom di hash password)
 * - Database PostgreSQL per dati persistenti
 * - Realtime per chat e notifiche
 * - Row Level Security per protezione dati
 * 
 * Se Supabase non è configurato, fa fallback a localStorage
 */

import { create } from 'zustand';
import db from '@/lib/database';
import CONFIG from '@/config';
import type { 
  User, 
  Article, 
  ArticleStatus, 
  ChatMessage, 
  TodoItem, 
  CommentoVerifica,
} from '@/types';

// ============================================
// SUPABASE CLIENT (lazy initialization)
// ============================================
let supabaseClient: any = null;
let isSupabaseReady = false;

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

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

// Debug (rimuovi in produzione)
if (import.meta.env?.DEV) {
  console.log('[Supabase Config]', { 
    url: supabaseUrl ? '***set***' : '***missing***', 
    key: supabaseAnonKey ? '***set***' : '***missing***',
    active: hasSupabaseConfig 
  });
}

// Initialize Supabase client if possible
const initSupabase = async () => {
  if (!hasSupabaseConfig || supabaseClient) return;
  
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
        params: { eventsPerSecond: 10 },
      },
    });
    isSupabaseReady = true;
  } catch {
    supabaseClient = null;
    isSupabaseReady = false;
  }
};

// Try to init immediately (non-blocking)
if (hasSupabaseConfig) {
  initSupabase();
}

// Helper to check if we should use Supabase
const useSupabase = () => hasSupabaseConfig && isSupabaseReady && supabaseClient !== null;

// ============================================
// USERS STORE
// ============================================
interface UsersState {
  users: User[];
  isLoaded: boolean;
  
  loadUsers: () => void;
  addUser: (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserByUsername: (username: string) => User | undefined;
  getUserById: (id: string) => User | undefined;
  getUserByEmail: (email: string) => User | undefined;
  activateUser: (id: string) => void;
  deactivateUser: (id: string) => void;
}

export const useUsersStore = create<UsersState>()((set, get) => ({
  users: [],
  isLoaded: false,

  loadUsers: () => {
    if (!useSupabase()) {
      const users = db.get<User[]>(CONFIG.STORAGE_KEYS.USERS, []) || [];
      set({ users, isLoaded: true });
      return;
    }

    supabaseClient
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }: { data: any[], error: any }) => {
        if (error) {
          console.error('Error loading users:', error);
          return;
        }

        const users: User[] = (data || []).map((u: any) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          nome: u.nome,
          cognome: u.cognome,
          ruolo: u.ruolo,
          avatar: u.avatar || undefined,
          createdAt: u.created_at,
          lastLogin: u.last_login || undefined,
          isActive: u.is_active
        }));

        set({ users, isLoaded: true });
      });
  },

  addUser: async (userData, password) => {
    const { users } = get();
    
    if (users.find(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      return { success: false, error: 'Username già in uso' };
    }
    
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: 'Email già registrata' };
    }

    if (!useSupabase()) {
      // Fallback localStorage
      const newUser: User = {
        ...userData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isActive: true
      };

      const { hashPassword } = await import('@/lib/crypto');
      const hashedPassword = await hashPassword(password);
      const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
      passwords[newUser.id] = hashedPassword;
      db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);

      const updatedUsers = [...users, newUser];
      db.set(CONFIG.STORAGE_KEYS.USERS, updatedUsers);
      set({ users: updatedUsers });

      return { success: true, user: newUser };
    }

    // Supabase mode
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: userData.email,
      password: password,
      options: {
        data: {
          username: userData.username,
          nome: userData.nome,
          cognome: userData.cognome,
          ruolo: userData.ruolo
        }
      }
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Errore creazione utente' };
    }

    const newUser: User = {
      ...userData,
      id: authData.user.id,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    set({ users: [...users, newUser] });
    return { success: true, user: newUser };
  },

  updateUser: (id, updates) => {
    const { users } = get();
    const updatedUsers = users.map(u => u.id === id ? { ...u, ...updates } : u);
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.USERS, updatedUsers);
      set({ users: updatedUsers });
      return;
    }

    supabaseClient
      .from('users')
      .update({
        username: updates.username,
        email: updates.email,
        nome: updates.nome,
        cognome: updates.cognome,
        ruolo: updates.ruolo,
        avatar: updates.avatar,
        is_active: updates.isActive,
        last_login: updates.lastLogin
      })
      .eq('id', id)
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error updating user:', error);
        else set({ users: updatedUsers });
      });
  },

  deleteUser: (id) => {
    const { users } = get();
    const updatedUsers = users.filter(u => u.id !== id);
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.USERS, updatedUsers);
      const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
      delete passwords[id];
      db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);
      set({ users: updatedUsers });
      return;
    }

    supabaseClient
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error deleting user:', error);
        else set({ users: updatedUsers });
      });
  },

  getUserByUsername: (username) => {
    return get().users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  getUserById: (id) => {
    return get().users.find(u => u.id === id);
  },

  getUserByEmail: (email) => {
    return get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  activateUser: (id) => {
    get().updateUser(id, { isActive: true });
  },

  deactivateUser: (id) => {
    get().updateUser(id, { isActive: false });
  }
}));

// ============================================
// AUTH STORE
// ============================================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: { userId: string; token: string; expiresAt: number } | null;
  
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkSession: () => boolean;
  changePassword: (userId: string, oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  session: null,

  login: async (credentials) => {
    set({ isLoading: true });

    const usersStore = useUsersStore.getState();
    const user = usersStore.getUserByUsername(credentials.username);
    
    if (!user) {
      set({ isLoading: false });
      return { success: false, error: 'Utente non trovato' };
    }

    if (!user.isActive) {
      set({ isLoading: false });
      return { success: false, error: 'Account disattivato' };
    }

    if (!useSupabase()) {
      // Fallback localStorage
      const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
      const storedHash = passwords[user.id];
      
      if (!storedHash) {
        set({ isLoading: false });
        return { success: false, error: 'Password non impostata' };
      }

      const { verifyPassword } = await import('@/lib/crypto');
      const isValid = await verifyPassword(credentials.password, storedHash);
      
      if (!isValid) {
        set({ isLoading: false });
        return { success: false, error: 'Password non corretta' };
      }

      usersStore.updateUser(user.id, { lastLogin: new Date().toISOString() });

      const session = {
        userId: user.id,
        token: crypto.randomUUID(),
        expiresAt: Date.now() + CONFIG.SECURITY.SESSION_TIMEOUT
      };

      db.set(CONFIG.STORAGE_KEYS.AUTH, session);
      set({ user, isAuthenticated: true, session, isLoading: false });
      return { success: true };
    }

    // Supabase mode
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: credentials.password
    });

    if (error || !data.user) {
      set({ isLoading: false });
      return { success: false, error: error?.message || 'Credenziali non valide' };
    }

    usersStore.updateUser(user.id, { lastLogin: new Date().toISOString() });

    set({ 
      user, 
      isAuthenticated: true, 
      session: {
        userId: data.user.id,
        token: data.session?.access_token || '',
        expiresAt: Date.now() + (data.session?.expires_in || 3600) * 1000
      },
      isLoading: false 
    });

    return { success: true };
  },

  logout: () => {
    if (useSupabase()) {
      supabaseClient.auth.signOut();
    } else {
      db.remove(CONFIG.STORAGE_KEYS.AUTH);
    }
    set({ user: null, isAuthenticated: false, session: null });
  },

  checkSession: () => {
    if (!useSupabase()) {
      const session = db.get<{ userId: string; token: string; expiresAt: number }>(CONFIG.STORAGE_KEYS.AUTH, null);
      
      if (!session) return false;
      if (Date.now() > session.expiresAt) {
        get().logout();
        return false;
      }

      const usersStore = useUsersStore.getState();
      const user = usersStore.getUserById(session.userId);
      
      if (!user || !user.isActive) {
        get().logout();
        return false;
      }

      set({ user, isAuthenticated: true, session });
      return true;
    }

    // Supabase - async check
    supabaseClient.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      if (!session) {
        set({ user: null, isAuthenticated: false, session: null });
        return false;
      }
      
      const usersStore = useUsersStore.getState();
      const user = usersStore.getUserById(session.user.id);
      
      if (!user || !user.isActive) {
        set({ user: null, isAuthenticated: false, session: null });
        return false;
      }

      set({ 
        user, 
        isAuthenticated: true, 
        session: {
          userId: session.user.id,
          token: session.access_token,
          expiresAt: Date.now() + session.expires_in * 1000
        }
      });
    });

    return get().isAuthenticated;
  },

  changePassword: async (_userId, oldPassword, newPassword) => {
    if (!useSupabase()) {
      const { user } = get();
      if (!user) return { success: false, error: 'Non autenticato' };

      const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
      const storedHash = passwords[user.id];
      
      if (!storedHash) return { success: false, error: 'Utente non trovato' };

      const { verifyPassword, hashPassword } = await import('@/lib/crypto');
      const isValid = await verifyPassword(oldPassword, storedHash);
      if (!isValid) return { success: false, error: 'Password attuale non corretta' };

      passwords[user.id] = await hashPassword(newPassword);
      db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);
      return { success: true };
    }

    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  resetPassword: async (userId, newPassword) => {
    if (!useSupabase()) {
      const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
      const { hashPassword } = await import('@/lib/crypto');
      passwords[userId] = await hashPassword(newPassword);
      db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);
      return { success: true };
    }

    // Supabase admin reset requires service role key (server-side only)
    return { success: false, error: 'Funzione admin disponibile solo via API server' };
  }
}));

// ============================================
// ARTICLES STORE
// ============================================
interface ArticlesState {
  articles: Article[];
  
  addArticle: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'commentiVerifica'>) => void;
  updateArticle: (id: string, updates: Partial<Article>) => void;
  deleteArticle: (id: string) => void;
  updateStatus: (id: string, status: ArticleStatus, commento?: string, user?: User) => void;
  getArticlesByAuthor: (authorId: string) => Article[];
  getArticlesByStatus: (status: ArticleStatus) => Article[];
  getArticleById: (id: string) => Article | undefined;
  addCommento: (articoloId: string, commento: Omit<CommentoVerifica, 'id' | 'createdAt'>) => void;
}

export const useArticlesStore = create<ArticlesState>()((set, get) => ({
  articles: db.get<Article[]>(CONFIG.STORAGE_KEYS.ARTICLES, []) || [],

  addArticle: (articleData) => {
    const newArticle: Article = {
      ...articleData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commentiVerifica: []
    };
    const updated = [...get().articles, newArticle];
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
      set({ articles: updated });
      return;
    }

    supabaseClient
      .from('articles')
      .insert({
        id: newArticle.id,
        titolo: articleData.titolo,
        sottotitolo: articleData.sottotitolo,
        contenuto: articleData.contenuto,
        autore_id: articleData.autoreId,
        autore_nome: articleData.autoreNome,
        categoria: articleData.categoria,
        tags: articleData.tags,
        status: articleData.status,
        immagine_copertina: articleData.immagineCopertina,
        created_at: newArticle.createdAt,
        updated_at: newArticle.updatedAt
      })
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error adding article:', error);
        else set({ articles: updated });
      });
  },

  updateArticle: (id, updates) => {
    const updated = get().articles.map(a => 
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    );
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
      set({ articles: updated });
      return;
    }

    supabaseClient
      .from('articles')
      .update({
        titolo: updates.titolo,
        sottotitolo: updates.sottotitolo,
        contenuto: updates.contenuto,
        categoria: updates.categoria,
        tags: updates.tags,
        status: updates.status,
        immagine_copertina: updates.immagineCopertina,
        published_at: updates.publishedAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error updating article:', error);
        else set({ articles: updated });
      });
  },

  deleteArticle: (id) => {
    const updated = get().articles.filter(a => a.id !== id);
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
      set({ articles: updated });
      return;
    }

    supabaseClient
      .from('articles')
      .delete()
      .eq('id', id)
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error deleting article:', error);
        else set({ articles: updated });
      });
  },

  updateStatus: (id, status, commento, user) => {
    const article = get().articles.find(a => a.id === id);
    if (!article) return;

    const updates: Partial<Article> = { 
      status, 
      updatedAt: new Date().toISOString() 
    };
    if (status === 'PUBBLICATO') {
      updates.publishedAt = new Date().toISOString();
    }

    const updated = get().articles.map(a => {
      if (a.id === id) {
        const updatedArticle = { ...a, ...updates };
        if (commento && user) {
          const newCommento: CommentoVerifica = {
            id: crypto.randomUUID(),
            articoloId: id,
            autoreId: user.id,
            autoreNome: `${user.nome} ${user.cognome}`,
            autoreRuolo: user.ruolo,
            contenuto: commento,
            createdAt: new Date().toISOString()
          };
          updatedArticle.commentiVerifica = [...a.commentiVerifica, newCommento];
          
          // Save comment to Supabase if in cloud mode
          if (useSupabase()) {
            supabaseClient.from('article_comments').insert({
              id: newCommento.id,
              article_id: id,
              autore_id: user.id,
              autore_nome: newCommento.autoreNome,
              autore_ruolo: user.ruolo,
              contenuto: commento,
              created_at: newCommento.createdAt
            }).then(({ error }: { error: any }) => {
              if (error) console.error('Error saving comment:', error);
            });
          }
        }
        return updatedArticle;
      }
      return a;
    });
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
      set({ articles: updated });
      return;
    }

    supabaseClient
      .from('articles')
      .update({
        status,
        published_at: updates.publishedAt,
        updated_at: updates.updatedAt
      })
      .eq('id', id)
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error updating article status:', error);
        else set({ articles: updated });
      });
  },

  addCommento: (articoloId, commentoData) => {
    const newCommento: CommentoVerifica = {
      ...commentoData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    const updated = get().articles.map(a => 
      a.id === articoloId 
        ? { ...a, commentiVerifica: [...a.commentiVerifica, newCommento] }
        : a
    );
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
      set({ articles: updated });
      return;
    }

    supabaseClient
      .from('article_comments')
      .insert({
        id: newCommento.id,
        article_id: articoloId,
        autore_id: commentoData.autoreId,
        autore_nome: commentoData.autoreNome,
        autore_ruolo: commentoData.autoreRuolo,
        contenuto: commentoData.contenuto,
        created_at: newCommento.createdAt
      })
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error adding comment:', error);
        else set({ articles: updated });
      });
  },

  getArticlesByAuthor: (authorId) => {
    return get().articles.filter(a => a.autoreId === authorId);
  },

  getArticlesByStatus: (status) => {
    return get().articles.filter(a => a.status === status);
  },

  getArticleById: (id) => {
    return get().articles.find(a => a.id === id);
  }
}));

// ============================================
// CHAT STORE
// ============================================
interface ChatState {
  messages: ChatMessage[];
  addMessage: (content: string, user: User) => void;
  deleteMessage: (id: string) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: db.get<ChatMessage[]>(CONFIG.STORAGE_KEYS.CHAT, []) || [],

  addMessage: (content, user) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      autoreId: user.id,
      autoreNome: `${user.nome} ${user.cognome}`,
      autoreRuolo: user.ruolo,
      contenuto: content,
      createdAt: new Date().toISOString()
    };
    const updated = [...get().messages, newMessage];
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.CHAT, updated);
      set({ messages: updated });
      return;
    }

    supabaseClient
      .from('chat_messages')
      .insert({
        id: newMessage.id,
        autore_id: user.id,
        autore_nome: newMessage.autoreNome,
        autore_ruolo: user.ruolo,
        autore_avatar: user.avatar,
        contenuto: content,
        created_at: newMessage.createdAt
      })
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error adding message:', error);
        else set({ messages: updated });
      });
  },

  deleteMessage: (id) => {
    const updated = get().messages.filter(m => m.id !== id);
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.CHAT, updated);
      set({ messages: updated });
      return;
    }

    supabaseClient
      .from('chat_messages')
      .delete()
      .eq('id', id)
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error deleting message:', error);
        else set({ messages: updated });
      });
  }
}));

// ============================================
// TODO STORE
// ============================================
interface TodoState {
  todos: TodoItem[];
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completato' | 'completedAt' | 'createdBy' | 'createdByNome'>, user: User) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (id: string) => void;
  toggleComplete: (id: string, _user?: User) => void;
  getPendingTodos: () => TodoItem[];
  getCompletedTodos: () => TodoItem[];
}

export const useTodoStore = create<TodoState>()((set, get) => ({
  todos: db.get<TodoItem[]>(CONFIG.STORAGE_KEYS.TODOS, []) || [],

  addTodo: (todoData, user) => {
    const newTodo: TodoItem = {
      ...todoData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completato: false,
      createdBy: user.id,
      createdByNome: `${user.nome} ${user.cognome}`
    };
    const updated = [...get().todos, newTodo];
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
      set({ todos: updated });
      return;
    }

    supabaseClient
      .from('todos')
      .insert({
        id: newTodo.id,
        titolo: todoData.titolo,
        descrizione: todoData.descrizione,
        assegnato_a: todoData.assegnatoA,
        assegnato_a_nome: todoData.assegnatoANome,
        priorita: todoData.priorita,
        created_by: user.id,
        created_by_nome: newTodo.createdByNome,
        created_at: newTodo.createdAt,
        completato: false
      })
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error adding todo:', error);
        else set({ todos: updated });
      });
  },

  updateTodo: (id, updates) => {
    const updated = get().todos.map(t => t.id === id ? { ...t, ...updates } : t);
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
      set({ todos: updated });
      return;
    }

    supabaseClient
      .from('todos')
      .update({
        titolo: updates.titolo,
        descrizione: updates.descrizione,
        assegnato_a: updates.assegnatoA,
        assegnato_a_nome: updates.assegnatoANome,
        priorita: updates.priorita,
        completato: updates.completato,
        completed_at: updates.completedAt
      })
      .eq('id', id)
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error updating todo:', error);
        else set({ todos: updated });
      });
  },

  deleteTodo: (id) => {
    const updated = get().todos.filter(t => t.id !== id);
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
      set({ todos: updated });
      return;
    }

    supabaseClient
      .from('todos')
      .delete()
      .eq('id', id)
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error deleting todo:', error);
        else set({ todos: updated });
      });
  },

  toggleComplete: (id, _user) => {
    const todo = get().todos.find(t => t.id === id);
    if (!todo) return;

    const newCompletedState = !todo.completato;
    const updated = get().todos.map(t => 
      t.id === id 
        ? { 
            ...t, 
            completato: newCompletedState,
            completedAt: newCompletedState ? new Date().toISOString() : undefined
          } 
        : t
    );
    
    if (!useSupabase()) {
      db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
      set({ todos: updated });
      return;
    }

    supabaseClient
      .from('todos')
      .update({
        completato: newCompletedState,
        completed_at: newCompletedState ? new Date().toISOString() : null
      })
      .eq('id', id)
      .then(({ error }: { error: any }) => {
        if (error) console.error('Error toggling todo:', error);
        else set({ todos: updated });
      });
  },

  getPendingTodos: () => {
    return get().todos.filter(t => !t.completato);
  },

  getCompletedTodos: () => {
    return get().todos.filter(t => t.completato);
  }
}));

// ============================================
// THEME STORE (localStorage only)
// ============================================
interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  isDarkMode: db.get<boolean>(CONFIG.STORAGE_KEYS.THEME, false) || false,
  
  toggleTheme: () => set(state => {
    const newValue = !state.isDarkMode;
    db.set(CONFIG.STORAGE_KEYS.THEME, newValue);
    return { isDarkMode: newValue };
  }),
  
  setTheme: (isDark) => {
    db.set(CONFIG.STORAGE_KEYS.THEME, isDark);
    set({ isDarkMode: isDark });
  }
}));

// ============================================
// UI STORE (memory only)
// ============================================
interface UIState {
  sidebarOpen: boolean;
  currentView: string;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  currentView: 'dashboard',
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view })
}));

// Re-export for compatibility
export { useUsersStore as useSupabaseUsersStore };
export { useAuthStore as useSupabaseAuthStore };
export { useArticlesStore as useSupabaseArticlesStore };
export { useChatStore as useSupabaseChatStore };
export { useTodoStore as useSupabaseTodoStore };
export { useThemeStore as useSupabaseThemeStore };
export { useUIStore as useSupabaseUIStore };
