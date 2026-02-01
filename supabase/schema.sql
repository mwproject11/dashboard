-- ============================================
-- SCHEMA DATABASE MW_MGR per Supabase
-- ============================================

-- Estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELLA UTENTI (estende auth.users di Supabase)
-- ============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    ruolo TEXT NOT NULL CHECK (ruolo IN ('admin', 'verifica', 'scrittore')),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- Abilita RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: tutti possono vedere gli utenti attivi
CREATE POLICY "Users can view all active users" 
ON public.users FOR SELECT 
TO authenticated 
USING (is_active = TRUE);

-- Policy: solo admin può creare/modificare utenti
CREATE POLICY "Only admins can insert users" 
ON public.users FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND ruolo = 'admin'
    )
);

CREATE POLICY "Only admins can update users" 
ON public.users FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND ruolo = 'admin'
    )
);

CREATE POLICY "Only admins can delete users" 
ON public.users FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND ruolo = 'admin'
    )
);

-- Policy: utenti possono aggiornare il proprio profilo
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
TO authenticated 
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================
-- TABELLA ARTICOLI
-- ============================================
CREATE TABLE public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titolo TEXT NOT NULL,
    sottotitolo TEXT,
    contenuto TEXT NOT NULL,
    autore_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    autore_nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'BOZZA' CHECK (status IN ('BOZZA', 'IN_REVISIONE', 'APPROVATO', 'RIFIUTATO', 'PUBBLICATO')),
    immagine_copertina TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Indici per performance
CREATE INDEX idx_articles_autore ON public.articles(autore_id);
CREATE INDEX idx_articles_status ON public.articles(status);
CREATE INDEX idx_articles_created_at ON public.articles(created_at DESC);

-- Abilita RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Policy: tutti gli utenti autenticati possono vedere tutti gli articoli
CREATE POLICY "Authenticated users can view all articles" 
ON public.articles FOR SELECT 
TO authenticated 
USING (TRUE);

-- Policy: scrittori possono creare articoli
CREATE POLICY "Authenticated users can create articles" 
ON public.articles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = autore_id);

-- Policy: autori possono modificare i propri articoli, admin e verifica possono modificare tutti
CREATE POLICY "Authors can update own articles, verifiers can update all" 
ON public.articles FOR UPDATE 
TO authenticated 
USING (
    autore_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND ruolo IN ('admin', 'verifica')
    )
);

-- Policy: solo admin può eliminare articoli
CREATE POLICY "Only admins can delete articles" 
ON public.articles FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND ruolo = 'admin'
    )
);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON public.articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABELLA COMMENTI ARTICOLI
-- ============================================
CREATE TABLE public.article_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    autore_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    autore_nome TEXT NOT NULL,
    autore_ruolo TEXT NOT NULL CHECK (autore_ruolo IN ('admin', 'verifica', 'scrittore')),
    contenuto TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_article_comments_article ON public.article_comments(article_id);
CREATE INDEX idx_article_comments_created_at ON public.article_comments(created_at DESC);

ALTER TABLE public.article_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments" 
ON public.article_comments FOR SELECT 
TO authenticated 
USING (TRUE);

CREATE POLICY "Authenticated users can create comments" 
ON public.article_comments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = autore_id);

CREATE POLICY "Authors can delete own comments, admins can delete all" 
ON public.article_comments FOR DELETE 
TO authenticated 
USING (
    autore_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND ruolo = 'admin'
    )
);

-- ============================================
-- TABELLA MESSAGGI CHAT
-- ============================================
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    autore_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    autore_nome TEXT NOT NULL,
    autore_ruolo TEXT NOT NULL CHECK (autore_ruolo IN ('admin', 'verifica', 'scrittore')),
    autore_avatar TEXT,
    contenuto TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view chat messages" 
ON public.chat_messages FOR SELECT 
TO authenticated 
USING (TRUE);

CREATE POLICY "Authenticated users can send messages" 
ON public.chat_messages FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = autore_id);

CREATE POLICY "Authors can delete own messages, admins can delete all" 
ON public.chat_messages FOR DELETE 
TO authenticated 
USING (
    autore_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND ruolo = 'admin'
    )
);

-- ============================================
-- TABELLA TODO
-- ============================================
CREATE TABLE public.todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titolo TEXT NOT NULL,
    descrizione TEXT,
    assegnato_a UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assegnato_a_nome TEXT,
    priorita TEXT NOT NULL DEFAULT 'media' CHECK (priorita IN ('bassa', 'media', 'alta')),
    completato BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_by_nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_todos_assegnato ON public.todos(assegnato_a);
CREATE INDEX idx_todos_completato ON public.todos(completato);
CREATE INDEX idx_todos_created_at ON public.todos(created_at DESC);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view todos" 
ON public.todos FOR SELECT 
TO authenticated 
USING (TRUE);

CREATE POLICY "Authenticated users can create todos" 
ON public.todos FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and assignees can update todos" 
ON public.todos FOR UPDATE 
TO authenticated 
USING (
    created_by = auth.uid() 
    OR assegnato_a = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND ruolo IN ('admin', 'verifica')
    )
);

CREATE POLICY "Creators and admins can delete todos" 
ON public.todos FOR DELETE 
TO authenticated 
USING (
    created_by = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND ruolo = 'admin'
    )
);

-- ============================================
-- TABELLA NOTIFICHE
-- ============================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'chat_mention', 'chat_message', 'article_approved', 
        'article_rejected', 'article_published', 'article_comment',
        'task_assigned', 'task_completed', 'system'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" 
ON public.notifications FOR INSERT 
TO authenticated 
WITH CHECK (TRUE);

CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" 
ON public.notifications FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- ============================================
-- TABELLA IMPOSTAZIONI NOTIFICHE
-- ============================================
CREATE TABLE public.notification_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    enable_desktop BOOLEAN DEFAULT TRUE,
    enable_in_app BOOLEAN DEFAULT TRUE,
    enable_sound BOOLEAN DEFAULT TRUE,
    notify_chat_mentions BOOLEAN DEFAULT TRUE,
    notify_chat_messages BOOLEAN DEFAULT FALSE,
    notify_article_status BOOLEAN DEFAULT TRUE,
    notify_article_comments BOOLEAN DEFAULT TRUE,
    notify_task_assigned BOOLEAN DEFAULT TRUE,
    notify_task_completed BOOLEAN DEFAULT TRUE,
    sound_volume NUMERIC DEFAULT 0.5,
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '08:00'
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" 
ON public.notification_settings FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can update own settings" 
ON public.notification_settings FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Crea impostazioni di default quando viene creato un utente
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_user_created 
    AFTER INSERT ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION create_default_notification_settings();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Abilita realtime per le tabelle
BEGIN;
  -- Rimuovi se esistono già
  DROP PUBLICATION IF EXISTS supabase_realtime;
  -- Crea nuova pubblicazione
  CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Aggiungi tabelle alla pubblicazione realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.articles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.todos;

-- ============================================
-- FUNZIONE PER CREARE UTENTE DA TRIGGER AUTH
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, email, nome, cognome, ruolo)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome', ''),
        COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
        COALESCE(NEW.raw_user_meta_data->>'ruolo', 'scrittore')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger per creare utente in public.users quando viene creato in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
