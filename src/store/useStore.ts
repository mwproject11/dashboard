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
// LEGACY IMPLEMENTATION (mantenuta per riferimento)
// ============================================
// Il codice seguente è stato migrato a useSupabaseStore.ts
// e mantiene la stessa API per retrocompatibilità.

// Importa implementazione legacy solo se necessario
import { create } from 'zustand';
import CONFIG from '@/config';
import db from '@/lib/database';
import { hashPassword, verifyPassword, generateId, generateSessionToken } from '@/lib/crypto';
import { useNotificationStore } from './useNotificationStore';
import type { 
  User, 
  Article, 
  ArticleStatus, 
  ChatMessage, 
  TodoItem, 
  CommentoVerifica,
  Session,
  LoginCredentials
} from '@/types';

// ============================================
// USERS STORE - Gestione utenti persistente
// ============================================
interface UsersState {
  users: User[];
  isLoaded: boolean;
  
  // Actions
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

// Password store type
interface PasswordStore {
  [userId: string]: string;
}

export const useUsersStore = create<UsersState>()((set, get) => ({
  users: [],
  isLoaded: false,

  loadUsers: () => {
    const users = db.get<User[]>(CONFIG.STORAGE_KEYS.USERS, []) || [];
    set({ users, isLoaded: true });
  },

  addUser: async (userData, password) => {
    const { users } = get();
    
    // Check if username exists
    if (users.find(u => u.username.toLowerCase() === userData.username.toLowerCase())) {
      return { success: false, error: 'Username già in uso' };
    }
    
    // Check if email exists
    if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
      return { success: false, error: 'Email già registrata' };
    }

    const newUser: User = {
      ...userData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // Hash and store password
    const hashedPassword = await hashPassword(password);
    const passwords = db.get<PasswordStore>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
    passwords[newUser.id] = hashedPassword;
    db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);

    // Save user
    const updatedUsers = [...users, newUser];
    db.set(CONFIG.STORAGE_KEYS.USERS, updatedUsers);
    set({ users: updatedUsers });

    return { success: true, user: newUser };
  },

  updateUser: (id, updates) => {
    const { users } = get();
    const updatedUsers = users.map(u => 
      u.id === id ? { ...u, ...updates } : u
    );
    db.set(CONFIG.STORAGE_KEYS.USERS, updatedUsers);
    set({ users: updatedUsers });
  },

  deleteUser: (id) => {
    const { users } = get();
    const updatedUsers = users.filter(u => u.id !== id);
    db.set(CONFIG.STORAGE_KEYS.USERS, updatedUsers);
    
    // Also delete password
    const passwords = db.get<PasswordStore>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
    delete passwords[id];
    db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);
    
    set({ users: updatedUsers });
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
// AUTH STORE - Autenticazione
// ============================================
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
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

    const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
    const storedHash = passwords[user.id];
    
    if (!storedHash) {
      set({ isLoading: false });
      return { success: false, error: 'Password non impostata' };
    }

    const isValid = await verifyPassword(credentials.password, storedHash);
    
    if (!isValid) {
      set({ isLoading: false });
      return { success: false, error: 'Password non corretta' };
    }

    // Update last login
    usersStore.updateUser(user.id, { lastLogin: new Date().toISOString() });

    // Create session
    const session: Session = {
      userId: user.id,
      token: generateSessionToken(),
      expiresAt: Date.now() + CONFIG.SECURITY.SESSION_TIMEOUT
    };

    db.set(CONFIG.STORAGE_KEYS.AUTH, session);
    
    set({ 
      user, 
      isAuthenticated: true, 
      session,
      isLoading: false 
    });

    return { success: true };
  },

  logout: () => {
    db.remove(CONFIG.STORAGE_KEYS.AUTH);
    set({ user: null, isAuthenticated: false, session: null });
  },

  checkSession: () => {
    const session = db.get<Session>(CONFIG.STORAGE_KEYS.AUTH, null);
    
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
  },

  changePassword: async (userId, oldPassword, newPassword) => {
    const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
    const storedHash = passwords[userId];
    
    if (!storedHash) {
      return { success: false, error: 'Utente non trovato' };
    }

    const isValid = await verifyPassword(oldPassword, storedHash);
    if (!isValid) {
      return { success: false, error: 'Password attuale non corretta' };
    }

    const newHash = await hashPassword(newPassword);
    passwords[userId] = newHash;
    db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);

    return { success: true };
  },

