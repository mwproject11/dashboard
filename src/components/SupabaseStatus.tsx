/**
 * Componente per mostrare lo stato della connessione Supabase
 * Utile per debugging e per informare l'utente della modalità in uso
 */

import { useAuthStore } from '@/store';
import { Database, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  try {
    const url = import.meta.env?.VITE_SUPABASE_URL;
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    return Boolean(url && key);
  } catch {
    return false;
  }
};

export function SupabaseStatus() {
  const isConfigured = isSupabaseConfigured();
  const { isAuthenticated, user } = useAuthStore();

  if (!isConfigured) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1 cursor-help">
              <Database className="h-3 w-3" />
              <WifiOff className="h-3 w-3" />
              <span className="hidden sm:inline">Locale</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Modalità localStorage - I dati sono salvati nel browser</p>
            <p className="text-xs text-muted-foreground">
              Configura Supabase per la persistenza cloud
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={isAuthenticated ? "default" : "secondary"} 
            className="gap-1 cursor-help"
          >
            <Database className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <span className="hidden sm:inline">
              {isAuthenticated ? 'Cloud' : 'Cloud (offline)'}
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Modalità Supabase - Dati persistenti sul cloud</p>
          {isAuthenticated && user && (
            <p className="text-xs text-muted-foreground">
              Connesso come: {user.username}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SupabaseAlert() {
  const isConfigured = isSupabaseConfigured();

  if (isConfigured) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
            Modalità Locale Attiva
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            L&apos;applicazione sta usando localStorage. I dati sono salvati solo nel tuo browser
            e verranno persi se cancelli i dati di navigazione.
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
            Per attivare la persistenza cloud:
          </p>
          <ol className="text-sm text-yellow-700 dark:text-yellow-300 list-decimal list-inside mt-1 space-y-1">
            <li>Crea un progetto su <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
            <li>Configura le variabili d&apos;ambiente <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">VITE_SUPABASE_URL</code> e <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
            <li>Esegui lo schema SQL in <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">supabase/schema.sql</code></li>
          </ol>
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            Vedi <code className="font-mono">SUPABASE_SETUP.md</code> per la guida completa.
          </p>
        </div>
      </div>
    </div>
  );
}
