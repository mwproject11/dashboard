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
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import db from '@/lib/database';
import CONFIG from '@/config';
import type { 
  User, 
  Article, 
  ArticleStatus, 
  ChatMessage, 
  TodoItem, 
  CommentoVerifica,
  Notification
} from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================
// UTILITY PER FALLBACK localStorage
// ============================================
const isBackendMode = isSupabaseConfigured();

// ============================================
// USERS STORE con Supabase Auth
// ============================================
interface UsersState {
  users: User[];
  isLoaded: boolean;
  isLoading: boolean;
  
  // Actions
  loadUsers: () => Promise<void>;
  addUser: (userData: {
    email: string;
    password: string;
    username: string;
    nome: string;
    cognome: string;
    ruolo: 'admin' | 'verifica' | 'scrittore';
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserByUsername: (username: string) => User | undefined;
  getUserById: (id: string) => User | undefined;
  getUserByEmail: (email: string) => User | undefined;
  activateUser: (id: string) => Promise<void>;
  deactivateUser: (id: string) => Promise<void>;
}

export const useUsersStore = create<UsersState>()((set, get) => ({
  users: [],
  isLoaded: false,
  isLoading: false,

  loadUsers: async () => {
    if (!isBackendMode) {
      // Fallback localStorage
      const users = db.get<User[]>(CONFIG.STORAGE_KEYS.USERS, []) || [];
      set({ users, isLoaded: true });
      return;
    }

    set({ isLoading: true });
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      set({ isLoading: false });
      return;
    }

    const users: User[] = data.map(u => ({
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

    set({ users, isLoaded: true, isLoading: false });
  },

  addUser: async (userData) => {
    if (!isBackendMode) {
      // Fallback localStorage (usa vecchia implementazione)
      const { users } = get();
      
      if (users.find(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
        return { success: false, error: 'Username già in uso' };
      }
      
      if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        return { success: false, error: 'Email già registrata' };
      }

      const newUser: User = {
        ...userData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isActive: true
      };

      const { hashPassword } = await import('@/lib/crypto');
      const hashedPassword = await hashPassword(userData.password);
      const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
      passwords[newUser.id] = hashedPassword;
      db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);

      const updatedUsers = [...users, newUser];
      db.set(CONFIG.STORAGE_KEYS.USERS, updatedUsers);
      set({ users: updatedUsers });

      return { success: true, user: newUser };
    }

    // Supabase mode
    const { users } = get();
    
    if (users.find(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      return { success: false, error: 'Username già in uso' };
    }
    
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: 'Email già registrata' };
    }

    // Crea utente in Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
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
      id: authData.user.id,
      username: userData.username,
      email: userData.email,
      nome: userData.nome,
      cognome: userData.cognome,
      ruolo: userData.ruolo,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    const updatedUsers = [...users, newUser];
    set({ users: updatedUsers });

    return { success: true, user: newUser };
  },

  updateUser: async (id, updates) => {
    if (!isBackendMode) {
      const { users } = get();
      const updatedUsers = users.map(u => 
        u.id === id ? { ...u, ...updates } : u
      );
      db.set(CONFIG.STORAGE_KEYS.USERS, updatedUsers);
      set({ users: updatedUsers });
      return;
    }

    const { error } = await supabase
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
      .eq('id', id);

    if (error) {
      console.error('Error updating user:', error);
      return;
    }

    const { users } = get();
    const updatedUsers = users.map(u => 
      u.id === id ? { ...u, ...updates } : u
    );
    set({ users: updatedUsers });
  },

  deleteUser: async (id) => {
    if (!isBackendMode) {
      const { users } = get();
      const updatedUsers = users.filter(u => u.id !== id);
      db.set(CONFIG.STORAGE_KEYS.USERS, updatedUsers);
      
      const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
      delete passwords[id];
      db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);
      
      set({ users: updatedUsers });
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      return;
    }

    const { users } = get();
    set({ users: users.filter(u => u.id !== id) });
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

  activateUser: async (id) => {
    await get().updateUser(id, { isActive: true });
  },

  deactivateUser: async (id) => {
    await get().updateUser(id, { isActive: false });
  }
}));

// ============================================
// AUTH STORE con Supabase Auth
// ============================================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: { userId: string; token: string; expiresAt: number } | null;
  
  // Actions
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  session: null,

  login: async (credentials) => {
    set({ isLoading: true });

    if (!isBackendMode) {
      // Fallback localStorage
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
    const usersStore = useUsersStore.getState();
    const userByUsername = usersStore.getUserByUsername(credentials.username);
    
    if (!userByUsername) {
      set({ isLoading: false });
      return { success: false, error: 'Utente non trovato' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: userByUsername.email,
      password: credentials.password
    });

    if (error || !data.user) {
      set({ isLoading: false });
      return { success: false, error: error?.message || 'Credenziali non valide' };
    }

    // Aggiorna last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    const user: User = {
      id: data.user.id,
      username: userByUsername.username,
      email: data.user.email || '',
      nome: userByUsername.nome,
      cognome: userByUsername.cognome,
      ruolo: userByUsername.ruolo,
      avatar: userByUsername.avatar,
      createdAt: userByUsername.createdAt,
      lastLogin: new Date().toISOString(),
      isActive: true
    };

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

  logout: async () => {
    if (isBackendMode) {
      await supabase.auth.signOut();
    } else {
      db.remove(CONFIG.STORAGE_KEYS.AUTH);
    }
    set({ user: null, isAuthenticated: false, session: null });
  },

  checkSession: async () => {
    if (!isBackendMode) {
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

    // Supabase mode
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      set({ user: null, isAuthenticated: false, session: null });
      return false;
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) {
      set({ user: null, isAuthenticated: false, session: null });
      return false;
    }

    // Carica dati utente
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!userData || !userData.is_active) {
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false, session: null });
      return false;
    }

