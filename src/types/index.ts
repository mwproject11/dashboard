import CONFIG from '@/config';

// Re-export from config for convenience
export const CATEGORIE = CONFIG.CATEGORIES;

// User types
export type UserRole = 'admin' | 'verifica' | 'scrittore';

export interface User {
  id: string;
  username: string;
  email: string;
  nome: string;
  cognome: string;
  ruolo: UserRole;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

// Article types
export type ArticleStatus = 'BOZZA' | 'IN_REVISIONE' | 'APPROVATO' | 'RIFIUTATO' | 'PUBBLICATO';

export interface Article {
  id: string;
  titolo: string;
  sottotitolo?: string;
  contenuto: string;
  autoreId: string;
  autoreNome: string;
  categoria: string;
  tags: string[];
  status: ArticleStatus;
  immagineCopertina?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  commentiVerifica: CommentoVerifica[];
}

export interface CommentoVerifica {
  id: string;
  articoloId: string;
  autoreId: string;
  autoreNome: string;
  autoreRuolo: UserRole;
  contenuto: string;
  createdAt: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  autoreId: string;
  autoreNome: string;
  autoreRuolo: UserRole;
  autoreAvatar?: string;
  contenuto: string;
  createdAt: string;
}

// Todo types
export interface TodoItem {
  id: string;
  titolo: string;
  descrizione?: string;
  assegnatoA?: string;
  assegnatoANome?: string;
  priorita: 'bassa' | 'media' | 'alta';
  completato: boolean;
  createdBy: string;
  createdByNome: string;
  createdAt: string;
  completedAt?: string;
}

// Session type
export interface Session {
  userId: string;
  token: string;
  expiresAt: number;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  nome: string;
  cognome: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export type NotificationType = 
  | 'chat_mention' 
  | 'chat_message' 
  | 'article_approved' 
  | 'article_rejected' 
  | 'article_published' 
  | 'article_comment' 
  | 'task_assigned' 
  | 'task_completed' 
  | 'system';

export type NotificationPriority = 'low' | 'normal' | 'high';

export interface Notification {
  id: string;
  userId: string; // Destinatario
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  readAt?: string;
  createdAt: string;
  // Dati aggiuntivi specifici per tipo
  data?: {
    articleId?: string;
    articleTitle?: string;
    chatMessageId?: string;
    chatMessagePreview?: string;
    todoId?: string;
    todoTitle?: string;
    commentId?: string;
    commentPreview?: string;
    senderId?: string;
    senderName?: string;
    senderAvatar?: string;
    url?: string; // Link per navigare direttamente
  };
}

export interface NotificationSettings {
  userId: string;
  // Canali di notifica
  enableDesktop: boolean;
  enableInApp: boolean;
  enableSound: boolean;
  // Tipi di notifica
  notifyChatMentions: boolean;
  notifyChatMessages: boolean;
  notifyArticleStatus: boolean;
  notifyArticleComments: boolean;
  notifyTaskAssigned: boolean;
  notifyTaskCompleted: boolean;
  // Suoni personalizzati
  soundVolume: number;
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
}
