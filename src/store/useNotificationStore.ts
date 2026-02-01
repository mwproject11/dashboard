import { create } from 'zustand';
import CONFIG from '@/config';
import db from '@/lib/database';
import { generateId } from '@/lib/crypto';
import type { Notification, NotificationSettings } from '@/types';

// ============================================
// NOTIFICATIONS STORE
// ============================================
interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings | null;
  permission: NotificationPermission | 'default';
  
  // Actions
  loadNotifications: (userId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: (userId: string) => void;
  deleteNotification: (notificationId: string) => void;
  deleteAllNotifications: (userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getNotificationsByUser: (userId: string) => Notification[];
  getUnreadNotifications: (userId: string) => Notification[];
  
  // Settings
  loadSettings: (userId: string) => void;
  updateSettings: (userId: string, settings: Partial<NotificationSettings>) => void;
  
  // Push notifications
  requestPermission: () => Promise<NotificationPermission>;
  checkPermission: () => NotificationPermission | 'default';
  showPushNotification: (title: string, options?: NotificationOptions) => void;
  
  // Sound
  playNotificationSound: () => void;
  
  // Helpers per creare notifiche specifiche
  notifyChatMention: (userId: string, senderName: string, messagePreview: string, messageId: string) => void;
  notifyChatMessage: (userId: string, senderName: string, messagePreview: string, messageId: string) => void;
  notifyArticleApproved: (userId: string, articleTitle: string, articleId: string) => void;
  notifyArticleRejected: (userId: string, articleTitle: string, reason: string, articleId: string) => void;
  notifyArticlePublished: (userId: string, articleTitle: string, articleId: string) => void;
  notifyArticleComment: (userId: string, commenterName: string, articleTitle: string, commentPreview: string, articleId: string, commentId: string) => void;
  notifyTaskAssigned: (userId: string, taskTitle: string, assignedByName: string, taskId: string) => void;
  notifyTaskCompleted: (userId: string, taskTitle: string, completedByName: string, taskId: string) => void;
}

// Default settings
const getDefaultSettings = (userId: string): NotificationSettings => ({
  userId,
  enableDesktop: true,
  enableInApp: true,
  enableSound: true,
  notifyChatMentions: true,
  notifyChatMessages: false, // Solo menzioni di default
  notifyArticleStatus: true,
  notifyArticleComments: true,
  notifyTaskAssigned: true,
  notifyTaskCompleted: true,
  soundVolume: 0.5,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
});

// Check if currently in quiet hours
const isQuietHours = (settings: NotificationSettings): boolean => {
  if (!settings.quietHoursEnabled) return false;
  
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  
  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Crosses midnight
    return currentTime >= startTime || currentTime < endTime;
  }
};