    const user: User = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      nome: userData.nome,
      cognome: userData.cognome,
      ruolo: userData.ruolo,
      avatar: userData.avatar || undefined,
      createdAt: userData.created_at,
      lastLogin: userData.last_login || undefined,
      isActive: userData.is_active
    };

    set({ 
      user, 
      isAuthenticated: true, 
      session: {
        userId: authUser.id,
        token: session.access_token,
        expiresAt: Date.now() + session.expires_in * 1000
      }
    });

    return true;
  },

  changePassword: async (oldPassword, newPassword) => {
    if (!isBackendMode) {
      const { user } = get();
      if (!user) return { success: false, error: 'Non autenticato' };

      const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
      const storedHash = passwords[user.id];
      
      if (!storedHash) {
        return { success: false, error: 'Utente non trovato' };
      }

      const { verifyPassword, hashPassword } = await import('@/lib/crypto');
      const isValid = await verifyPassword(oldPassword, storedHash);
      if (!isValid) {
        return { success: false, error: 'Password attuale non corretta' };
      }

      const newHash = await hashPassword(newPassword);
      passwords[user.id] = newHash;
      db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);

      return { success: true };
    }

    // Supabase mode
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  },

  resetPassword: async (newPassword) => {
    if (!isBackendMode) {
      return { success: false, error: 'Funzione non disponibile in modalità locale' };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }
}));

// ============================================
// ARTICLES STORE con Supabase
// ============================================
interface ArticlesState {
  articles: Article[];
  isLoading: boolean;
  realtimeChannel: RealtimeChannel | null;
  
