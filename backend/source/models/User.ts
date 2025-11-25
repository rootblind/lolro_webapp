import type { Result } from "pg";

import database from '../config/database.js';

export default async function User(): Promise<Result<any>> {
    try{
        const result: Result<any> = await database.query(`CREATE TABLE IF NOT EXISTS web_user(
                id BIGINT PRIMARY KEY,
                username TEXT NOT NULL,
                display_name TEXT NOT NULL,
                email BYTEA NOT NULL,
                mfa BOOLEAN DEFAULT FALSE,
                verified_email BOOLEAN DEFAULT FALSE,
                verified BOOLEAN DEFAULT FALSE,
                banned BOOLEAN DEFAULT FALSE,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);
        
        return result;
    } catch(error) {
        console.error(error);
        throw error;
    }
}