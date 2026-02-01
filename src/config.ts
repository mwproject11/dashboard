/**
 * MW_MGR - Configuration File
 * Modifica i valori qui per aggiornare tutta l'applicazione
 */

export const CONFIG = {
  // Informazioni Applicazione
  APP_NAME: 'MW_MGR',
  VERSION: '1.2.0',
  CODENAME: 'primarina',
  
  // Branding
  BRAND_NAME: 'MatteiWeekly',
  BRAND_SUBTITLE: 'Il giornalino scolastico dell\'ITIS E. Mattei',
  BRAND_LOCATION: 'San Donato Milanese (MI)',
  
  // Scuola
  SCHOOL_NAME: 'ITIS E. Mattei',
  SCHOOL_SHORT: 'ITIS Mattei',
  
  // Storage Keys (non modificare se non necessario)
  STORAGE_KEYS: {
    USERS: 'mw_mgr_users_v1',
    ARTICLES: 'mw_mgr_articles_v1',
    CHAT: 'mw_mgr_chat_v1',
    TODOS: 'mw_mgr_todos_v1',
    AUTH: 'mw_mgr_auth_v1',
    THEME: 'mw_mgr_theme_v1',
    CONFIG: 'mw_mgr_config_v1',
    NOTIFICATIONS: 'mw_mgr_notifications_v1',
    NOTIFICATION_SETTINGS: 'mw_mgr_notification_settings_v1',
    NOTIFICATION_PERMISSION: 'mw_mgr_notification_permission_v1'
  },
  
  // Security
  SECURITY: {
    MIN_PASSWORD_LENGTH: 6,
    HASH_SALT: 'mw_mgr_salt_2026', // Cambia questo per maggiore sicurezza
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 ore in ms
  },
  
  // Ruoli
  ROLES: {
    ADMIN: {
      id: 'admin',
      label: 'Amministratore',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      description: 'Accesso completo a tutte le funzionalità'
    },
    VERIFICA: {
      id: 'verifica',
      label: 'Verifica Info',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      description: 'Può approvare articoli e gestire task'
    },
    SCRITTORE: {
      id: 'scrittore',
      label: 'Scrittore',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      description: 'Può creare e modificare articoli'
    }
  },
  
  // Stati Articoli
  ARTICLE_STATUS: {
    BOZZA: { id: 'bozza', label: 'Bozza', color: 'bg-gray-100 text-gray-800' },
    IN_REVISIONE: { id: 'in_revisione', label: 'In Revisione', color: 'bg-yellow-100 text-yellow-800' },
    APPROVATO: { id: 'approvato', label: 'Approvato', color: 'bg-green-100 text-green-800' },
    RIFIUTATO: { id: 'rifiutato', label: 'Rifiutato', color: 'bg-red-100 text-red-800' },
    PUBBLICATO: { id: 'pubblicato', label: 'Pubblicato', color: 'bg-blue-100 text-blue-800' }
  },
  
  // Priorità Task
  PRIORITY: {
    BASSA: { id: 'bassa', label: 'Bassa', color: 'bg-green-100 text-green-800' },
    MEDIA: { id: 'media', label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
    ALTA: { id: 'alta', label: 'Alta', color: 'bg-red-100 text-red-800' }
  },
  
  // Categorie Articoli
  CATEGORIES: [
    { id: '1', nome: 'Attualità', descrizione: 'Notizie di attualità scolastica', colore: '#3b82f6' },
    { id: '2', nome: 'Sport', descrizione: 'Attività sportive e tornei', colore: '#22c55e' },
    { id: '3', nome: 'Cultura', descrizione: 'Eventi culturali e artistici', colore: '#a855f7' },
    { id: '4', nome: 'Tecnologia', descrizione: 'Innovazione tech e progetti', colore: '#f59e0b' },
    { id: '5', nome: 'Interviste', descrizione: 'Interviste a studenti e docenti', colore: '#ef4444' },
    { id: '6', nome: 'Progetti', descrizione: 'Progetti scolastici e laboratori', colore: '#06b6d4' }
  ],
  
  // Feature Flags
  FEATURES: {
    ENABLE_REGISTRATION: false, // Permetti registrazione nuovi utenti
    ENABLE_CHAT: true,
    ENABLE_TODO: true,
    ENABLE_DARK_MODE: true,
    ENABLE_PASSWORD_CHANGE: false,
    ENABLE_NOTIFICATIONS: true,
    ENABLE_PUSH_NOTIFICATIONS: true
  },
  
  // Notifiche
  NOTIFICATIONS: {
    MAX_STORED: 100, // Max notifiche per utente
    DEFAULT_SOUND: '/sounds/notification.mp3',
    BADGE_COLORS: {
      chat_mention: 'bg-red-500',
      chat_message: 'bg-blue-500',
      article_approved: 'bg-green-500',
      article_rejected: 'bg-red-500',
      article_published: 'bg-green-500',
      article_comment: 'bg-purple-500',
      task_assigned: 'bg-orange-500',
      task_completed: 'bg-teal-500',
      system: 'bg-gray-500'
    },
    ICONS: {
      chat_mention: 'MessageSquareWarning',
      chat_message: 'MessageSquare',
      article_approved: 'CheckCircle',
      article_rejected: 'XCircle',
      article_published: 'Newspaper',
      article_comment: 'MessageCircle',
      task_assigned: 'ClipboardList',
      task_completed: 'CheckSquare',
      system: 'Bell'
    }
  }
} as const;

// Helper per ottenere la versione formattata
export const getVersionString = () => {
  return `${CONFIG.APP_NAME} v${CONFIG.VERSION} "${CONFIG.CODENAME}"`;
};

// Helper per ottenere la versione corta
export const getShortVersion = () => {
  return `${CONFIG.APP_NAME} v${CONFIG.VERSION}`;
};

export default CONFIG;
