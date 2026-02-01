import { useState } from 'react';
import { useAuthStore, useThemeStore } from '@/store/useStore';
import CONFIG, { getVersionString } from '@/config';
import { validatePassword } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Shield, 
  Moon, 
  Sun, 
  Lock,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Key,
  Save,
  X,
  CheckCircle,
  Database,
  Download
} from 'lucide-react';
import db from '@/lib/database';

interface SettingsProps {
  onViewChange?: (view: string) => void;
}

export function Settings({ onViewChange }: SettingsProps) {
  const { user, logout, changePassword } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Data export/import
  const [showDataDialog, setShowDataDialog] = useState(false);
  const [exportData, setExportData] = useState('');

  if (!user) return null;

  const getInitials = (nome: string, cognome: string) => {
    return `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase();
  };

  const getRoleColor = (ruolo: string) => {
    return CONFIG.ROLES[ruolo.toUpperCase() as keyof typeof CONFIG.ROLES]?.color || 'bg-gray-100';
  };

  const getRoleLabel = (ruolo: string) => {
    return CONFIG.ROLES[ruolo.toUpperCase() as keyof typeof CONFIG.ROLES]?.label || ruolo;
  };

  const handleOpenPasswordDialog = () => {
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordDialog(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

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

    const result = await changePassword(user.id, passwordData.oldPassword, passwordData.newPassword);

    if (result.success) {
      setPasswordSuccess('Password cambiata con successo!');
      setTimeout(() => {
        setShowPasswordDialog(false);
      }, 1500);
    } else {
      setPasswordError(result.error || 'Errore durante il cambio password');
    }
  };

  const handleExportData = () => {
    const data = db.export();
    setExportData(JSON.stringify(data, null, 2));
    setShowDataDialog(true);
  };

  const handleDownloadExport = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mw_mgr_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Impostazioni</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gestisci il tuo profilo e le preferenze di {CONFIG.APP_NAME}
        </p>
      </div>

      {/* Info Piattaforma */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getVersionString()}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Piattaforma di gestione per {CONFIG.BRAND_NAME}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profilo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profilo Utente
          </CardTitle>
          <CardDescription>
            Le tue informazioni personali su {CONFIG.BRAND_NAME}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                {getInitials(user.nome, user.cognome)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.nome} {user.cognome}
              </h3>
              <Badge variant="secondary" className={getRoleColor(user.ruolo)}>
                {getRoleLabel(user.ruolo)}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={user.nome} disabled className="bg-gray-50 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cognome">Cognome</Label>
              <Input id="cognome" value={user.cognome} disabled className="bg-gray-50 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={user.username} disabled className="bg-gray-50 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="email" type="email" value={user.email} disabled className="pl-10 bg-gray-50 dark:bg-gray-800" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Informazioni di sola lettura
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Per modificare i tuoi dati personali, contatta un amministratore.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aspetto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            Aspetto
          </CardTitle>
          <CardDescription>
            Personalizza l'aspetto di {CONFIG.APP_NAME}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                {isDarkMode ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Modalità {isDarkMode ? 'Scura' : 'Chiara'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isDarkMode 
                    ? 'Tema scuro per ridurre l\'affaticamento degli occhi' 
                    : 'Tema chiaro per una visione ottimale diurna'}
                </p>
              </div>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Sicurezza */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Sicurezza
          </CardTitle>
          <CardDescription>
            Gestisci la sicurezza del tuo account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Cambia Password</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Aggiorna la password del tuo account</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleOpenPasswordDialog}>
              Modifica
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Ruolo: {getRoleLabel(user.ruolo)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Il tuo livello di accesso in {CONFIG.BRAND_NAME}</p>
              </div>
            </div>
            <Badge variant="secondary">{user.ruolo.toUpperCase()}</Badge>
          </div>

          {user.ruolo === 'admin' && (
            <div className="flex items-center justify-between p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Gestione Utenti</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Crea e gestisci gli account del team</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => onViewChange?.('utenti')}>
                Apri
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dati */}
      {user.ruolo === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Gestione Dati
            </CardTitle>
            <CardDescription>
              Esporta o importa i dati di {CONFIG.APP_NAME}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Esporta Dati</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Scarica un backup di tutti i dati</p>
                </div>
              </div>
              <Button variant="outline" onClick={handleExportData}>
                Esporta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Sessione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Termina Sessione</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Esci da {CONFIG.APP_NAME} e torna alla schermata di login</p>
            </div>
            <Button variant="destructive" onClick={logout}>
              Esci
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4">
        <p className="font-medium">{CONFIG.BRAND_NAME} - {CONFIG.BRAND_SUBTITLE}</p>
        <p>{CONFIG.BRAND_LOCATION}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>{getVersionString()}</span>
        </div>
      </div>

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
            <div className="space-y-2">
              <Label htmlFor="oldPassword">Password Attuale</Label>
              <Input
                id="oldPassword"
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                placeholder="Inserisci la password attuale"
              />
            </div>
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
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            
            {passwordSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {passwordSuccess}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Annulla
            </Button>
            <Button onClick={handleChangePassword}>
              <Save className="w-4 h-4 mr-2" />
              Cambia Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Data Dialog */}
      <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Esporta Dati
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Copia i dati qui sotto o scarica il file JSON.
            </p>
            <textarea
              value={exportData}
              readOnly
              className="w-full h-64 p-3 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDataDialog(false)}>
              Chiudi
            </Button>
            <Button onClick={handleDownloadExport}>
              <Download className="w-4 h-4 mr-2" />
              Scarica JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
