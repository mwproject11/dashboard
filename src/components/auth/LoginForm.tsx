import { useState, useEffect } from 'react';
import { useAuthStore, useUsersStore } from '@/store/useStore';
import CONFIG, { getVersionString } from '@/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent} from '@/components/ui/tabs';
import { Newspaper, Eye, EyeOff, Lock, User, Sparkles, UserPlus } from 'lucide-react';
import { validatePassword } from '@/lib/crypto';

export function LoginForm() {
  // Load users on mount
  useEffect(() => {
    useUsersStore.getState().loadUsers();
  }, []);

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Register state
  const [regData, setRegData] = useState({
    nome: '',
    cognome: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

  const login = useAuthStore(state => state.login);
  const addUser = useUsersStore(state => state.addUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login({ username, password });
    
    if (!result.success) {
      setError(result.error || 'Credenziali non valide');
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    setIsRegLoading(true);

    // Validation
    if (!regData.nome || !regData.cognome || !regData.username || !regData.email || !regData.password) {
      setRegError('Tutti i campi sono obbligatori');
      setIsRegLoading(false);
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setRegError('Le password non coincidono');
      setIsRegLoading(false);
      return;
    }

    const passwordCheck = validatePassword(regData.password);
    if (!passwordCheck.valid) {
      setRegError(passwordCheck.errors.join(', '));
      setIsRegLoading(false);
      return;
    }

    // Create user (default role: scrittore)
    const result = await addUser({
      username: regData.username,
      email: regData.email,
      nome: regData.nome,
      cognome: regData.cognome,
      ruolo: 'scrittore'
    }, regData.password);

    if (result.success) {
      setRegSuccess('Account creato con successo! Ora puoi accedere.');
      setRegData({
        nome: '',
        cognome: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } else {
      setRegError(result.error || 'Errore durante la registrazione');
    }

    setIsRegLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Newspaper className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {CONFIG.BRAND_NAME}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {CONFIG.BRAND_SUBTITLE}
            </CardDescription>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {getVersionString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            {/*<TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="register">Registrati</TabsTrigger>
            </TabsList>*/}

            {/* LOGIN TAB */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Inserisci username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Inserisci password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </Button>
              </form>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-3">
                {regError && (
                  <Alert variant="destructive">
                    <AlertDescription>{regError}</AlertDescription>
                  </Alert>
                )}
                {regSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">{regSuccess}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="reg-nome">Nome</Label>
                    <Input
                      id="reg-nome"
                      value={regData.nome}
                      onChange={(e) => setRegData({ ...regData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-cognome">Cognome</Label>
                    <Input
                      id="reg-cognome"
                      value={regData.cognome}
                      onChange={(e) => setRegData({ ...regData, cognome: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username</Label>
                  <Input
                    id="reg-username"
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regData.email}
                    onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="Min. 6 caratteri, maiuscola, numero"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Conferma Password</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    value={regData.confirmPassword}
                    onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isRegLoading}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isRegLoading ? 'Registrazione...' : 'Crea Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>{getVersionString()}</p>
            <p className="mt-1">{CONFIG.BRAND_LOCATION}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
