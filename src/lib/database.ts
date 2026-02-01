/**
 * Database Layer per MW_MGR
 * Gestisce la persistenza dei dati in localStorage con crittografia
 */

import CONFIG from '@/config';
import { encryptData, decryptData } from './crypto';

class Database {
  private encryptionKey: string;

  constructor() {
    this.encryptionKey = CONFIG.SECURITY.HASH_SALT;
  }

  /**
   * Salva dati nel database
   */
  set<T>(key: string, data: T): void {
    try {
      const jsonData = JSON.stringify(data);
      const encrypted = encryptData(jsonData, this.encryptionKey);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Database save error:', error);
      throw new Error('Impossibile salvare i dati');
    }
  }

  /**
   * Recupera dati dal database
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return defaultValue;
      
      const decrypted = decryptData(encrypted, this.encryptionKey);
      if (!decrypted) return defaultValue;
      
      return JSON.parse(decrypted) as T;
    } catch (error) {
      console.error('Database read error:', error);
      return defaultValue;
    }
  }

  /**
   * Rimuove dati dal database
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Verifica se una chiave esiste
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Pulisce tutto il database
   */
  clear(): void {
    localStorage.clear();
  }

  /**
   * Esporta tutti i dati
   */
  export(): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mw_mgr_')) {
        const value = this.get(key, null);
        if (value !== null) {
          data[key] = value;
        }
      }
    }
    return data;
  }

  /**
   * Importa dati
   */
  import(data: Record<string, unknown>): void {
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value);
    });
  }
}

// Singleton instance
export const db = new Database();

export default db;
