/**
 * Utility di crittografia per MW_MGR
 * NOTA: In produzione reale, usare bcrypt o Argon2 lato server
 */

import CONFIG from '@/config';

/**
 * Genera un hash SHA-256 della password con salt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltedPassword = password + CONFIG.SECURITY.HASH_SALT;
  const encoder = new TextEncoder();
  const data = encoder.encode(saltedPassword);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifica se una password corrisponde all'hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Genera un ID univoco sicuro
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Genera un token di sessione
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Crittografa dati sensibili per localStorage
 */
export function encryptData(data: string, key: string): string {
  // Simple XOR encryption - NOT for production use!
  // In production, use Web Crypto API with proper keys
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result);
}

/**
 * Decrittografa dati da localStorage
 */
export function decryptData(encrypted: string, key: string): string {
  try {
    const data = atob(encrypted);
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch {
    return '';
  }
}

/**
 * Valida la forza di una password
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < CONFIG.SECURITY.MIN_PASSWORD_LENGTH) {
    errors.push(`La password deve essere di almeno ${CONFIG.SECURITY.MIN_PASSWORD_LENGTH} caratteri`);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La password deve contenere almeno un numero');
  }
  
  return { valid: errors.length === 0, errors };
}
