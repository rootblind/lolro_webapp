
import type { Result } from "pg";

import database from "../config/database.js";
import type {
    FingerprintObservationRecord,
} from "../interfaces/database_types.js";

export async function FingerprintGraph(): Promise<
    Result<FingerprintObservationRecord>
> {
    try {
        await database.query(`
            CREATE TABLE IF NOT EXISTS fingerprint_account(
                account_id BIGINT PRIMARY KEY,

                first_seen_at TIMESTAMP NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                last_seen_at TIMESTAMP NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                observation_count INTEGER NOT NULL
                    DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS fingerprint_observation(
                id BIGSERIAL PRIMARY KEY,

                account_id BIGINT NOT NULL
                    REFERENCES fingerprint_account(account_id)
                    ON DELETE CASCADE,

                hashes JSONB NOT NULL,

                observed_at TIMESTAMP NOT NULL
                    DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS
                fingerprint_observation_account_idx
            ON fingerprint_observation(account_id);

            CREATE INDEX IF NOT EXISTS
                fingerprint_observation_hashes_idx
            ON fingerprint_observation
            USING GIN(hashes);

            CREATE TABLE IF NOT EXISTS fingerprint_edge(
                source_account_id BIGINT NOT NULL
                    REFERENCES fingerprint_account(account_id)
                    ON DELETE CASCADE,

                target_account_id BIGINT NOT NULL
                    REFERENCES fingerprint_account(account_id)
                    ON DELETE CASCADE,

                score DOUBLE PRECISION NOT NULL,

                confidence TEXT NOT NULL,

                matched_components JSONB NOT NULL,

                observation_count INTEGER NOT NULL
                    DEFAULT 1,

                first_seen_at TIMESTAMP NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                last_seen_at TIMESTAMP NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY(
                    source_account_id,
                    target_account_id
                ),

                CHECK(
                    source_account_id <
                    target_account_id
                )
            );

            CREATE INDEX IF NOT EXISTS
                fingerprint_edge_source_idx
            ON fingerprint_edge(source_account_id);

            CREATE INDEX IF NOT EXISTS
                fingerprint_edge_target_idx
            ON fingerprint_edge(target_account_id);

            CREATE INDEX IF NOT EXISTS
                fingerprint_edge_score_idx
            ON fingerprint_edge(score);
        `);

        return database.query<FingerprintObservationRecord>(
            `
            SELECT
                id,
                account_id,
                hashes,
                observed_at
            FROM fingerprint_observation
            LIMIT 0
            `,
        );
    } catch (error) {
        console.error(
            "Failed to initialize fingerprint graph tables:",
            error,
        );

        throw error;
    }
}
