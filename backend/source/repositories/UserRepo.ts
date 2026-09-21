import database from "../config/database.js";
import type { User, UserWithVerificaiton } from "../interfaces/database_types.js";
import { encryptor } from "../utility_modules/utility_methods.js";

export const putUser = async (userObj: User) => {
    // email is stored encrypted
    const encryptedEmail = encryptor(userObj.email.toString());
    // insert or update
    await database.query(`INSERT INTO web_user(
            id, username, display_name, email, account_created_at, mfa, verified_email, banned
        ) VALUES(
            $1, $2, $3, $4, $5, $6, $7, $8
        ) ON CONFLICT (id)
        DO UPDATE SET
            username = EXCLUDED.username,
            display_name = EXCLUDED.display_name,
            email = EXCLUDED.email,
            account_created_at = EXCLUDED.account_created_at,
            mfa = EXCLUDED.mfa,
            verified_email = EXCLUDED.verified_email,
            banned = EXCLUDED.banned;
        
        `,
        [
            userObj.id, userObj.username, userObj.display_name,
            encryptedEmail, userObj.account_created_at, userObj.mfa,
            userObj.verified_email, userObj.banned
        ]
    );
}

export const getUserById = async (id: string) => {
    const { rows: userData } = await database.query<User>(`SELECT * FROM web_user WHERE id=$1`, [id]);

    return userData[0] ?? false;
}

export const getUserWithVerificationStatus =
    async (id: string): Promise<UserWithVerificaiton | null> => {
        const { rows: data } = await database.query<UserWithVerificaiton>(
            `
            SELECT
                u.*
                vs.status
            FROM web_user AS u
            LEFT JOIN verification_status AS vs
                ON u.id = vs.user_id
            WHERE u.id=$1
            `,
            [id]
        );

        return data[0] ?? null;
    }