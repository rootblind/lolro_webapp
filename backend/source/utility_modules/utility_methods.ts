import crypto from "crypto";
import { config } from 'dotenv';
config();

export function get_env_var(name: string) {
    const value = process.env[name];

    if(!value) throw new Error(`Missing environment variable: ${name}`);
    return value;
}

const key = Buffer.from(get_env_var("ENCRYPT_KEY"), 'hex'); // encryption key
const iv = Buffer.from(get_env_var("IV"), 'hex'); // initializator vector
const algorithm = get_env_var("ALGORITHM"); // the algorithm used to encrypt

export function dataHasher(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function arraysEqual(array1: any[], array2: any[]): boolean {
  /**
   * Compare if two arrays are equal
   */

  if(array1 === array2) return true;
  if(array1 == null || array2 == null) return false;
  if(array1.length !== array2.length) return false;

  return JSON.stringify(array1) === JSON.stringify(array2);
}

export function encryptor(data: string): string {
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

export function decryptor(data: string): string {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}