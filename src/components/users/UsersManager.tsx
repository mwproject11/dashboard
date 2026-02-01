import { useState, useEffect } from 'react';
import { useAuthStore, useUsersStore } from '@/store/useStore';
import CONFIG from '@/config';
import type { User, UserRole } from '@/types';
import { validatePassword } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Mail,
  Shield,
  User as UserIcon,
  Save,
  X,
  Key,
  Lock,
  CheckCircle,
  Power,
  PowerOff
} from 'lucide-react';

export function UsersManager() {
  const { user } = useAuthStore();
  const { users, loadUsers, addUser, updateUser, deleteUser, activateUser, deactivateUser } = useUsersStore();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    username: '',
    email: '',
    ruolo: 'scrittore' as UserRole,
    password: ''
  });
  const [formError, setFormError] = useState('');

  // Password form state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Load users on mount
  useEffect(() => {
    loadUsers();
    setIsLoaded(true);
  }, [loadUsers]);

  if (!user || user.ruolo !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Accesso Negato
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Solo gli amministratori possono gestire gli utenti.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filtra utenti
  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleAdd = () => {
    setFormData({
      nome: '',
      cognome: '',
      username: '',
      email: '',
      ruolo: 'scrittore',
      password: ''
    });
    setFormError('');
    setShowAddDialog(true);
  };

  const handleEdit = (u: User) => {
    setFormData({
      nome: u.nome,
      cognome: u.cognome,
      username: u.username,
      email: u.email,
      ruolo: u.ruolo,
      password: ''
    });
    setFormError('');
    setEditingUser(u);
  };

  const handleSave = async () => {
    setFormError('');

    if (!formData.nome.trim() || !formData.cognome.trim() || !formData.username.trim() || !formData.email.trim()) {
      setFormError('Tutti i campi sono obbligatori');
      return;
    }

    if (editingUser) {
      // Update existing user (no password change here)
      updateUser(editingUser.id, {
        nome: formData.nome,
        cognome: formData.cognome,
        username: formData.username,
        email: formData.email,
        ruolo: formData.ruolo
      });
      setEditingUser(null);
    } else {
      // Create new user
      if (!formData.password) {
        setFormError('La password è obbligatoria per i nuovi utenti');
        return;
      }

      const passwordCheck = validatePassword(formData.password);
      if (!passwordCheck.valid) {
        setFormError(passwordCheck.errors.join(', '));
        return;
      }

      const result = await addUser({
        username: formData.username,
        email: formData.email,
        nome: formData.nome,
        cognome: formData.cognome,
        ruolo: formData.ruolo
      }, formData.password);

      if (result.success) {
        setShowAddDialog(false);
      } else {
        setFormError(result.error || 'Errore durante la creazione');
      }
    }
  };

  const handleDelete = (id: string) => {
    if (id === user.id) {
      alert('Non puoi eliminare il tuo stesso account!');
      return;
    }
    if (confirm('Sei sicuro di voler eliminare questo utente?')) {
      deleteUser(id);
    }
  };

  const handleToggleActive = (u: User) => {
    if (u.id === user.id) {
      alert('Non puoi disattivare il tuo stesso account!');
      return;
    }
    if (u.isActive) {
      deactivateUser(u.id);
    } else {
      activateUser(u.id);
    }
  };

  const handleOpenPasswordDialog = (u: User) => {
    setSelectedUserForPassword(u);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordDialog(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!selectedUserForPassword) return;

    if (!passwordData.newPassword) {
      setPasswordError('Inserisci una nuova password');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Le password non coincidono');
      return;
    }

    const passwordCheck = validatePassword(passwordData.newPassword);
    if (!passwordCheck.valid) {
      setPasswordError(passwordCheck.errors.join(', '));
      return;
    }

    const { resetPassword } = useAuthStore.getState();
    const result = await resetPassword(selectedUserForPassword.id, passwordData.newPassword);

    if (result.success) {
      setPasswordSuccess('Password cambiata con successo!');
      setTimeout(() => {
        setShowPasswordDialog(false);
        setSelectedUserForPassword(null);
      }, 1500);
    } else {
      setPasswordError(result.error || 'Errore durante il cambio password');
    }
  };

  // Statistiche
  const stats = {
    totali: users.length,
    attivi: users.filter(u => u.isActive).length,
    admin: users.filter(u => u.ruolo === 'admin').length,
    verifica: users.filter(u => u.ruolo === 'verifica').length,
    scrittori: users.filter(u => u.ruolo === 'scrittore').length
  };

  if (!isLoaded) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Caricamento utenti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            Gestione Utenti
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestisci gli account del team {CONFIG.BRAND_NAME}
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Utente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totali}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Attivi</p>
                <p className="text-2xl font-bold text-green-600">{stats.attivi}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admin</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.admin}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verifica</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.verifica}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Scrittori</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.scrittori}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cerca utenti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {filteredUsers.map(u => (
          <Card key={u.id} className={`hover:shadow-md transition-shadow ${!u.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={`text-lg font-medium ${getRoleColor(u.ruolo)}`}>
                    {getInitials(u.nome, u.cognome)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {u.nome} {u.cognome}
                    </h3>
                    <Badge className={getRoleColor(u.ruolo)}>
                      {getRoleLabel(u.ruolo)}
                    </Badge>
                    {!u.isActive && (
                      <Badge variant="destructive">Disattivato</Badge>
                    )}
                    {u.id === user.id && (
                      <Badge variant="outline">Tu</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3" />
                      @{u.username}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {u.email}
                    </span>
                    {u.lastLogin && (
                      <span>
                        Ultimo accesso: {new Date(u.lastLogin).toLocaleDateString('it-IT')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleOpenPasswordDialog(u)}
                    title="Cambia password"
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleToggleActive(u)}
                    title={u.isActive ? 'Disattiva' : 'Attiva'}
                  >
                    {u.isActive ? (
                      <PowerOff className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Power className="w-4 h-4 text-green-500" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEdit(u)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(u.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nessun utente trovato
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingUser} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingUser(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifica Utente' : 'Nuovo Utente'}
            </DialogTitle>
          </DialogHeader>
          
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cognome">Cognome *</Label>
                <Input
                  id="cognome"
                  value={formData.cognome}
                  onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                  placeholder="Cognome"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username"
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ruolo">Ruolo</Label>
              <Select 
                value={formData.ruolo} 
                onValueChange={(v) => setFormData({ ...formData, ruolo: v as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scrittore">Scrittore</SelectItem>
                  <SelectItem value="verifica">Verifica Info</SelectItem>
                  <SelectItem value="admin">Amministratore</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 6 caratteri, maiuscola, numero"
                />
                <p className="text-xs text-gray-500">
                  La password deve avere almeno 6 caratteri, una maiuscola e un numero
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setEditingUser(null);
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

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Cambia Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUserForPassword && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Utente: <strong>{selectedUserForPassword.nome} {selectedUserForPassword.cognome}</strong> (@{selectedUserForPassword.username})
              </p>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nuova Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Min. 6 caratteri, maiuscola, numero"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Conferma Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Ripeti la nuova password"
              />
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">{passwordError}</p>
              </div>
            )}
            
            {passwordSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300">{passwordSuccess}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Annulla
            </Button>
            <Button onClick={handleChangePassword}>
              <Key className="w-4 h-4 mr-2" />
              Cambia Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
