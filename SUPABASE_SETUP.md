# 🚀 Migrazione a Supabase - Guida Completa

Questa guida ti aiuterà a migrare l'applicazione da localStorage a Supabase per avere dati persistenti e multiutente.

## 📋 Indice
1. [Panoramica](#panoramica)
2. [Setup Supabase](#setup-supabase)
3. [Configurazione Database](#configurazione-database)
4. [Variabili d'Ambiente](#variabili-dambiente)
5. [Migrazione Dati](#migrazione-dati)
6. [Deploy su Vercel](#deploy-su-vercel)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Panoramica

### Cos'è cambiato?

| Funzionalità | Prima (localStorage) | Ora (Supabase) |
|-------------|---------------------|----------------|
| **Autenticazione** | Hash password custom | Supabase Auth (sicuro) |
| **Database** | localStorage browser | PostgreSQL cloud |
| **Chat** | Polling/refresh | Realtime (WebSocket) |
| **Notifiche** | Solo in-app | Realtime + persistenti |
| **Sicurezza** | Crittografia client | Row Level Security |
| **Multi-device** | ❌ No | ✅ Sì |

### Vantaggi
- ✅ Dati persistenti e backup automatici
- ✅ Accesso da multipli dispositivi
- ✅ Chat in tempo reale
- ✅ Autenticazione sicura con JWT
- ✅ Password reset via email
- ✅ Storage per immagini

---

## 🔧 Setup Supabase

### 1. Crea un account Supabase

1. Vai su [https://supabase.com](https://supabase.com)
2. Clicca "Start your project"
3. Registrati con GitHub o email

### 2. Crea un nuovo progetto

1. Clicca "New Project"
2. Seleziona l'organizzazione
3. Imposta:
   - **Name**: `mw-mgr` (o nome a tua scelta)
   - **Database Password**: genera una password sicura (salvala!)
   - **Region**: `West Europe (Frankfurt)` (più vicino all'Italia)
4. Clicca "Create new project" (attendi ~2 minuti)

### 3. Ottieni le credenziali API

1. Dal dashboard del progetto, vai su **Project Settings** (icona ingranaggio)
2. Seleziona **API** nel menu laterale
3. Copia:
   - **URL**: `https://xxxxxx.supabase.co`
   - **anon public**: `eyJhbG...` (la chiave pubblica)

⚠️ **IMPORTANTE**: La `service_role` key è SOLO per backend/server. NON usarla nel frontend!

---

## 🗄️ Configurazione Database

### 1. Apri SQL Editor

1. Dal dashboard, clicca **SQL Editor** nel menu laterale
2. Clicca **New query**

### 2. Esegui lo schema

1. Apri il file `supabase/schema.sql` del progetto
2. Copia tutto il contenuto
3. Incollalo nell'SQL Editor
4. Clicca **Run** (tasto play)

✅ Se vedi "Success" in verde, il database è configurato!

### 3. Verifica le tabelle

1. Vai su **Table Editor** nel menu laterale
2. Dovresti vedere:
   - `users`
   - `articles`
   - `article_comments`
   - `chat_messages`
   - `todos`
   - `notifications`
   - `notification_settings`

---

## 🔐 Variabili d'Ambiente

### Sviluppo locale

1. Copia `.env.example` in `.env`:
   ```bash
   cp .env.example .env
   ```

2. Modifica `.env` con i tuoi valori:
   ```env
   VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

3. Riavvia il server di sviluppo:
   ```bash
   npm run dev
   ```

### Produzione su Vercel

1. Vai su [https://vercel.com](https://vercel.com)
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi:
   - `VITE_SUPABASE_URL` = URL del tuo progetto
   - `VITE_SUPABASE_ANON_KEY` = anon key
5. Clicca **Save**
6. Fai un nuovo deploy:
   ```bash
   git push
   # o
   vercel --prod
   ```

---

## 🔄 Migrazione Dati

Se hai dati esistenti in localStorage che vuoi migrare:

### 1. Esporta dati da localStorage

1. Apri l'applicazione nel browser (versione localStorage)
2. Apri la console sviluppatore (F12)
3. Esegui:
   ```javascript
   copy(JSON.stringify(db.export()))
   ```
4. Crea un file `localStorage-export.json` e incolla il contenuto

### 2. Ottieni Service Role Key

1. Su Supabase, vai su **Project Settings** → **API**
2. Copia la **service_role** key (🔒 non condividerla mai!)

### 3. Esegui migrazione

```bash
# Installa tsx se non lo hai
npm install -g tsx

# Esegui migrazione
SUPABASE_URL=https://tuo-progetto.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... \
tsx supabase/migrate-from-localStorage.ts
```

⚠️ **Nota**: Gli utenti dovranno reimpostare la password al primo login con Supabase Auth.

---

## 🚀 Deploy su Vercel

### Prerequisiti
- Account Vercel (gratuito)
- Progetto collegato a GitHub/GitLab

### Step

1. **Push del codice**:
   ```bash
   git add .
   git commit -m "Add Supabase backend support"
   git push
   ```

2. **Configura variabili d'ambiente** su Vercel (vedi sopra)

3. **Verifica il deploy**:
   - Vai su Vercel Dashboard
   - Clicca sul dominio del progetto
   - Verifica che funzioni correttamente

---

## 🧪 Testing

### Test localStorage fallback

1. Rimuovi o commenta le variabili in `.env`
2. Ricarica l'app
3. Verifica che usi localStorage (controlla la console)

### Test Supabase mode

1. Configura correttamente `.env`
2. Ricarica l'app
3. Verifica:
   - Registrazione nuovo utente
   - Login
   - Creazione articolo
   - Chat in tempo reale (apri due finestre)

---

## 🔧 Troubleshooting

### "Supabase non configurato" in console

**Causa**: Mancano le variabili d'ambiente

**Soluzione**:
1. Verifica `.env` esiste e contiene le variabili
2. Verifica che inizino con `VITE_` (per Vite)
3. Riavvia il server di sviluppo

### Error 401 / "JWT expired"

**Causa**: Sessione scaduta

**Soluzione**: Fai logout e login di nuovo

### Row Level Security violation

**Causa**: Policies non configurate correttamente

**Soluzione**:
1. Vai su Supabase Dashboard → Authentication → Policies
2. Verifica che le policies siano abilitate per ogni tabella
3. Se necessario, riesegui lo schema SQL

### Chat non in tempo reale
n
**Causa**: Realtime non abilitato

**Soluzione**:
1. Su Supabase, vai su Database → Replication
2. Verifica che `supabase_realtime` publication esista
3. Verifica che le tabelle `chat_messages`, `notifications`, etc. siano nella publication

### CORS Error

**Causa**: Dominio non autorizzato

**Soluzione**:
1. Su Supabase, vai su Authentication → URL Configuration
2. Aggiungi il tuo dominio Vercel in "Site URL"
3. Aggiungi in "Redirect URLs" (opzionale)

---

## 📚 Risorse Utili

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)

---

## 💡 Suggerimenti

1. **Backup**: Supabase fa backup automatici ogni giorno (tier gratuito)
2. **Rate Limiting**: Il tier gratuito ha limiti di richieste/minuto
3. **Storage**: Se carichi immagini, configura anche Supabase Storage
4. **Email**: Per password reset, configura un provider email in Auth → Providers

---

## 🆘 Supporto

Se incontri problemi:
1. Controlla la console del browser per errori
2. Verifica i log su Supabase Dashboard → Logs
3. Controlla i log su Vercel Dashboard → Functions

---

**Buona migrazione!** 🎉
