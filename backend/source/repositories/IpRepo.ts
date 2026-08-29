import database from "../config/database.js";
import type { IpObservationRecord } from "../interfaces/database_types.js";

/**
 * Upsert a single (ip, account) observation.
 */
export const recordObservation = async (
    accountId: string,
    ip: string,
    observedAt: number = Date.now()
): Promise<void> => {
    await database.query(
        `
        INSERT INTO ip_observation(ip, account_id, first_seen_at, last_seen_at)
        VALUES($1, $2, to_timestamp($3 / 1000.0), to_timestamp($3 / 1000.0))
        ON CONFLICT(ip, account_id)
        DO UPDATE SET last_seen_at = to_timestamp($3 / 1000.0)
        `,
        [ip, accountId, observedAt],
    );
};

export const loadAllObservations = async (): Promise<
    readonly IpObservationRecord[]
> => {
    const result = await database.query<IpObservationRecord>(
        `SELECT ip, account_id, first_seen_at, last_seen_at FROM ip_observation`,
    );

    return result.rows;
};

export const getIpsForAccount = async (
    accountId: string
): Promise<readonly IpObservationRecord[]> => {
    const result = await database.query<IpObservationRecord>(
        `
        SELECT ip, account_id, first_seen_at, last_seen_at
        FROM ip_observation
        WHERE account_id = $1
        ORDER BY last_seen_at DESC
        `,
        [accountId],
    );

    return result.rows;
};

/**
 * Deletes all rows whose first_seen_at column is older than the number of days given.
 */
export const clearExpiredIps = async (days: number): Promise<void> => {
    await database.query(
        `
        DELETE FROM ip_observation WHERE first_seen_at <= CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day')
        `,
        [days]
    );
}