import { useEffect } from 'react';
import { useAuthStore, useUIStore, useThemeStore, useUsersStore } from '@/store/useStore';
import CONFIG from '@/config';
import { LoginForm } from '@/components/auth/LoginForm';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ArticlesManager } from '@/components/articles/ArticlesManager';
import { Chat } from '@/components/chat/Chat';
import { TodoList } from '@/components/todo/TodoList';
import { UsersManager } from '@/components/users/UsersManager';
import { Settings } from '@/components/settings/Settings';
import { Regolamento } from '@/components/pages/Regolamento';
import { FAQ } from '@/components/pages/FAQ';
import { cn } from '@/lib/utils';
import './App.css';

function App() {
  const { isAuthenticated, checkSession } = useAuthStore();
  const { sidebarOpen, currentView, setCurrentView } = useUIStore();
  const { isDarkMode } = useThemeStore();
  const { loadUsers } = useUsersStore();

  // Initialize app
  useEffect(() => {
    // Load users from database
    loadUsers();
    // Check existing session
    checkSession();
  }, [loadUsers, checkSession]);

  // Apply theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Update page title
  useEffect(() => {
    document.title = `${CONFIG.BRAND_NAME} - ${CONFIG.APP_NAME}`;
  }, []);

  // If not authenticated, show login
  if (!isAuthenticated) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <LoginForm />
      </div>
    );
  }

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onViewChange={setCurrentView} />;
      case 'articoli':
        return <ArticlesManager />;
      case 'chat':
        return <Chat />;
      case 'todo':
        return <TodoList />;
      case 'utenti':
        return <UsersManager />;
      case 'regolamento':
        return <Regolamento />;
      case 'faq':
        return <FAQ />;
      case 'impostazioni':
        return <Settings onViewChange={setCurrentView} />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', isDarkMode && 'dark')}>
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main 
        className={cn(
          'transition-all duration-300 min-h-screen',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        )}
      >
        {renderView()}
      </main>
    </div>
  );
}

export default App;
