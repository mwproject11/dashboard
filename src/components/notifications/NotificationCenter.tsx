import { useState, useEffect } from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useStore';
import CONFIG from '@/config';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/lib/dateUtils';
import type { Notification, NotificationType } from '@/types';
import {
  Bell,
  MessageSquare,
  MessageSquareWarning,
  CheckCircle,
  XCircle,
  Newspaper,
  MessageCircle,
  ClipboardList,
  CheckSquare,
  Settings,
  Trash2,
  Check,
  X,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone,
  Moon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icon mapping for notification types
const notificationIcons: Record<NotificationType, React.ElementType> = {
  chat_mention: MessageSquareWarning,
  chat_message: MessageSquare,
  article_approved: CheckCircle,
  article_rejected: XCircle,
  article_published: Newspaper,
  article_comment: MessageCircle,
  task_assigned: ClipboardList,
  task_completed: CheckSquare,
  system: Bell
};

// Color mapping for notification types
const notificationColors: Record<NotificationType, string> = {
  chat_mention: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  chat_message: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  article_approved: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  article_rejected: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  article_published: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  article_comment: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  task_assigned: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  task_completed: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20',
  system: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20'
};

interface NotificationCenterProps {
  onNavigate?: (view: string) => void;
}

export function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    settings,
    permission,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    loadSettings,
    updateSettings,
    requestPermission,
    playNotificationSound
  } = useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications(user.id);
      loadSettings(user.id);
    }
  }, [user, loadNotifications, loadSettings]);

  // Poll for new notifications every 5 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      loadNotifications(user.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [user, loadNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate if URL is provided
    if (notification.data?.url && onNavigate) {
      const viewMap: Record<string, string> = {
        '/chat': 'chat',
        '/articoli': 'articoli',
        '/todo': 'todo'
      };
      const view = viewMap[notification.data.url];
      if (view) {
        onNavigate(view);
      }
    }

    setIsOpen(false);
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      // Show test notification
      new Notification('Notifiche attivate!', {
        body: 'Riceverai notifiche da MatteiWeekly',
        icon: '/icon-192x192.png'
      });
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const Icon = notificationIcons[type];
    return <Icon className="h-4 w-4" />;
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date));
    } catch {
      return 'recentemente';
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifiche"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="font-semibold">Notifiche</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} non lette
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => markAllAsRead(user.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Segna tutte come lette</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSettings(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Impostazioni notifiche</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {notifications.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteAllNotifications(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Elimina tutte</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Permission Banner */}
        {permission !== 'granted' && CONFIG.FEATURES.ENABLE_PUSH_NOTIFICATIONS && (
          <div className="p-3 bg-primary/5 border-b">
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="flex-1">Attiva le notifiche push</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequestPermission}
              >
                Attiva
              </Button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">Nessuna notifica</p>
              <p className="text-xs">Le tue notifiche appariranno qui</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-3 cursor-pointer hover:bg-muted/50 transition-colors group',
                    !notification.read && 'bg-primary/5'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      notificationColors[notification.type]
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm font-medium line-clamp-1',
                          !notification.read && 'text-primary'
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Priority indicator */}
                  {notification.priority === 'high' && !notification.read && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs text-red-500">Importante</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t bg-muted/50 text-center">
          <span className="text-xs text-muted-foreground">
            {CONFIG.BRAND_NAME} Notifiche
          </span>
        </div>
      </DropdownMenuContent>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Impostazioni Notifiche
            </DialogTitle>
          </DialogHeader>

          {settings && (
            <div className="space-y-6">
              {/* General Settings */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Generale
                </h4>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span className="text-sm">Notifiche desktop</span>
                  </div>
                  <Switch
                    checked={settings.enableDesktop}
                    onCheckedChange={(checked) =>
                      updateSettings(user.id, { enableDesktop: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.enableSound ? (
                      <Volume2 className="h-4 w-4" />
                    ) : (
                      <VolumeX className="h-4 w-4" />
                    )}
                    <span className="text-sm">Suono notifiche</span>
                  </div>
                  <Switch
                    checked={settings.enableSound}
                    onCheckedChange={(checked) =>
                      updateSettings(user.id, { enableSound: checked })
                    }
                  />
                </div>

                {settings.enableSound && (
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Volume</span>
                      <span className="text-xs">{Math.round(settings.soundVolume * 100)}%</span>
                    </div>
                    <Slider
                      value={[settings.soundVolume * 100]}
                      onValueChange={([value]) =>
                        updateSettings(user.id, { soundVolume: value / 100 })
                      }
                      max={100}
                      step={10}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={playNotificationSound}
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      Test suono
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t" />

              {/* Notification Types */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Tipi di notifica
                </h4>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquareWarning className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Menzioni in chat</span>
                  </div>
                  <Switch
                    checked={settings.notifyChatMentions}
                    onCheckedChange={(checked) =>
                      updateSettings(user.id, { notifyChatMentions: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Tutti i messaggi chat</span>
                  </div>
                  <Switch
                    checked={settings.notifyChatMessages}
                    onCheckedChange={(checked) =>
                      updateSettings(user.id, { notifyChatMessages: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Stato articoli</span>
                  </div>
                  <Switch
                    checked={settings.notifyArticleStatus}
                    onCheckedChange={(checked) =>
                      updateSettings(user.id, { notifyArticleStatus: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Commenti articoli</span>
                  </div>
                  <Switch
                    checked={settings.notifyArticleComments}
                    onCheckedChange={(checked) =>
                      updateSettings(user.id, { notifyArticleComments: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Task assegnati</span>
                  </div>
                  <Switch
                    checked={settings.notifyTaskAssigned}
                    onCheckedChange={(checked) =>
                      updateSettings(user.id, { notifyTaskAssigned: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-teal-500" />
                    <span className="text-sm">Task completati</span>
                  </div>
                  <Switch
                    checked={settings.notifyTaskCompleted}
                    onCheckedChange={(checked) =>
                      updateSettings(user.id, { notifyTaskCompleted: checked })
                    }
                  />
                </div>
              </div>

              <div className="border-t" />

              {/* Quiet Hours */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    Ore di silenzio
                  </div>
                </h4>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Attiva ore di silenzio</span>
                  <Switch
                    checked={settings.quietHoursEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings(user.id, { quietHoursEnabled: checked })
                    }
                  />
                </div>

                {settings.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Dalle</label>
                      <input
                        type="time"
                        value={settings.quietHoursStart}
                        onChange={(e) =>
                          updateSettings(user.id, { quietHoursStart: e.target.value })
                        }
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Alle</label>
                      <input
                        type="time"
                        value={settings.quietHoursEnd}
                        onChange={(e) =>
                          updateSettings(user.id, { quietHoursEnd: e.target.value })
                        }
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
