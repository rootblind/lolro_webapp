import database from "../config/database.js";
import type { VerificationStatus, VerificationStatusType } from "../interfaces/database_types.js";

export const createVerificationStatus =
    async (user_id: string, status: VerificationStatusType): Promise<VerificationStatus> => {
        const { rows: data } = await database.query<VerificationStatus>(
            `INSERT INTO verification_status(user_id, status) VALUES($1, $2)
            ON CONFLICT (user_id)
            DO UPDATE SET
                status = EXCLUDED.status
            RETURNING *;`,
            [user_id, status]
        );

        return data[0]!;
    }

export const setVerificationStatus =
    async (user_id: string, status: VerificationStatusType): Promise<void> => {
        await database.query(`UPDATE verification_status SET status=$1 WHERE user_id=$2`, [status, user_id]);
    }

export const deleteVerificationStatus =
    async (user_id: string): Promise<void> => {
        await database.query(`DELETE FROM verification_status WHERE user_id=$1`, [user_id]);
    }

export const getUserVerificationStatusType =
    async (user_id: string): Promise<VerificationStatusType | null> => {
        const { rows: data } = await database.query<VerificationStatus>(
            `SELECT status FROM verification_status WHERE user_id = $1`,
            [user_id]
        );

        return data[0]?.status ?? null;
    };

/**
 * Deletes all rows older than 3 days where status = 'pending'
 */
export const deleteExpiredPendingVerification =
    async () => {
        await database.query(
            `DELETE FROM verification_status
            WHERE requested_at < CURRENT_TIMESTAMP - INTERVAL '3 days'
            AND status=$1;`,
            ["pending"]
        )
    }