  resetPassword: async (userId, newPassword) => {
    const passwords = db.get<Record<string, string>>(CONFIG.STORAGE_KEYS.USERS + '_pwd', {}) || {};
    const newHash = await hashPassword(newPassword);
    passwords[userId] = newHash;
    db.set(CONFIG.STORAGE_KEYS.USERS + '_pwd', passwords);
    return { success: true };
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
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      commentiVerifica: []
    };
    const updated = [...get().articles, newArticle];
    db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
    set({ articles: updated });
  },

  updateArticle: (id, updates) => {
    const updated = get().articles.map(a => 
      a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
    );
    db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
    set({ articles: updated });
  },

  deleteArticle: (id) => {
    const updated = get().articles.filter(a => a.id !== id);
    db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
    set({ articles: updated });
  },

  updateStatus: (id, status, commento, user) => {
    const updates: Partial<Article> = { 
      status, 
      updatedAt: new Date().toISOString() 
    };
    if (status === 'PUBBLICATO') {
      updates.publishedAt = new Date().toISOString();
    }
    
    const article = get().articles.find(a => a.id === id);
    const notificationStore = useNotificationStore.getState();
    
    const updated = get().articles.map(a => {
      if (a.id === id) {
        const updatedArticle = { ...a, ...updates };
        if (commento && user) {
          const newCommento: CommentoVerifica = {
            id: generateId(),
            articoloId: id,
            autoreId: user.id,
            autoreNome: `${user.nome} ${user.cognome}`,
            autoreRuolo: user.ruolo,
            contenuto: commento,
            createdAt: new Date().toISOString()
          };
          updatedArticle.commentiVerifica = [...a.commentiVerifica, newCommento];
          
          // Notify article author about new comment
          if (a.autoreId !== user.id) {
            notificationStore.notifyArticleComment(
              a.autoreId,
              `${user.nome} ${user.cognome}`,
              a.titolo,
              commento,
              a.id,
              newCommento.id
            );
          }
        }
        return updatedArticle;
      }
      return a;
    });
    
    db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
    set({ articles: updated });

    // Send notifications for status changes
    if (article && user && article.autoreId !== user.id) {
      switch (status) {
        case 'APPROVATO':
          notificationStore.notifyArticleApproved(article.autoreId, article.titolo, article.id);
          break;
        case 'RIFIUTATO':
          notificationStore.notifyArticleRejected(article.autoreId, article.titolo, commento || '', article.id);
          break;
        case 'PUBBLICATO':
          notificationStore.notifyArticlePublished(article.autoreId, article.titolo, article.id);
          break;
      }
    }
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

  addCommento: (articoloId, commentoData) => {
    const newCommento: CommentoVerifica = {
      ...commentoData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    const updated = get().articles.map(a => 
      a.id === articoloId 
        ? { ...a, commentiVerifica: [...a.commentiVerifica, newCommento] }
        : a
    );
    db.set(CONFIG.STORAGE_KEYS.ARTICLES, updated);
    set({ articles: updated });
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
      id: generateId(),
      autoreId: user.id,
      autoreNome: `${user.nome} ${user.cognome}`,
      autoreRuolo: user.ruolo,
      contenuto: content,
      createdAt: new Date().toISOString()
    };
    const updated = [...get().messages, newMessage];
    db.set(CONFIG.STORAGE_KEYS.CHAT, updated);
    set({ messages: updated });

    // Check for mentions and send notifications
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    
    if (mentions) {
      const usersStore = useUsersStore.getState();
      const notificationStore = useNotificationStore.getState();
      
      mentions.forEach(mention => {
        const username = mention.substring(1); // Remove @
        const mentionedUser = usersStore.getUserByUsername(username);
        
        if (mentionedUser && mentionedUser.id !== user.id) {
          notificationStore.notifyChatMention(
            mentionedUser.id,
            `${user.nome} ${user.cognome}`,
            content,
            newMessage.id
          );
        }
      });
    }
  },

  deleteMessage: (id) => {
    const updated = get().messages.filter(m => m.id !== id);
    db.set(CONFIG.STORAGE_KEYS.CHAT, updated);
    set({ messages: updated });
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
  toggleComplete: (id: string, user?: User) => void;
  getPendingTodos: () => TodoItem[];
  getCompletedTodos: () => TodoItem[];
}

export const useTodoStore = create<TodoState>()((set, get) => ({
  todos: db.get<TodoItem[]>(CONFIG.STORAGE_KEYS.TODOS, []) || [],

  addTodo: (todoData, user) => {
    const newTodo: TodoItem = {
      ...todoData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      completato: false,
      createdBy: user.id,
      createdByNome: `${user.nome} ${user.cognome}`
    };
    const updated = [...get().todos, newTodo];
    db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
    set({ todos: updated });

    // Notify assigned user
    if (todoData.assegnatoA && todoData.assegnatoA !== user.id) {
      const notificationStore = useNotificationStore.getState();
      notificationStore.notifyTaskAssigned(
        todoData.assegnatoA,
        todoData.titolo,
        `${user.nome} ${user.cognome}`,
        newTodo.id
      );
    }
  },

  updateTodo: (id, updates) => {
    const updated = get().todos.map(t => 
      t.id === id ? { ...t, ...updates } : t
    );
    db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
    set({ todos: updated });
  },

  deleteTodo: (id) => {
    const updated = get().todos.filter(t => t.id !== id);
    db.set(CONFIG.STORAGE_KEYS.TODOS, updated);
    set({ todos: updated });
  },

  toggleComplete: (id: string, user?: User) => {
    const todo = get().todos.find(t => t.id === id);
    const newCompletedState = !todo?.completato;
    
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

    // Notify task creator when completed
    if (todo && newCompletedState && user && todo.createdBy !== user.id) {
      const notificationStore = useNotificationStore.getState();
      notificationStore.notifyTaskCompleted(
        todo.createdBy,
        todo.titolo,
        `${user.nome} ${user.cognome}`,
        todo.id
      );
    }
  },

  getPendingTodos: () => {
    return get().todos.filter(t => !t.completato);
  },

  getCompletedTodos: () => {
    return get().todos.filter(t => t.completato);
  }
}));

// ============================================
// THEME STORE
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
// UI STORE
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

// Re-export notification store for convenience
export { useNotificationStore } from './useNotificationStore';
