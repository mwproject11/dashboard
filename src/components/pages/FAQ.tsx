import { useState } from 'react';
import { useAuthStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  HelpCircle, 
  Search, 
  UserPlus, 
  FileText, 
  MessageSquare, 
  CheckSquare,
  Shield,
  Lock,
  Eye,
  Send,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: React.ElementType;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Come posso creare un nuovo articolo?',
    answer: 'Per creare un nuovo articolo, vai nella sezione "Articoli" e clicca sul pulsante "Nuovo Articolo". Compila tutti i campi richiesti (titolo, contenuto, categoria) e salva come bozza. Puoi modificare l\'articolo in qualsiasi momento prima di inviarlo in revisione.',
    category: 'Articoli',
    icon: FileText
  },
  {
    id: '2',
    question: 'Qual è il processo di approvazione degli articoli?',
    answer: 'Gli articoli seguono questo percorso: Bozza → In Revisione → Approvato → Pubblicato. Come scrittore, puoi creare bozze e inviarle in revisione. Il team di verifica esaminerà il contenuto e potrà approvarlo, rifiutarlo o richiedere modifiche attraverso i commenti. Solo l\'amministratore può pubblicare gli articoli approvati.',
    category: 'Articoli',
    icon: Eye
  },
  {
    id: '3',
    question: 'Come funziona la chat di team?',
    answer: 'La chat è uno spazio di comunicazione per tutti i membri del team MatteiWeekly. Puoi usarla per coordinarti con gli altri membri, chiedere informazioni sugli articoli o discutere idee. I messaggi sono visibili a tutti gli utenti loggati. Puoi eliminare i tuoi messaggi, e gli amministratori possono moderare la chat.',
    category: 'Comunicazione',
    icon: MessageSquare
  },
  {
    id: '4',
    question: 'Cosa è la To-Do List e come si usa?',
    answer: 'La To-Do List è uno strumento condiviso per gestire le task del team. Gli amministratori ed il team di verifica possono creare nuove task, assegnarle ai membri e impostare la priorità. Ogni utente può segnare come completati le proprie task. È utile per organizzare le attività editoriali e tenere traccia delle scadenze.',
    category: 'Organizzazione',
    icon: CheckSquare
  },
  {
    id: '5',
    question: 'Come vengono gestiti i ruoli utente?',
    answer: 'MatteiWeekly Manager ha tre livelli di accesso: Scrittori (creano articoli), Verifica (revisionano e approvano), ed Amministratori (gestione completa). Solo gli amministratori possono creare nuovi account e modificare i ruoli degli utenti esistenti. Per richiedere un cambio di ruolo, contatta un amministratore.',
    category: 'Account',
    icon: Shield
  },
  {
    id: '6',
    question: 'Posso modificare un articolo già inviato?',
    answer: 'Sì, puoi modificare i tuoi articoli finché non sono stati pubblicati. Gli articoli in stato "Bozza" o "In Revisione" possono essere modificati. Una volta approvati o pubblicati, solo gli amministratori possono apportare modifiche.',
    category: 'Articoli',
    icon: FileText
  },
  {
    id: '7',
    question: 'Come creo un nuovo utente?',
    answer: 'Solo gli amministratori possono creare nuovi utenti. Vai in "Gestione Utenti" e clicca su "Nuovo Utente". Compila i dati richiesti (nome, cognome, username, email) e seleziona il ruolo appropriato. Il nuovo utente potrà accedere immediatamente con qualsiasi password (da impostare al primo accesso).',
    category: 'Account',
    icon: UserPlus
  },
  {
    id: '8',
    question: 'Perchè il codename attuale è "primarina"?',
    answer: 'hahahah funny.',
    category: 'Piattaforma',
    icon: Sparkles
  },
  {
    id: '9',
    question: 'I miei dati sono sicuri?',
    answer: 'Sì, MatteiWeekly Manager salva tutti i dati localmente nel tuo browser utilizzando la tecnologia localStorage. Questo significa che i dati non vengono inviati a nessun server esterno. Tuttavia, ti consigliamo di non utilizzare password reali o sensibili.',
    category: 'Sicurezza',
    icon: Lock
  },
  {
    id: '10',
    question: 'Come posso cambiare il tema (chiaro/scuro)?',
    answer: 'Puoi cambiare il tema in due modi: dalla sidebar, cliccando sull\'icona sole/luna in basso, oppure dalla pagina "Impostazioni". La tua preferenza verrà salvata e applicata automaticamente ad ogni accesso.',
    category: 'Piattaforma',
    icon: Send
  },
  {
    id: '11',
    question: 'Cosa devo fare se dimentico la password?',
    answer: 'Per cambiare la tua password devi contattare un amministratore',
    category: 'Account',
    icon: Lock
  },
  {
    id: '12',
    question: 'Posso accedere a MatteiWeekly Manager da tablet/telefono?',
    answer: 'Sì! MatteiWeekly Manager è completamente responsive e funziona su smartphone, tablet e desktop. L\'interfaccia si adatta automaticamente alle dimensioni del tuo schermo per offrirti la migliore esperienza possibile.',
    category: 'Piattaforma',
    icon: Send
  }
];

export function FAQ() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>(['1']);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');

  if (!user) return null;

  const categories = ['all', ...Array.from(new Set(faqData.map(f => f.category)))];

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Articoli': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Comunicazione': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Organizzazione': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Account': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      'Piattaforma': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'Sicurezza': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-6 h-6" />
          Domande Frequenti (FAQ)
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Trova le risposte alle domande più comuni su MW_MGR e MatteiWeekly
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cerca nelle FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {cat === 'all' ? 'Tutte' : cat}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3 pr-4">
          {filteredFAQs.map(faq => {
            const Icon = faq.icon;
            const isExpanded = expandedItems.includes(faq.id);
            
            return (
              <Card 
                key={faq.id} 
                className={`transition-all ${isExpanded ? 'ring-2 ring-blue-500/20' : ''}`}
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full text-left"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getCategoryColor(faq.category)}>
                            {faq.category}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {faq.question}
                        </h3>
                      </div>
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </button>
              </Card>
            );
          })}
          
          {filteredFAQs.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Nessuna domanda trovata per la tua ricerca.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Prova con parole chiave diverse o contatta un amministratore.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Contact Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Non hai trovato la risposta che cercavi?
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                Contatta un amministratore tramite la chat di team o chiedi assistenza in sede.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
        <p>MatteiWeekly - Giornalino Scolastico ITIS E. Mattei</p>
        <p>MW_MGR v1.1 "primarina"</p>
      </div>
    </div>
  );
}