export const useNotificationStore = create<NotificationsState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  settings: null,
  permission: 'default',

  loadNotifications: (userId: string) => {
    const allNotifications = db.get<Notification[]>(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []) || [];
    const userNotifications = allNotifications.filter(n => n.userId === userId);
    const unreadCount = userNotifications.filter(n => !n.read).length;
    
    set({ 
      notifications: userNotifications,
      unreadCount 
    });
  },

  addNotification: (notificationData) => {
    const settings = get().settings;
    
    // Check quiet hours
    if (settings && isQuietHours(settings)) {
      return;
    }

    const newNotification: Notification = {
      ...notificationData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      read: false
    };

    const allNotifications = db.get<Notification[]>(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []) || [];
    
    // Limit stored notifications per user
    const userNotifications = allNotifications.filter(n => n.userId === notificationData.userId);
    if (userNotifications.length >= CONFIG.NOTIFICATIONS.MAX_STORED) {
      // Remove oldest read notifications
      const oldestRead = userNotifications
        .filter(n => n.read)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      if (oldestRead) {
        const index = allNotifications.findIndex(n => n.id === oldestRead.id);
        if (index > -1) allNotifications.splice(index, 1);
      }
    }

    allNotifications.push(newNotification);
    db.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, allNotifications);

    // Update local state if it's for current user
    const currentNotifications = get().notifications;
    if (notificationData.userId === (currentNotifications[0]?.userId)) {
      set(state => ({
        notifications: [...state.notifications, newNotification],
        unreadCount: state.unreadCount + 1
      }));
    }

    // Show push notification if enabled
    if (settings?.enableDesktop && get().permission === 'granted') {
      get().showPushNotification(notificationData.title, {
        body: notificationData.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: newNotification.id,
        data: notificationData.data,
        requireInteraction: notificationData.priority === 'high'
      });
    }

    // Play sound if enabled
    if (settings?.enableSound) {
      get().playNotificationSound();
    }
  },

  markAsRead: (notificationId: string) => {
    const allNotifications = db.get<Notification[]>(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []) || [];
    const updated = allNotifications.map(n => 
      n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
    );
    db.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, updated);

    set(state => {
      const updatedNotifications = state.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
      );
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length
      };
    });
  },

  markAllAsRead: (userId: string) => {
    const allNotifications = db.get<Notification[]>(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []) || [];
    const updated = allNotifications.map(n => 
      n.userId === userId && !n.read 
        ? { ...n, read: true, readAt: new Date().toISOString() } 
        : n
    );
    db.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, updated);

    set(state => ({
      notifications: state.notifications.map(n => 
        !n.read ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ),
      unreadCount: 0
    }));
  },

  deleteNotification: (notificationId: string) => {
    const allNotifications = db.get<Notification[]>(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []) || [];
    const updated = allNotifications.filter(n => n.id !== notificationId);
    db.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, updated);

    set(state => {
      const updatedNotifications = state.notifications.filter(n => n.id !== notificationId);
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter(n => !n.read).length
      };
    });
  },

  deleteAllNotifications: (userId: string) => {
    const allNotifications = db.get<Notification[]>(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []) || [];
    const updated = allNotifications.filter(n => n.userId !== userId);
    db.set(CONFIG.STORAGE_KEYS.NOTIFICATIONS, updated);

    set({ notifications: [], unreadCount: 0 });
  },

  getUnreadCount: (userId: string) => {
    const allNotifications = db.get<Notification[]>(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []) || [];
    return allNotifications.filter(n => n.userId === userId && !n.read).length;
  },

  getNotificationsByUser: (userId: string) => {
    const allNotifications = db.get<Notification[]>(CONFIG.STORAGE_KEYS.NOTIFICATIONS, []) || [];
    return allNotifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getUnreadNotifications: (userId: string) => {
    return get().getNotificationsByUser(userId).filter(n => !n.read);
  },

  // Settings
  loadSettings: (userId: string) => {
    const allSettings = db.get<NotificationSettings[]>(CONFIG.STORAGE_KEYS.NOTIFICATION_SETTINGS, []) || [];
    let settings = allSettings.find(s => s.userId === userId);
    
    if (!settings) {
      settings = getDefaultSettings(userId);
      allSettings.push(settings);
      db.set(CONFIG.STORAGE_KEYS.NOTIFICATION_SETTINGS, allSettings);
    }
    
    set({ settings });
    
    // Load permission status
    const savedPermission = db.get<NotificationPermission>(CONFIG.STORAGE_KEYS.NOTIFICATION_PERMISSION, 'default');
    set({ permission: savedPermission || 'default' });
  },

  updateSettings: (userId: string, newSettings: Partial<NotificationSettings>) => {
    const allSettings = db.get<NotificationSettings[]>(CONFIG.STORAGE_KEYS.NOTIFICATION_SETTINGS, []) || [];
    const index = allSettings.findIndex(s => s.userId === userId);
    
    let updated: NotificationSettings;
    if (index >= 0) {
      updated = { ...allSettings[index], ...newSettings };
      allSettings[index] = updated;
    } else {
      updated = { ...getDefaultSettings(userId), ...newSettings };
      allSettings.push(updated);
    }
    
    db.set(CONFIG.STORAGE_KEYS.NOTIFICATION_SETTINGS, allSettings);
    set({ settings: updated });
  },

  // Push notifications
  requestPermission: async () => {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    db.set(CONFIG.STORAGE_KEYS.NOTIFICATION_PERMISSION, permission);
    set({ permission });
    return permission;
  },

  checkPermission: () => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },

  showPushNotification: (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Check if app is visible
    if (document.visibilityState === 'visible') {
      return; // Don't show push if app is in focus
    }

    try {
      new Notification(title, options);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  },

  playNotificationSound: () => {
    const settings = get().settings;
    if (!settings?.enableSound) return;

    try {
      const audio = new Audio(CONFIG.NOTIFICATIONS.DEFAULT_SOUND);
      audio.volume = settings.soundVolume;
      audio.play().catch(() => {
        // Ignore autoplay errors
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  },

  // Helper methods for specific notification types
  notifyChatMention: (userId: string, senderName: string, messagePreview: string, messageId: string) => {
    const settings = get().settings;
    if (!settings?.notifyChatMentions) return;

    get().addNotification({
      userId,
      type: 'chat_mention',
      title: `${senderName} ti ha menzionato`,
      message: messagePreview.substring(0, 100) + (messagePreview.length > 100 ? '...' : ''),
      priority: 'high',
      data: {
        senderName,
        chatMessageId: messageId,
        chatMessagePreview: messagePreview,
        url: '/chat'
      }
    });
  },

  notifyChatMessage: (userId: string, senderName: string, messagePreview: string, messageId: string) => {
    const settings = get().settings;
    if (!settings?.notifyChatMessages) return;

    get().addNotification({
      userId,
      type: 'chat_message',
      title: `Nuovo messaggio da ${senderName}`,
      message: messagePreview.substring(0, 100) + (messagePreview.length > 100 ? '...' : ''),
      priority: 'normal',
      data: {
        senderName,
        chatMessageId: messageId,
        chatMessagePreview: messagePreview,
        url: '/chat'
      }
    });
  },

  notifyArticleApproved: (userId: string, articleTitle: string, articleId: string) => {
    const settings = get().settings;
    if (!settings?.notifyArticleStatus) return;

    get().addNotification({
      userId,
      type: 'article_approved',
      title: 'Articolo approvato!',
      message: `"${articleTitle}" è stato approvato`,
      priority: 'high',
      data: {
        articleId,
        articleTitle,
        url: '/articoli'
      }
    });
  },

  notifyArticleRejected: (userId: string, articleTitle: string, reason: string, articleId: string) => {
    const settings = get().settings;
    if (!settings?.notifyArticleStatus) return;

    get().addNotification({
      userId,
      type: 'article_rejected',
      title: 'Articolo rifiutato',
      message: `"${articleTitle}" è stato rifiutato${reason ? `: ${reason}` : ''}`,
      priority: 'high',
      data: {
        articleId,
        articleTitle,
        url: '/articoli'
      }
    });
  },

  notifyArticlePublished: (userId: string, articleTitle: string, articleId: string) => {
    const settings = get().settings;
    if (!settings?.notifyArticleStatus) return;

    get().addNotification({
      userId,
      type: 'article_published',
      title: 'Articolo pubblicato!',
      message: `"${articleTitle}" è stato pubblicato`,
      priority: 'normal',
      data: {
        articleId,
        articleTitle,
        url: '/articoli'
      }
    });
  },

  notifyArticleComment: (userId: string, commenterName: string, articleTitle: string, commentPreview: string, articleId: string, commentId: string) => {
    const settings = get().settings;
    if (!settings?.notifyArticleComments) return;

    get().addNotification({
      userId,
      type: 'article_comment',
      title: `Nuovo commento su "${articleTitle}"`,
      message: `${commenterName}: ${commentPreview.substring(0, 80)}${commentPreview.length > 80 ? '...' : ''}`,
      priority: 'normal',
      data: {
        senderName: commenterName,
        articleId,
        articleTitle,
        commentId,
        commentPreview,
        url: '/articoli'
      }
    });
  },

  notifyTaskAssigned: (userId: string, taskTitle: string, assignedByName: string, taskId: string) => {
    const settings = get().settings;
    if (!settings?.notifyTaskAssigned) return;

    get().addNotification({
      userId,
      type: 'task_assigned',
      title: 'Nuovo task assegnato',
      message: `"${taskTitle}" assegnato da ${assignedByName}`,
      priority: 'high',
      data: {
        todoId: taskId,
        todoTitle: taskTitle,
        senderName: assignedByName,
        url: '/todo'
      }
    });
  },

  notifyTaskCompleted: (userId: string, taskTitle: string, completedByName: string, taskId: string) => {
    const settings = get().settings;
    if (!settings?.notifyTaskCompleted) return;

    get().addNotification({
      userId,
      type: 'task_completed',
      title: 'Task completato',
      message: `"${taskTitle}" completato da ${completedByName}`,
      priority: 'normal',
      data: {
        todoId: taskId,
        todoTitle: taskTitle,
        senderName: completedByName,
        url: '/todo'
      }
    });
  }
}));
