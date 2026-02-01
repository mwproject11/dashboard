/**
 * Script di migrazione da localStorage a Supabase
 * 
 * Esegui questo script una sola volta per migrare i dati esistenti
 * dal localStorage al database Supabase.
 * 
 * Uso:
 * 1. Configura le variabili d'ambiente Supabase
 * 2. Esegui: npx tsx supabase/migrate-from-localStorage.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Configura Supabase (usa service role key per bypassare RLS)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Errore: Configura SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Leggi i dati dal file di export localStorage
const exportFile = process.argv[2] || 'localStorage-export.json';

interface LocalStorageData {
  users?: Array<{
    id: string;
    username: string;
    email: string;
    nome: string;
    cognome: string;
    ruolo: 'admin' | 'verifica' | 'scrittore';
    avatar?: string;
    createdAt: string;
    lastLogin?: string;
    isActive: boolean;
  }>;
  passwords?: Record<string, string>;
  articles?: Array<{
    id: string;
    titolo: string;
    sottotitolo?: string;
    contenuto: string;
    autoreId: string;
    autoreNome: string;
    categoria: string;
    tags: string[];
    status: string;
    immagineCopertina?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    commentiVerifica: Array<{
      id: string;
      articoloId: string;
      autoreId: string;
      autoreNome: string;
      autoreRuolo: string;
      contenuto: string;
      createdAt: string;
    }>;
  }>;
  chat?: Array<{
    id: string;
    autoreId: string;
    autoreNome: string;
    autoreRuolo: string;
    autoreAvatar?: string;
    contenuto: string;
    createdAt: string;
  }>;
  todos?: Array<{
    id: string;
    titolo: string;
    descrizione?: string;
    assegnatoA?: string;
    assegnatoANome?: string;
    priorita: 'bassa' | 'media' | 'alta';
    completato: boolean;
    createdBy: string;
    createdByNome: string;
    createdAt: string;
    completedAt?: string;
  }>;
}

async function migrate() {
  console.log('🚀 Inizio migrazione da localStorage a Supabase...\n');

  let data: LocalStorageData;
  try {
    const fileContent = readFileSync(join(process.cwd(), exportFile), 'utf-8');
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error('❌ Errore: Impossibile leggere il file di export');
    console.log('\nPer esportare i dati da localStorage:');
    console.log('1. Apri l\'applicazione nel browser');
    console.log('2. Apri la console (F12)');
    console.log('3. Esegui: copy(JSON.stringify(db.export()))');
    console.log('4. Salva il contenuto in localStorage-export.json');
    process.exit(1);
  }

  // Migra utenti
  if (data.users && data.users.length > 0) {
    console.log(`👥 Migrazione di ${data.users.length} utenti...`);
    
    for (const user of data.users) {
      // Crea utente in Auth
      const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          username: user.username,
          nome: user.nome,
          cognome: user.cognome,
          ruolo: user.ruolo
        }
      });

      if (authError) {
        console.error(`  ❌ Errore creazione utente ${user.username}:`, authError.message);
        continue;
      }

      if (authData.user) {
        // Aggiorna dati aggiuntivi
        const { error: updateError } = await supabase
          .from('users')
          .update({
            created_at: user.createdAt,
            last_login: user.lastLogin,
            is_active: user.isActive,
            avatar: user.avatar
          })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error(`  ❌ Errore aggiornamento utente ${user.username}:`, updateError.message);
        } else {
          console.log(`  ✅ Utente ${user.username} creato (ID: ${authData.user.id})`);
          console.log(`     ⚠️  Password temporanea: ${tempPassword}`);
          console.log(`     L'utente dovrà reimpostare la password al primo login`);
        }
      }
    }
    console.log('');
  }

  // Migra articoli
  if (data.articles && data.articles.length > 0) {
    console.log(`📝 Migrazione di ${data.articles.length} articoli...`);
    
    const { error } = await supabase
      .from('articles')
      .insert(data.articles.map(a => ({
        id: a.id,
        titolo: a.titolo,
        sottotitolo: a.sottotitolo,
        contenuto: a.contenuto,
        autore_id: a.autoreId,
        autore_nome: a.autoreNome,
        categoria: a.categoria,
        tags: a.tags,
        status: a.status,
        immagine_copertina: a.immagineCopertina,
        created_at: a.createdAt,
        updated_at: a.updatedAt,
        published_at: a.publishedAt
      })));

    if (error) {
      console.error('  ❌ Errore migrazione articoli:', error.message);
    } else {
      console.log('  ✅ Articoli migrati con successo');
    }

    // Migra commenti
    const commenti = data.articles.flatMap(a => a.commentiVerifica || []);
    if (commenti.length > 0) {
      console.log(`💬 Migrazione di ${commenti.length} commenti...`);
      
      const { error: commentsError } = await supabase
        .from('article_comments')
        .insert(commenti.map(c => ({
          id: c.id,
          article_id: c.articoloId,
          autore_id: c.autoreId,
          autore_nome: c.autoreNome,
          autore_ruolo: c.autoreRuolo,
          contenuto: c.contenuto,
          created_at: c.createdAt
        })));

      if (commentsError) {
        console.error('  ❌ Errore migrazione commenti:', commentsError.message);
      } else {
        console.log('  ✅ Commenti migrati con successo');
      }
    }
    console.log('');
  }

  // Migra messaggi chat
  if (data.chat && data.chat.length > 0) {
    console.log(`💬 Migrazione di ${data.chat.length} messaggi chat...`);
    
    const { error } = await supabase
      .from('chat_messages')
      .insert(data.chat.map(m => ({
        id: m.id,
        autore_id: m.autoreId,
        autore_nome: m.autoreNome,
        autore_ruolo: m.autoreRuolo,
        autore_avatar: m.autoreAvatar,
        contenuto: m.contenuto,
        created_at: m.createdAt
      })));

    if (error) {
      console.error('  ❌ Errore migrazione chat:', error.message);
    } else {
      console.log('  ✅ Messaggi chat migrati con successo');
    }
    console.log('');
  }

  // Migra todo
  if (data.todos && data.todos.length > 0) {
    console.log(`✅ Migrazione di ${data.todos.length} todo...`);
    
    const { error } = await supabase
      .from('todos')
      .insert(data.todos.map(t => ({
        id: t.id,
        titolo: t.titolo,
        descrizione: t.descrizione,
        assegnato_a: t.assegnatoA,
        assegnato_a_nome: t.assegnatoANome,
        priorita: t.priorita,
        completato: t.completato,
        created_by: t.createdBy,
        created_by_nome: t.createdByNome,
        created_at: t.createdAt,
        completed_at: t.completedAt
      })));

    if (error) {
      console.error('  ❌ Errore migrazione todo:', error.message);
    } else {
      console.log('  ✅ Todo migrati con successo');
    }
    console.log('');
  }

  console.log('✨ Migrazione completata!');
  console.log('\n📋 Prossimi passi:');
  console.log('1. Verifica i dati in Supabase Dashboard');
  console.log('2. Comunica agli utenti di reimpostare le password');
  console.log('3. Configura VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY su Vercel');
  console.log('4. Riavvia l\'applicazione');
}

migrate().catch(console.error);