  addArticle: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt' | 'commentiVerifica'>) => Promise<void>;
  updateArticle: (id: string, updates: Partial<Article>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  updateStatus: (id: string, status: ArticleStatus, commento?: string, user?: User) => Promise<void>;
  getArticlesByAuthor: (authorId: string) => Article[];
  getArticlesByStatus: (status: ArticleStatus) => Article[];
  getArticleById: (id: string) => Article | undefined;
  addCommento: (articoloId: string, commento: Omit<CommentoVerifica, 'id' | 'createdAt'>) => Promise<void>;
  loadArticles: () => Promise<void>;
  subscribeToArticles: () => void;
  unsubscribeFromArticles: () => void;
}

export const useArticlesStore = create<ArticlesState>()((set, get) => ({
  articles: [],
  isLoading: false,
  realtimeChannel: null,

  loadArticles: async () => {
    if (!isBackendMode) {
      const articles = db.get<Article[]>(CONFIG.STORAGE_KEYS.ARTICLES, []) || [];
      set({ articles });
      return;
    }

    set({ isLoading: true });
    
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (articlesError) {
      console.error('Error loading articles:', articlesError);
      set({ isLoading: false });
      return;
    }

    // Carica anche i commenti
    const { data: commentsData, error: commentsError } = await supabase
      .from('article_comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error loading comments:', commentsError);
    }

    const articles: Article[] = articlesData.map(a => ({
      id: a.id,
      titolo: a.titolo,
      sottotitolo: a.sottotitolo || undefined,
      contenuto: a.contenuto,
      autoreId: a.autore_id,
      autoreNome: a.autore_nome,
      categoria: a.categoria,
      tags: a.tags || [],
      status: a.status,
      immagineCopertina: a.immagine_copertina || undefined,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
      publishedAt: a.published_at || undefined,
      commentiVerifica: (commentsData || [])
        .filter(c => c.article_id === a.id)
        .map(c => ({
          id: c.id,
          articoloId: c.article_id,
          autoreId: c.autore_id,
          autoreNome: c.autore_nome,
          autoreRuolo: c.autore_ruolo,
          contenuto: c.contenuto,
          createdAt: c.created_at
        }))
    }));

    set({ articles, isLoading: false });
  },

  addArticle: async (articleData) => {
    if (!isBackendMode) {
      const newArticle: Article = {
        ...articleData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        commentiVerifica: []
      };
      const updated = [...get().articles, newArticle];
      db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
      set({ articles: updated });
      return;
    }

    const { data, error } = await supabase
      .from('articles')
      .insert({
        titolo: articleData.titolo,
        sottotitolo: articleData.sottotitolo,
        contenuto: articleData.contenuto,
        autore_id: articleData.autoreId,
        autore_nome: articleData.autoreNome,
        categoria: articleData.categoria,
        tags: articleData.tags,
        status: articleData.status,
        immagine_copertina: articleData.immagineCopertina
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding article:', error);
      return;
    }

    const newArticle: Article = {
      id: data.id,
      titolo: data.titolo,
      sottotitolo: data.sottotitolo || undefined,
      contenuto: data.contenuto,
      autoreId: data.autore_id,
      autoreNome: data.autore_nome,
      categoria: data.categoria,
      tags: data.tags || [],
      status: data.status,
      immagineCopertina: data.immagine_copertina || undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      publishedAt: data.published_at || undefined,
      commentiVerifica: []
    };

    set({ articles: [...get().articles, newArticle] });
  },

  updateArticle: async (id, updates) => {
    if (!isBackendMode) {
      const updated = get().articles.map(a => 
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      );
      db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
      set({ articles: updated });
      return;
    }

    const { error } = await supabase
      .from('articles')
      .update({
        titolo: updates.titolo,
        sottotitolo: updates.sottotitolo,
        contenuto: updates.contenuto,
        categoria: updates.categoria,
        tags: updates.tags,
        status: updates.status,
        immagine_copertina: updates.immagineCopertina,
        published_at: updates.publishedAt
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating article:', error);
      return;
    }

    const updated = get().articles.map(a => 
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    );
    set({ articles: updated });
  },

  deleteArticle: async (id) => {
    if (!isBackendMode) {
      const updated = get().articles.filter(a => a.id !== id);
      db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
      set({ articles: updated });
      return;
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting article:', error);
      return;
    }

    set({ articles: get().articles.filter(a => a.id !== id) });
  },

  updateStatus: async (id, status, commento, user) => {
    const article = get().articles.find(a => a.id === id);
    if (!article) return;

    const updates: Partial<Article> = { 
      status, 
      updatedAt: new Date().toISOString() 
    };
    if (status === 'PUBBLICATO') {
      updates.publishedAt = new Date().toISOString();
    }

    if (!isBackendMode) {
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
          }
          return updatedArticle;
        }
        return a;
      });
      
      db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
      set({ articles: updated });
      return;
    }

    // Supabase mode
    const { error } = await supabase
      .from('articles')
      .update({
        status,
        published_at: updates.publishedAt
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating article status:', error);
      return;
    }

    // Aggiungi commento se presente
    if (commento && user) {
      const { error: commentError } = await supabase
        .from('article_comments')
        .insert({
          article_id: id,
          autore_id: user.id,
          autore_nome: `${user.nome} ${user.cognome}`,
          autore_ruolo: user.ruolo,
          contenuto: commento
        });

      if (commentError) {
        console.error('Error adding comment:', commentError);
      }
    }

    // Ricarica articoli per avere i dati aggiornati
    await get().loadArticles();
  },

  addCommento: async (articoloId, commentoData) => {
    if (!isBackendMode) {
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
      db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
      set({ articles: updated });
      return;
    }

    const { error } = await supabase
      .from('article_comments')
      .insert({
        article_id: articoloId,
        autore_id: commentoData.autoreId,
        autore_nome: commentoData.autoreNome,
        autore_ruolo: commentoData.autoreRuolo,
        contenuto: commentoData.contenuto
      });

    if (error) {
      console.error('Error adding comment:', error);
      return;
    }

    await get().loadArticles();
  },

  getArticlesByAuthor: (authorId) => {
    return get().articles.filter(a => a.autoreId === authorId);
  },

  getArticlesByStatus: (status) => {
    return get().articles.filter(a => a.status === status);
  },

  getArticleById: (id) => {
    return get().articles.find(a => a.id === id);
  },

  subscribeToArticles: () => {
    if (!isBackendMode) return;

    const channel = supabase
      .channel('articles_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'articles' },
        () => {
          get().loadArticles();
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromArticles: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      set({ realtimeChannel: null });
    }
  }
}));

