import { useAuthStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Key,
  Info
} from 'lucide-react';

export function CreaUtenti() {
  const { user } = useAuthStore();

  if (!user) return null;

  const isAdmin = user.ruolo === 'admin';

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserPlus className="w-6 h-6" />
          Guida: Creazione Nuovi Utenti
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Istruzioni per aggiungere nuovi membri al team MatteiWeekly
        </p>
      </div>

      {/* Alert per non-admin */}
      {!isAdmin && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Attenzione:</strong> Solo gli amministratori possono creare nuovi utenti. 
            Se hai bisogno di un nuovo account, contatta un amministratore.
          </AlertDescription>
        </Alert>
      )}

      {/* Metodo 1: Per Admin */}
      <Card className={isAdmin ? 'border-green-200 dark:border-green-800' : 'opacity-75'}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>Metodo 1: Dalla Gestione Utenti</CardTitle>
              <CardDescription>Per Amministratori</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Accedi alla sezione <strong>"Gestione Utenti"</strong> dalla sidebar
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Clicca sul pulsante <strong>"Nuovo Utente"</strong> in alto a destra
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Compila i campi richiesti: <strong>Nome, Cognome, Username, Email</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">4</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Seleziona il <strong>Ruolo</strong> appropriato (Scrittore, Verifica o Admin)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">5</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Clicca <strong>"Salva"</strong> e il nuovo utente sarà immediatamente attivo
              </p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Nota sulla password
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  In questa versione demo, il nuovo utente può accedere con <strong>qualsiasi password</strong>. 
                  In un sistema reale, verrebbe generata una password temporanea o inviata via email.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metodo 2: Modifica diretta codice */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle>Metodo 2: Modifica del Codice</CardTitle>
              <CardDescription>Per Sviluppatori</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Se hai accesso al codice sorgente, puoi aggiungere utenti direttamente nel file <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">src/types/index.ts</code>:
          </p>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`export const MOCK_USERS: User[] = [
  // ... utenti esistenti ...
  {
    id: '5',  // ID univoco
    username: 'nuovoutente',
    email: 'nuovo@itismattei.edu.it',
    nome: 'Nome',
    cognome: 'Cognome',
    ruolo: 'scrittore',  // 'scrittore', 'verifica' o 'admin'
    createdAt: '2026-01-31T10:00:00Z'
  },
];`}
            </pre>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Attenzione
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Dopo la modifica del codice, è necessario ricompilare e ridistribuire l'applicazione.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ruoli spiegati */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Ruoli Disponibili
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-100 text-blue-800">Scrittore</Badge>
              </div>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>✓ Crea articoli</li>
                <li>✓ Modifica propri articoli</li>
                <li>✓ Visualizza chat</li>
                <li>✓ Completa task assegnati</li>
                <li>✗ Approva articoli</li>
                <li>✗ Gestisce utenti</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-amber-100 text-amber-800">Verifica</Badge>
              </div>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>✓ Tutto da Scrittore</li>
                <li>✓ Approva/rifiuta articoli</li>
                <li>✓ Aggiunge commenti</li>
                <li>✓ Gestisce To-Do List</li>
                <li>✗ Pubblica articoli</li>
                <li>✗ Gestisce utenti</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
              </div>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>✓ Tutti i permessi</li>
                <li>✓ Pubblica articoli</li>
                <li>✓ Crea/elimina utenti</li>
                <li>✓ Gestisce ruoli</li>
                <li>✓ Moderazione chat</li>
                <li>✓ Amministrazione completa</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Usa email istituzionali</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Preferisci indirizzi @itismattei.edu.it per gli studenti e docenti</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Username descrittivi</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Usa formato nome.cognome o iniziali (es. mario.rossi, m.rossi)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Assegna ruoli appropriati</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Non dare privilegi admin a utenti che non ne hanno bisogno</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Documenta le modifiche</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tieni traccia di chi crea nuovi account e perché</p>
              </div>
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
