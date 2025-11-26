import type { Result } from "pg";

import database from '../config/database.js';
import type { User } from "../interfaces/database_types.js";

export default async function User(): Promise<Result<User>> {
    try{
        const result: Result<User> = await database.query(`CREATE TABLE IF NOT EXISTS web_user(
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