// ============================================
// CHAT STORE con Supabase Realtime
// ============================================
interface ChatState {
  messages: ChatMessage[];
  realtimeChannel: RealtimeChannel | null;
  isLoading: boolean;
  
  addMessage: (content: string, user: User) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  loadMessages: () => Promise<void>;
  subscribeToChat: () => void;
  unsubscribeFromChat: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  realtimeChannel: null,
  isLoading: false,

  loadMessages: async () => {
    if (!isBackendMode) {
      const messages = db.get<ChatMessage[]>(CONFIG.STORAGE_KEYS.CHAT, []) || [];
      set({ messages });
      return;
    }

    set({ isLoading: true });
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error loading chat messages:', error);
      set({ isLoading: false });
      return;
    }

    const messages: ChatMessage[] = data.map(m => ({
      id: m.id,
      autoreId: m.autore_id,
      autoreNome: m.autore_nome,
      autoreRuolo: m.autore_ruolo,
      autoreAvatar: m.autore_avatar || undefined,
      contenuto: m.contenuto,
      createdAt: m.created_at
    }));

    set({ messages, isLoading: false });
  },

  addMessage: async (content, user) => {
    if (!isBackendMode) {
      const newMessage: ChatMessage = {
        id: crypto.randomUUID(),
        autoreId: user.id,
        autoreNome: `${user.nome} ${user.cognome}`,
        autoreRuolo: user.ruolo,
        contenuto: content,
        createdAt: new Date().toISOString()
      };
      const updated = [...get().messages, newMessage];
      db.set(CONFIG.STORAGE_KEYS.CHAT, updated);
      set({ messages: updated });
      return;
    }

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        autore_id: user.id,
        autore_nome: `${user.nome} ${user.cognome}`,
        autore_ruolo: user.ruolo,
        autore_avatar: user.avatar,
        contenuto: content
      });

    if (error) {
      console.error('Error adding message:', error);
    }
  },

  deleteMessage: async (id) => {
    if (!isBackendMode) {
      const updated = get().messages.filter(m => m.id !== id);
      db.set(CONFIG.STORAGE_KEYS.CHAT, updated);
      set({ messages: updated });
      return;
    }

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting message:', error);
    }
  },

  subscribeToChat: () => {
    if (!isBackendMode) return;

    const channel = supabase
      .channel('chat_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMessage: ChatMessage = {
            id: payload.new.id,
            autoreId: payload.new.autore_id,
            autoreNome: payload.new.autore_nome,
            autoreRuolo: payload.new.autore_ruolo,
            autoreAvatar: payload.new.autore_avatar,
            contenuto: payload.new.contenuto,
            createdAt: payload.new.created_at
          };
          set({ messages: [...get().messages, newMessage] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_messages' },
        (payload) => {
          set({ messages: get().messages.filter(m => m.id !== payload.old.id) });
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromChat: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      set({ realtimeChannel: null });
    }
  }
}));

