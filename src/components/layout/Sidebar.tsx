import { useAuthStore, useUIStore, useThemeStore, useArticlesStore, useTodoStore } from '@/store/useStore';
import CONFIG, { getShortVersion } from '@/config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { 
  LayoutDashboard,
  FileText,
  MessageSquare,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'verifica', 'scrittore'] },
  { id: 'articoli', label: 'Articoli', icon: FileText, roles: ['admin', 'verifica', 'scrittore'] },
  { id: 'chat', label: 'Chat Generale', icon: MessageSquare, roles: ['admin', 'verifica', 'scrittore'] },
  { id: 'todo', label: 'To-Do List', icon: CheckSquare, roles: ['admin', 'verifica', 'scrittore'] },
  { id: 'utenti', label: 'Gestione Utenti', icon: Users, roles: ['admin'] },
  { id: 'regolamento', label: 'Regolamento', icon: BookOpen, roles: ['admin', 'verifica', 'scrittore'] },
  { id: 'faq', label: 'FAQ', icon: HelpCircle, roles: ['admin', 'verifica', 'scrittore'] },
  { id: 'impostazioni', label: 'Impostazioni', icon: Settings, roles: ['admin', 'verifica', 'scrittore'] },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { todos } = useTodoStore();
  const { articles } = useArticlesStore();

  if (!user) return null;

  // Count pending tasks assigned to user
  const pendingTasksCount = todos.filter(
    t => t.assegnatoA === user.id && !t.completato
  ).length;

  // Count user's articles awaiting review
  const pendingArticlesCount = articles.filter(
    a => a.autoreId === user.id && (a.status === 'IN_REVISIONE' || a.status === 'BOZZA')
  ).length;

  const accessibleMenuItems = menuItems.filter(item => 
    item.roles.includes(user.ruolo)
  );

  const getInitials = (nome: string, cognome: string) => {
    return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase();
  };

  const getRoleColor = (ruolo: string) => {
    return CONFIG.ROLES[ruolo.toUpperCase() as keyof typeof CONFIG.ROLES]?.color || 'bg-gray-100';
  };

  const getRoleLabel = (ruolo: string) => {
    return CONFIG.ROLES[ruolo.toUpperCase() as keyof typeof CONFIG.ROLES]?.label || ruolo;
  };

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-0 lg:w-16 overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Newspaper className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{CONFIG.BRAND_NAME}</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400">{getShortVersion()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <NotificationCenter onNavigate={onViewChange} />
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:flex hidden">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center mx-auto gap-2">
              <NotificationCenter onNavigate={onViewChange} />
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* User info */}
        {sidebarOpen && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                  {getInitials(user.nome, user.cognome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {user.nome} {user.cognome}
                </p>
                <Badge variant="secondary" className={cn("text-xs", getRoleColor(user.ruolo))}>
                  {getRoleLabel(user.ruolo)}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {accessibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              // Get badge count for this menu item
              let badgeCount = 0;
              if (item.id === 'todo') {
                badgeCount = pendingTasksCount;
              } else if (item.id === 'articoli' && user.ruolo !== 'admin') {
                badgeCount = pendingArticlesCount;
              }
              
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors relative",
                    isActive 
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    !sidebarOpen && "justify-center px-2"
                  )}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <div className="relative">
                    <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-blue-600 dark:text-blue-400")} />
                    {badgeCount > 0 && !sidebarOpen && (
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </div>
                  {sidebarOpen && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                      {badgeCount > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs px-1.5">
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
              !sidebarOpen && "justify-center px-2"
            )}
            title={!sidebarOpen ? (isDarkMode ? 'Modalità chiara' : 'Modalità scura') : undefined}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Moon className="w-5 h-5 flex-shrink-0" />
            )}
            {sidebarOpen && (
              <span className="text-sm font-medium">
                {isDarkMode ? 'Modalità chiara' : 'Modalità scura'}
              </span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
              !sidebarOpen && "justify-center px-2"
            )}
            title={!sidebarOpen ? 'Esci' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Esci</span>}
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-30 lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </Button>
    </>
  );
}
