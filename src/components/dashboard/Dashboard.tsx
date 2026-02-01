import { useAuthStore, useArticlesStore, useTodoStore } from '@/store/useStore';
import { getStatusLabel, getStatusColor, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Plus,
  MessageSquare,
  CheckSquare,
  Sparkles,
  BookOpen,
  HelpCircle
} from 'lucide-react';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

export function Dashboard({ onViewChange }: DashboardProps) {
  const { user } = useAuthStore();
  const { articles } = useArticlesStore();
  const { todos } = useTodoStore();

  if (!user) return null;

  // Statistiche
  const mieiArticoli = articles.filter(a => a.autoreId === user.id);
  const articoliBozza = mieiArticoli.filter(a => a.status === 'BOZZA');
  const articoliInRevisione = mieiArticoli.filter(a => a.status === 'IN_REVISIONE');
  const articoliApprovati = mieiArticoli.filter(a => a.status === 'APPROVATO' || a.status === 'PUBBLICATO');
  
  const mieiTodos = todos.filter(t => t.assegnatoA === user.id && !t.completato);

  // Articoli recenti
  const articoliRecenti = [...articles]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Todo ad alta priorità
  const todosPrioritari = todos
    .filter(t => !t.completato && t.priorita === 'alta')
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ciao, {user.nome}! 👋
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Benvenuto in MW_MGR, la piattaforma di MatteiWeekly
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-purple-600 dark:text-purple-400">
              Versione 1.1 "primarina"
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => onViewChange('articoli')} variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Articoli
          </Button>
          <Button onClick={() => onViewChange('articoli')}>
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Articolo
          </Button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button 
          variant="outline" 
          className="justify-start h-auto py-3"
          onClick={() => onViewChange('regolamento')}
        >
          <BookOpen className="w-4 h-4 mr-2 text-blue-600" />
          <div className="text-left">
            <p className="text-xs text-gray-500">Leggi il</p>
            <p className="text-sm font-medium">Regolamento</p>
          </div>
        </Button>
        <Button 
          variant="outline" 
          className="justify-start h-auto py-3"
          onClick={() => onViewChange('faq')}
        >
          <HelpCircle className="w-4 h-4 mr-2 text-green-600" />
          <div className="text-left">
            <p className="text-xs text-gray-500">Consulta le</p>
            <p className="text-sm font-medium">FAQ</p>
          </div>
        </Button>
        <Button 
          variant="outline" 
          className="justify-start h-auto py-3"
          onClick={() => onViewChange('chat')}
        >
          <MessageSquare className="w-4 h-4 mr-2 text-indigo-600" />
          <div className="text-left">
            <p className="text-xs text-gray-500">Entra nella</p>
            <p className="text-sm font-medium">Chat Team</p>
          </div>
        </Button>
        <Button 
          variant="outline" 
          className="justify-start h-auto py-3"
          onClick={() => onViewChange('todo')}
        >
          <CheckSquare className="w-4 h-4 mr-2 text-amber-600" />
          <div className="text-left">
            <p className="text-xs text-gray-500">Gestisci i</p>
            <p className="text-sm font-medium">Task</p>
          </div>
        </Button>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">I miei articoli</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{mieiArticoli.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In bozza</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{articoliBozza.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In revisione</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{articoliInRevisione.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pubblicati</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{articoliApprovati.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contenuto principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Articoli recenti */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Articoli Recenti</CardTitle>
              <CardDescription>Gli ultimi articoli aggiornati su MatteiWeekly</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onViewChange('articoli')}>
              Vedi tutti
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {articoliRecenti.map(articolo => (
                  <div 
                    key={articolo.id} 
                    className="flex items-start justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {articolo.titolo}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={getStatusColor(articolo.status)}>
                          {getStatusLabel(articolo.status)}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          di {articolo.autoreNome}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(articolo.updatedAt)}
                    </span>
                  </div>
                ))}
                {articoliRecenti.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Nessun articolo disponibile
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Colonna destra */}
        <div className="space-y-6">
          {/* To-Do Prioritari */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>To-Do Prioritari</CardTitle>
                <CardDescription>Task ad alta priorità</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onViewChange('todo')}>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {todosPrioritari.map(todo => (
                    <div 
                      key={todo.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                        {todo.titolo}
                      </span>
                    </div>
                  ))}
                  {mieiTodos.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Assegnati a te:
                      </p>
                      {mieiTodos.slice(0, 2).map(todo => (
                        <div 
                          key={todo.id}
                          className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white truncate flex-1">
                            {todo.titolo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {todosPrioritari.length === 0 && mieiTodos.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Nessun task prioritario
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Info MatteiWeekly */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">MatteiWeekly</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Il giornalino dell'ITIS E. Mattei
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
