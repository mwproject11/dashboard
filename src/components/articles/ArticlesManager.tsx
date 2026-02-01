import { useState } from 'react';
import { useAuthStore, useArticlesStore } from '@/store/useStore';
import CONFIG from '@/config';
import type { Article, ArticleStatus } from '@/types';
import { getStatusLabel, getStatusColor, formatDate, getRoleLabel } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Clock,
  Filter,
  ArrowLeft,
  Save,
  Send,
  FileText
} from 'lucide-react';

const CATEGORIE = CONFIG.CATEGORIES;

export function ArticlesManager() {
  const { user } = useAuthStore();
  const { articles, addArticle, updateArticle, deleteArticle, updateStatus, addCommento } = useArticlesStore();
  
  const [view, setView] = useState<'list' | 'edit' | 'detail'>('list');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'ALL'>('ALL');
  
  // Form state
  const [formData, setFormData] = useState({
    titolo: '',
    sottotitolo: '',
    contenuto: '',
    categoria: '',
    tags: ''
  });
  
  // Commento state
  const [newCommento, setNewCommento] = useState('');
  const [statusChangeCommento, setStatusChangeCommento] = useState('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ArticleStatus | null>(null);

  if (!user) return null;

  const canCreate = user.ruolo === 'scrittore' || user.ruolo === 'admin';
  const canVerify = user.ruolo === 'verifica' || user.ruolo === 'admin';
  const canEditAny = user.ruolo === 'admin';
  const canDelete = user.ruolo === 'admin';

  // Filtra articoli
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.contenuto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.autoreNome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setFormData({
      titolo: '',
      sottotitolo: '',
      contenuto: '',
      categoria: CATEGORIE[0]?.nome || '',
      tags: ''
    });
    setSelectedArticle(null);
    setView('edit');
  };

  const handleEdit = (article: Article) => {
    if (!canEditAny && article.autoreId !== user.id) return;
    setFormData({
      titolo: article.titolo,
      sottotitolo: article.sottotitolo || '',
      contenuto: article.contenuto,
      categoria: article.categoria,
      tags: article.tags.join(', ')
    });
    setSelectedArticle(article);
    setView('edit');
  };

  const handleView = (article: Article) => {
    setSelectedArticle(article);
    setView('detail');
  };

  const handleSave = () => {
    if (!formData.titolo.trim() || !formData.contenuto.trim()) return;

    const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t);
    
    if (selectedArticle) {
      updateArticle(selectedArticle.id, {
        ...formData,
        tags
      });
    } else {
      addArticle({
        ...formData,
        autoreId: user.id,
        autoreNome: `${user.nome} ${user.cognome}`,
        tags,
        status: 'BOZZA'
      });
    }
    setView('list');
  };

  const handleDelete = (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo articolo?')) {
      deleteArticle(id);
    }
  };

  const handleStatusChange = (newStatus: ArticleStatus) => {
    if (!selectedArticle) return;
    setPendingStatus(newStatus);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = () => {
    if (selectedArticle && pendingStatus) {
      updateStatus(selectedArticle.id, pendingStatus, statusChangeCommento || undefined, user);
      setShowStatusDialog(false);
      setStatusChangeCommento('');
      setPendingStatus(null);
      // Refresh selected article
      const updated = useArticlesStore.getState().getArticleById(selectedArticle.id);
      if (updated) setSelectedArticle(updated);
    }
  };

  const handleAddCommento = () => {
    if (!selectedArticle || !newCommento.trim()) return;
    
    addCommento(selectedArticle.id, {
      articoloId: selectedArticle.id,
      autoreId: user.id,
      autoreNome: `${user.nome} ${user.cognome}`,
      autoreRuolo: user.ruolo,
      contenuto: newCommento
    });
    
    setNewCommento('');
    // Refresh selected article
    const updated = useArticlesStore.getState().getArticleById(selectedArticle.id);
    if (updated) setSelectedArticle(updated);
  };

  // Vista Lista
  if (view === 'list') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestione Articoli</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Crea, modifica e gestisci gli articoli di {CONFIG.BRAND_NAME}
            </p>
          </div>
          {canCreate && (
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nuovo Articolo
            </Button>
          )}
        </div>

        {/* Filtri */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cerca articoli..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ArticleStatus | 'ALL')}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti gli stati</SelectItem>
                  <SelectItem value="BOZZA">Bozza</SelectItem>
                  <SelectItem value="IN_REVISIONE">In Revisione</SelectItem>
                  <SelectItem value="APPROVATO">Approvato</SelectItem>
                  <SelectItem value="RIFIUTATO">Rifiutato</SelectItem>
                  <SelectItem value="PUBBLICATO">Pubblicato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista articoli */}
        <div className="grid gap-4">
          {filteredArticles.map(article => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(article.status)}>
                        {getStatusLabel(article.status)}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {article.categoria}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {article.titolo}
                    </h3>
                    {article.sottotitolo && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {article.sottotitolo}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>di {article.autoreNome}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(article.updatedAt)}
                      </span>
                      {article.commentiVerifica.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {article.commentiVerifica.length} commenti
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleView(article)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {(canEditAny || article.autoreId === user.id) && article.status !== 'PUBBLICATO' && (
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(article)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredArticles.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nessun articolo trovato
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Vista Edit
  if (view === 'edit') {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setView('list')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedArticle ? 'Modifica Articolo' : 'Nuovo Articolo'}
          </h1>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titolo">Titolo *</Label>
              <Input
                id="titolo"
                value={formData.titolo}
                onChange={(e) => setFormData({ ...formData, titolo: e.target.value })}
                placeholder="Inserisci il titolo dell'articolo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sottotitolo">Sottotitolo</Label>
              <Input
                id="sottotitolo"
                value={formData.sottotitolo}
                onChange={(e) => setFormData({ ...formData, sottotitolo: e.target.value })}
                placeholder="Inserisci un sottotitolo (opzionale)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(v) => setFormData({ ...formData, categoria: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIE.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nome}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separati da virgola)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="es. sport, calcio, torneo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contenuto">Contenuto *</Label>
              <Textarea
                id="contenuto"
                value={formData.contenuto}
                onChange={(e) => setFormData({ ...formData, contenuto: e.target.value })}
                placeholder="Scrivi il contenuto dell'articolo..."
                rows={15}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setView('list')}>
                Annulla
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Salva
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista Dettaglio
  if (view === 'detail' && selectedArticle) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setView('list')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          <div className="flex gap-2">
            {(canEditAny || selectedArticle.autoreId === user.id) && selectedArticle.status !== 'PUBBLICATO' && (
              <Button variant="outline" onClick={() => handleEdit(selectedArticle)}>
                <Edit className="w-4 h-4 mr-2" />
                Modifica
              </Button>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStatusColor(selectedArticle.status)}>
                {getStatusLabel(selectedArticle.status)}
              </Badge>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedArticle.categoria}
              </span>
            </div>
            <CardTitle className="text-2xl">{selectedArticle.titolo}</CardTitle>
            {selectedArticle.sottotitolo && (
              <CardDescription className="text-lg">{selectedArticle.sottotitolo}</CardDescription>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
              <span>di {selectedArticle.autoreNome}</span>
              <span>•</span>
              <span>Ultima modifica: {formatDate(selectedArticle.updatedAt)}</span>
              {selectedArticle.publishedAt && (
                <>
                  <span>•</span>
                  <span>Pubblicato: {formatDate(selectedArticle.publishedAt)}</span>
                </>
              )}
            </div>
            {selectedArticle.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedArticle.tags.map((tag, i) => (
                  <Badge key={i} variant="outline">#{tag}</Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{selectedArticle.contenuto}</p>
            </div>
          </CardContent>
        </Card>

        {/* Azioni di verifica */}
        {canVerify && selectedArticle.status !== 'PUBBLICATO' && (
          <Card>
            <CardHeader>
              <CardTitle>Azioni di Verifica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedArticle.status === 'BOZZA' && (
                  <Button onClick={() => handleStatusChange('IN_REVISIONE')}>
                    <Send className="w-4 h-4 mr-2" />
                    Invia in Revisione
                  </Button>
                )}
                {(selectedArticle.status === 'IN_REVISIONE' || selectedArticle.status === 'BOZZA') && (
                  <>
                    <Button variant="default" onClick={() => handleStatusChange('APPROVATO')} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approva
                    </Button>
                    <Button variant="destructive" onClick={() => handleStatusChange('RIFIUTATO')}>
                      <XCircle className="w-4 h-4 mr-2" />
                      Rifiuta
                    </Button>
                  </>
                )}
                {selectedArticle.status === 'APPROVATO' && user.ruolo === 'admin' && (
                  <Button onClick={() => handleStatusChange('PUBBLICATO')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Pubblica
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commenti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Commenti ({selectedArticle.commentiVerifica.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px] mb-4">
              <div className="space-y-4">
                {selectedArticle.commentiVerifica.map(commento => (
                  <div key={commento.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {commento.autoreNome}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getRoleLabel(commento.autoreRuolo)}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(commento.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{commento.contenuto}</p>
                  </div>
                ))}
                {selectedArticle.commentiVerifica.length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Nessun commento
                  </p>
                )}
              </div>
            </ScrollArea>
            
            {canVerify && (
              <div className="flex gap-2">
                <Textarea
                  value={newCommento}
                  onChange={(e) => setNewCommento(e.target.value)}
                  placeholder="Aggiungi un commento..."
                  className="flex-1"
                  rows={2}
                />
                <Button onClick={handleAddCommento} className="self-end">
                  Invia
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog cambio stato */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conferma cambio stato</DialogTitle>
              <DialogDescription>
                Stai per cambiare lo stato in "{pendingStatus && getStatusLabel(pendingStatus)}". 
                Vuoi aggiungere un commento?
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={statusChangeCommento}
              onChange={(e) => setStatusChangeCommento(e.target.value)}
              placeholder="Commento opzionale..."
              rows={3}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                Annulla
              </Button>
              <Button onClick={confirmStatusChange}>
                Conferma
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
