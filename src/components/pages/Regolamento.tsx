import { useAuthStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Users, 
  MessageSquare, 
  AlertTriangle,
  Shield,
  Edit3,
  Eye,
  Send
} from 'lucide-react';

export function Regolamento() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Regolamento MatteiWeekly
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Linee guida e norme per la redazione del giornalino scolastico
        </p>
      </div>

      {/* Introduzione */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Benvenuto nel team del progetto MatteiWeekly!
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                MatteiWeekly è il giornalino scolastico dell'ITIS E. Mattei di San Donato Milanese. 
                Questo regolamento definisce le regole e le procedure per tutti i membri del team editoriale.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ScrollArea className="h-[600px]">
        <div className="space-y-6 pr-4">
          {/* Sezione 1: Ruoli */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                1. Ruoli e Responsabilità
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Organizzatore/Amministratore</h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Gestione completa della piattaforma MatteiWeekly Manager</li>
                    <li>Creazione e gestione degli account utente</li>
                    <li>Pubblicazione finale degli articoli approvati</li>
                    <li>Supervisione di tutte le attività editoriali</li>
                    <li>Gestione della To-Do List e assegnazione task</li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Team Verifica</h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Revisione e approvazione degli articoli</li>
                    <li>Aggiunta di commenti e suggerimenti</li>
                    <li>Verifica della correttezza delle informazioni</li>
                    <li>Gestione della To-Do List</li>
                    <li>Collaborazione nella chat di team</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Scrittori/Ruoli basic</h3>
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Proposta e stesura degli articoli</li>
                    <li>Rispetto delle scadenze editoriali</li>
                    <li>Revisione degli articoli in base ai feedback</li>
                    <li>Partecipazione alla chat di team</li>
                    <li>Completamento dei task assegnati</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sezione 2: Workflow Articoli */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                2. Workflow degli Articoli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Ogni articolo segue un percorso ben definito prima della pubblicazione:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <div className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <span className="text-xs font-medium text-center">Bozza</span>
                    <span className="text-[10px] text-gray-500 text-center">Creazione</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <span className="text-xs font-medium text-center">In Revisione</span>
                    <span className="text-[10px] text-gray-500 text-center">Verifica</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <span className="text-xs font-medium text-center">Approvato</span>
                    <span className="text-[10px] text-gray-500 text-center">Validato</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mb-2">
                      <span className="text-white text-sm font-bold">✕</span>
                    </div>
                    <span className="text-xs font-medium text-center">Rifiutato</span>
                    <span className="text-[10px] text-gray-500 text-center">Da rivedere</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                      <Send className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-center">Pubblicato</span>
                    <span className="text-[10px] text-gray-500 text-center">Online</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Bozza:</strong> Lo scrittore crea l'articolo e lo salva come bozza.</p>
                  <p><strong>In Revisione:</strong> L'articolo viene inviato al team di verifica.</p>
                  <p><strong>Approvato:</strong> Il contenuto è stato validato e approvato.</p>
                  <p><strong>Rifiutato:</strong> L'articolo necessita di modifiche significative.</p>
                  <p><strong>Pubblicato:</strong> L'articolo è visibile sul giornalino (solo Admin).</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sezione 3: Linee Guida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                3. Linee Guida per gli Articoli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">✓ Da Fare</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>Utilizzare un linguaggio chiaro e comprensibile</li>
                      <li>Verificare l'accuratezza delle informazioni</li>
                      <li>Rispettare le scadenze concordate</li>
                      <li>Citare le fonti quando necessario</li>
                      <li>Rispettare la privacy di studenti e docenti</li>
                      <li>Usare un tono appropriato e rispettoso</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">✗ Da Evitare</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>Diffondere notizie non verificate</li>
                      <li>Includere contenuti offensivi o discriminatori</li>
                      <li>Pubblicare informazioni personali senza consenso</li>
                      <li>Usare linguaggio inappropriato o gergale eccessivo</li>
                      <li>Copiare contenuti da altre fonti senza citazione</li>
                      <li>Criticare singole persone in modo personale</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sezione 4: Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                4. Utilizzo della Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                La chat è uno strumento di comunicazione per tutto il team. Usala per:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>Coordinare le attività editoriali</li>
                <li>Chiedere chiarimenti sugli articoli</li>
                <li>Condividere idee e proposte</li>
                <li>Comunicare aggiornamenti importanti</li>
              </ul>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Nota:</strong> Mantieni sempre un tono professionale e rispettoso nella chat.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sezione 5: Sanzioni */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                5. Sanzioni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                In caso di violazione del regolamento, possono essere applicate le seguenti sanzioni:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">1° Avviso</Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Richiamo verbale o scritto</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">2° Avviso</Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sospensione temporanea dalla piattaforma</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">3° Avviso</Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rimozione definitiva dal team (Esecuzione pubblica in aula docenti)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 pb-8">
            <p>MatteiWeekly - Giornalino Scolastico ITIS E. Mattei</p>
            <p>MW_MGR v1.1 "primarina"</p>
            <p className="mt-2">Ultimo aggiornamento: Gennaio 2026</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
