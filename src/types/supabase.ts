/**
 * TypeScript types per Supabase Database
 * Generati dallo schema del database
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          nome: string;
          cognome: string;
          ruolo: 'admin' | 'verifica' | 'scrittore';
          avatar: string | null;
          created_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          nome: string;
          cognome: string;
          ruolo?: 'admin' | 'verifica' | 'scrittore';
          avatar?: string | null;
          created_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          nome?: string;
          cognome?: string;
          ruolo?: 'admin' | 'verifica' | 'scrittore';
          avatar?: string | null;
          created_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
      };
      articles: {
        Row: {
          id: string;
          titolo: string;
          sottotitolo: string | null;
          contenuto: string;
          autore_id: string;
          autore_nome: string;
          categoria: string;
          tags: string[];
          status: 'BOZZA' | 'IN_REVISIONE' | 'APPROVATO' | 'RIFIUTATO' | 'PUBBLICATO';
          immagine_copertina: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          titolo: string;
          sottotitolo?: string | null;
          contenuto: string;
          autore_id: string;
          autore_nome: string;
          categoria: string;
          tags?: string[];
          status?: 'BOZZA' | 'IN_REVISIONE' | 'APPROVATO' | 'RIFIUTATO' | 'PUBBLICATO';
          immagine_copertina?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          titolo?: string;
          sottotitolo?: string | null;
          contenuto?: string;
          autore_id?: string;
          autore_nome?: string;
          categoria?: string;
          tags?: string[];
          status?: 'BOZZA' | 'IN_REVISIONE' | 'APPROVATO' | 'RIFIUTATO' | 'PUBBLICATO';
          immagine_copertina?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };
      article_comments: {
        Row: {
          id: string;
          article_id: string;
          autore_id: string;
          autore_nome: string;
          autore_ruolo: 'admin' | 'verifica' | 'scrittore';
          contenuto: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          autore_id: string;
          autore_nome: string;
          autore_ruolo: 'admin' | 'verifica' | 'scrittore';
          contenuto: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          article_id?: string;
          autore_id?: string;
          autore_nome?: string;
          autore_ruolo?: 'admin' | 'verifica' | 'scrittore';
          contenuto?: string;
          created_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          autore_id: string;
          autore_nome: string;
          autore_ruolo: 'admin' | 'verifica' | 'scrittore';
          autore_avatar: string | null;
          contenuto: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          autore_id: string;
          autore_nome: string;
          autore_ruolo: 'admin' | 'verifica' | 'scrittore';
          autore_avatar?: string | null;
          contenuto: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          autore_id?: string;
          autore_nome?: string;
          autore_ruolo?: 'admin' | 'verifica' | 'scrittore';
          autore_avatar?: string | null;
          contenuto?: string;
          created_at?: string;
        };
      };
      todos: {
        Row: {
          id: string;
          titolo: string;
          descrizione: string | null;
          assegnato_a: string | null;
          assegnato_a_nome: string | null;
          priorita: 'bassa' | 'media' | 'alta';
          completato: boolean;
          created_by: string;
          created_by_nome: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          titolo: string;
          descrizione?: string | null;
          assegnato_a?: string | null;
          assegnato_a_nome?: string | null;
          priorita?: 'bassa' | 'media' | 'alta';
          completato?: boolean;
          created_by: string;
          created_by_nome: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          titolo?: string;
          descrizione?: string | null;
          assegnato_a?: string | null;
          assegnato_a_nome?: string | null;
          priorita?: 'bassa' | 'media' | 'alta';
          completato?: boolean;
          created_by?: string;
          created_by_nome?: string;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 
            | 'chat_mention'
            | 'chat_message'
            | 'article_approved'
            | 'article_rejected'
            | 'article_published'
            | 'article_comment'
            | 'task_assigned'
            | 'task_completed'
            | 'system';
          title: string;
          message: string;
          priority: 'low' | 'normal' | 'high';
          read: boolean;
          read_at: string | null;
          created_at: string;
          data: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 
            | 'chat_mention'
            | 'chat_message'
            | 'article_approved'
            | 'article_rejected'
            | 'article_published'
            | 'article_comment'
            | 'task_assigned'
            | 'task_completed'
            | 'system';
          title: string;
          message: string;
          priority?: 'low' | 'normal' | 'high';
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
          data?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 
            | 'chat_mention'
            | 'chat_message'
            | 'article_approved'
            | 'article_rejected'
            | 'article_published'
            | 'article_comment'
            | 'task_assigned'
            | 'task_completed'
            | 'system';
          title?: string;
          message?: string;
          priority?: 'low' | 'normal' | 'high';
          read?: boolean;
          read_at?: string | null;
          created_at?: string;
          data?: Json | null;
        };
      };
      notification_settings: {
        Row: {
          user_id: string;
          enable_desktop: boolean;
          enable_in_app: boolean;
          enable_sound: boolean;
          notify_chat_mentions: boolean;
          notify_chat_messages: boolean;
          notify_article_status: boolean;
          notify_article_comments: boolean;
          notify_task_assigned: boolean;
          notify_task_completed: boolean;
          sound_volume: number;
          quiet_hours_enabled: boolean;
          quiet_hours_start: string;
          quiet_hours_end: string;
        };
        Insert: {
          user_id: string;
          enable_desktop?: boolean;
          enable_in_app?: boolean;
          enable_sound?: boolean;
          notify_chat_mentions?: boolean;
          notify_chat_messages?: boolean;
          notify_article_status?: boolean;
          notify_article_comments?: boolean;
          notify_task_assigned?: boolean;
          notify_task_completed?: boolean;
          sound_volume?: number;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string;
          quiet_hours_end?: string;
        };
        Update: {
          user_id?: string;
          enable_desktop?: boolean;
          enable_in_app?: boolean;
          enable_sound?: boolean;
          notify_chat_mentions?: boolean;
          notify_chat_messages?: boolean;
          notify_article_status?: boolean;
          notify_article_comments?: boolean;
          notify_task_assigned?: boolean;
          notify_task_completed?: boolean;
          sound_volume?: number;
          quiet_hours_enabled?: boolean;
          quiet_hours_start?: string;
          quiet_hours_end?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