// ============================================
// TODO STORE con Supabase
// ============================================
interface TodoState {
  todos: TodoItem[];
  isLoading: boolean;
  realtimeChannel: RealtimeChannel | null;
  
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'completato' | 'completedAt' | 'createdBy' | 'createdByNome'>, user: User) => Promise<void>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleComplete: (id: string, user?: User) => Promise<void>;
  getPendingTodos: () => TodoItem[];
  getCompletedTodos: () => TodoItem[];
  loadTodos: () => Promise<void>;
  subscribeToTodos: () => void;
  unsubscribeFromTodos: () => void;
}

export const useTodoStore = create<TodoState>()((set, get) => ({
  todos: [],
  isLoading: false,
  realtimeChannel: null,

  loadTodos: async () => {
    if (!isBackendMode) {
      const todos = db.get<TodoItem[]>(CONFIG.STORAGE_KEYS.TODOS, []) || [];
      set({ todos });
      return;
    }

    set({ isLoading: true });
    
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading todos:', error);
      set({ isLoading: false });
      return;
    }

    const todos: TodoItem[] = data.map(t => ({
      id: t.id,
      titolo: t.titolo,
      descrizione: t.descrizione || undefined,
      assegnatoA: t.assegnato_a || undefined,
      assegnatoANome: t.assegnato_a_nome || undefined,
      priorita: t.priorita,
      completato: t.completato,
      createdBy: t.created_by,
      createdByNome: t.created_by_nome,
      createdAt: t.created_at,
      completedAt: t.completed_at || undefined
    }));

    set({ todos, isLoading: false });
  },

  addTodo: async (todoData, user) => {
    if (!isBackendMode) {
      const newTodo: TodoItem = {
        ...todoData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        completato: false,
        createdBy: user.id,
        createdByNome: `${user.nome} ${user.cognome}`
      };
      const updated = [...get().todos, newTodo];
      db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
      set({ todos: updated });
      return;
    }

    const { error } = await supabase
      .from('todos')
      .insert({
        titolo: todoData.titolo,
        descrizione: todoData.descrizione,
        assegnato_a: todoData.assegnatoA,
        assegnato_a_nome: todoData.assegnatoANome,
        priorita: todoData.priorita,
        created_by: user.id,
        created_by_nome: `${user.nome} ${user.cognome}`
      });

    if (error) {
      console.error('Error adding todo:', error);
    }
  },

  updateTodo: async (id, updates) => {
    if (!isBackendMode) {
      const updated = get().todos.map(t => 
        t.id === id ? { ...t, ...updates } : t
      );
      db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
      set({ todos: updated });
      return;
    }

    const { error } = await supabase
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
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
    }
  },

  deleteTodo: async (id) => {
    if (!isBackendMode) {
      const updated = get().todos.filter(t => t.id !== id);
      db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
      set({ todos: updated });
      return;
    }

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting todo:', error);
    }
  },

  toggleComplete: async (id, user) => {
    const todo = get().todos.find(t => t.id === id);
    if (!todo) return;

    const newCompletedState = !todo.completato;
    
    if (!isBackendMode) {
      const updated = get().todos.map(t => 
        t.id === id 
          ? { 
              ...t, 
              completato: newCompletedState,
              completedAt: newCompletedState ? new Date().toISOString() : undefined
            } 
          : t
      );
      db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
      set({ todos: updated });
      return;
    }

    const { error } = await supabase
      .from('todos')
      .update({
        completato: newCompletedState,
        completed_at: newCompletedState ? new Date().toISOString() : null
      })
      .eq('id', id);

    if (error) {
      console.error('Error toggling todo:', error);
    }
  },

  getPendingTodos: () => {
    return get().todos.filter(t => !t.completato);
  },

  getCompletedTodos: () => {
    return get().todos.filter(t => t.completato);
  },

  subscribeToTodos: () => {
    if (!isBackendMode) return;

    const channel = supabase
      .channel('todos_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'todos' },
        () => {
          get().loadTodos();
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromTodos: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      set({ realtimeChannel: null });
    }
  }
}));

