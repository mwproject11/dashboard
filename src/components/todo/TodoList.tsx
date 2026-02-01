import { useState } from 'react';
import { useAuthStore, useTodoStore, useUsersStore } from '@/store/useStore';
import type { TodoItem, User } from '@/types';
import { formatDate, getPriorityColor, getRoleLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  CheckSquare, 
  Trash2, 
  Edit, 
  AlertCircle,
  Clock,
  User as UserIcon,
  Calendar,
  Filter,
  Save,
  X
} from 'lucide-react';

export function TodoList() {
  const { user } = useAuthStore();
  const { todos, addTodo, updateTodo, deleteTodo, toggleComplete } = useTodoStore();
  const { users } = useUsersStore();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'bassa' | 'media' | 'alta'>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    titolo: '',
    descrizione: '',
    assegnatoA: '',
    priorita: 'media' as 'bassa' | 'media' | 'alta'
  });

  if (!user) return null;

  const canManageTodos = user.ruolo === 'admin' || user.ruolo === 'verifica';

  // Filtra todo
  const pendingTodos = todos.filter(t => !t.completato);
  const completedTodos = todos.filter(t => t.completato);

  const filterTodos = (todoList: TodoItem[]) => {
    if (filterPriority === 'all') return todoList;
    return todoList.filter(t => t.priorita === filterPriority);
  };

  const handleAdd = () => {
    setFormData({
      titolo: '',
      descrizione: '',
      assegnatoA: '',
      priorita: 'media'
    });
    setShowAddDialog(true);
  };

  const handleEdit = (todo: TodoItem) => {
    setFormData({
      titolo: todo.titolo,
      descrizione: todo.descrizione || '',
      assegnatoA: todo.assegnatoA || '',
      priorita: todo.priorita
    });
    setEditingTodo(todo);
  };

  const getUserFullName = (userId: string) => {
    const u = users.find((u: User) => u.id === userId);
    return u ? `${u.nome} ${u.cognome}` : undefined;
  };

  const handleSave = () => {
    if (!formData.titolo.trim()) return;

    const assegnatoA = formData.assegnatoA || undefined;
    const assegnatoANome = assegnatoA ? getUserFullName(assegnatoA) : undefined;

    if (editingTodo) {
      updateTodo(editingTodo.id, {
        titolo: formData.titolo,
        descrizione: formData.descrizione,
        assegnatoA,
        assegnatoANome,
        priorita: formData.priorita
      });
      setEditingTodo(null);
    } else {
      addTodo({
        titolo: formData.titolo,
        descrizione: formData.descrizione,
        assegnatoA,
        assegnatoANome,
        priorita: formData.priorita
      }, user);
      setShowAddDialog(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo task?')) {
      deleteTodo(id);
    }
  };

  const handleToggleComplete = (todoId: string) => {
    toggleComplete(todoId, user);
  };

  const renderTodoItem = (todo: TodoItem) => (
    <div 
      key={todo.id} 
      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
        todo.completato 
          ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      <Checkbox
        checked={todo.completato}
        onCheckedChange={() => handleToggleComplete(todo.id)}
        className="mt-1"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className={`font-medium ${
              todo.completato 
                ? 'text-gray-500 dark:text-gray-400 line-through' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {todo.titolo}
            </h4>
            {todo.descrizione && (
              <p className={`text-sm mt-1 ${
                todo.completato 
                  ? 'text-gray-400 dark:text-gray-500' 
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {todo.descrizione}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={getPriorityColor(todo.priorita)}>
                {todo.priorita.charAt(0).toUpperCase() + todo.priorita.slice(1)}
              </Badge>
              
              {todo.assegnatoANome && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  {todo.assegnatoANome}
                </span>
              )}
              
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(todo.createdAt)}
              </span>
              
              {todo.completato && todo.completedAt && (
                <>
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckSquare className="w-3 h-3" />
                    Completato {formatDate(todo.completedAt)}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {canManageTodos && (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleEdit(todo)}
                className="h-8 w-8"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDelete(todo.id)}
                className="h-8 w-8 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6" />
            To-Do List
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestisci i task e le attività del team
          </p>
        </div>
        {canManageTodos && (
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Task
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Totali</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{todos.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Da fare</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingTodos.length}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completati</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedTodos.length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alta priorità</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {todos.filter(t => t.priorita === 'alta' && !t.completato).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtra per priorità" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le priorità</SelectItem>
            <SelectItem value="alta">Alta priorità</SelectItem>
            <SelectItem value="media">Media priorità</SelectItem>
            <SelectItem value="bassa">Bassa priorità</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Da Fare ({filterTodos(pendingTodos).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completati ({filterTodos(completedTodos).length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filterTodos(pendingTodos).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Nessun task in sospeso
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterTodos(pendingTodos).map(renderTodoItem)
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filterTodos(completedTodos).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Nessun task completato
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterTodos(completedTodos).map(renderTodoItem)
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingTodo} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingTodo(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTodo ? 'Modifica Task' : 'Nuovo Task'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titolo">Titolo *</Label>
              <Input
                id="titolo"
                value={formData.titolo}
                onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                placeholder="Titolo del task"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descrizione">Descrizione</Label>
              <Textarea
                id="descrizione"
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                placeholder="Descrizione opzionale"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assegnatoA">Assegna a</Label>
              <Select 
                value={formData.assegnatoA} 
                onValueChange={(v) => setFormData({ ...formData, assegnatoA: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona utente (opzionale)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessuno</SelectItem>
                  {users.filter((u) => u.isActive).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome} {u.cognome} ({getRoleLabel(u.ruolo)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priorita">Priorità</Label>
              <Select 
                value={formData.priorita} 
                onValueChange={(v) => setFormData({ ...formData, priorita: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona priorità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bassa">Bassa</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingTodo(null);
            }}>
              <X className="w-4 h-4 mr-2" />
              Annulla
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