// ============================================
// NOTIFICATIONS STORE con Supabase
// ============================================
interface NotificationsState {
  notifications: Notification[];
  isLoading: boolean;
  realtimeChannel: RealtimeChannel | null;
  
  loadNotifications: (userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  getUnreadCount: () => number;
  subscribeToNotifications: (userId: string) => void;
  unsubscribeFromNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  notifications: [],
  isLoading: false,
  realtimeChannel: null,

  loadNotifications: async (userId) => {
    if (!isBackendMode) {
      const allNotifications = db.get<Notification[]>(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []) || [];
      const userNotifications = allNotifications.filter(n => n.userId === userId);
      set({ notifications: userNotifications });
      return;
    }

    set({ isLoading: true });
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error loading notifications:', error);
      set({ isLoading: false });
      return;
    }

    const notifications: Notification[] = data.map(n => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      priority: n.priority,
      read: n.read,
      readAt: n.read_at || undefined,
      createdAt: n.created_at,
      data: n.data || undefined
    }));

    set({ notifications, isLoading: false });
  },

  markAsRead: async (id) => {
    if (!isBackendMode) {
      const updated = get().notifications.map(n => 
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
      );
      set({ notifications: updated });
      
      // Salva in localStorage
      const allNotifications = db.get<Notification[]>(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []) || [];
      const updatedAll = allNotifications.map(n => 
        n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n
      );
      db.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, updatedAll);
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async (userId) => {
    if (!isBackendMode) {
      const updated = get().notifications.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }));
      set({ notifications: updated });
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },

  deleteNotification: async (id) => {
    if (!isBackendMode) {
      const updated = get().notifications.filter(n => n.id !== id);
      set({ notifications: updated });
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
    }
  },

  getUnreadCount: () => {
    return get().notifications.filter(n => !n.read).length;
  },

  subscribeToNotifications: (userId) => {
    if (!isBackendMode) return;

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            userId: payload.new.user_id,
            type: payload.new.type,
            title: payload.new.title,
            message: payload.new.message,
            priority: payload.new.priority,
            read: payload.new.read,
            readAt: payload.new.read_at,
            createdAt: payload.new.created_at,
            data: payload.new.data
          };
          set({ notifications: [newNotification, ...get().notifications] });
        }
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  unsubscribeFromNotifications: () => {
    const { realtimeChannel } = get();
    if (realtimeChannel) {
      realtimeChannel.unsubscribe();
      set({ realtimeChannel: null });
    }
  }
}));

// ============================================
// THEME STORE (rimane su localStorage)
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
// UI STORE (rimane in memoria)
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

// Re-export per compatibilità
export { useUsersStore as useSupabaseUsersStore };
export { useAuthStore as useSupabaseAuthStore };
export { useArticlesStore as useSupabaseArticlesStore };
export { useChatStore as useSupabaseChatStore };
export { useTodoStore as useSupabaseTodoStore };
export { useNotificationsStore as useSupabaseNotificationsStore };
export { useThemeStore as useSupabaseThemeStore };
export { useUIStore as useSupabaseUIStore };
