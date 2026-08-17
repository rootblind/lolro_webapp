import type { Result } from "pg";
import database from "../config/database.js";

/**
 * Persistence layer backing the in-memory anti-alt detection engine.
 */
export default async function AntiAltGuard(): Promise<Result> {
    try {
        return await database.query(`
            CREATE TABLE IF NOT EXISTS fingerprint_account(
                account_id BIGINT PRIMARY KEY,
                first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                observation_count INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS fingerprint_observation(
                id BIGSERIAL PRIMARY KEY,

                account_id BIGINT NOT NULL
                    REFERENCES fingerprint_account(account_id)
                    ON DELETE CASCADE,

                normalized JSONB NOT NULL,
                hashes JSONB NOT NULL,

                observed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS fingerprint_observation_account_idx
                ON fingerprint_observation(account_id);

            CREATE INDEX IF NOT EXISTS fingerprint_observation_observed_at_idx
                ON fingerprint_observation(observed_at);

            CREATE INDEX IF NOT EXISTS fingerprint_observation_hashes_idx
                ON fingerprint_observation USING GIN(hashes);

            CREATE TABLE IF NOT EXISTS fingerprint_edge(
                source_account_id BIGINT NOT NULL
                    REFERENCES fingerprint_account(account_id)
                    ON DELETE CASCADE,

                target_account_id BIGINT NOT NULL
                    REFERENCES fingerprint_account(account_id)
                    ON DELETE CASCADE,

                score DOUBLE PRECISION NOT NULL,
                confidence TEXT NOT NULL,

                matching_components JSONB NOT NULL,
                strong_matches JSONB NOT NULL,
                strong_mismatches JSONB NOT NULL,

                comparable_components INTEGER NOT NULL,
                matched_components INTEGER NOT NULL,
                observation_count INTEGER NOT NULL DEFAULT 1,

                first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY(source_account_id, target_account_id),

                CHECK(source_account_id < target_account_id)
            );

            CREATE INDEX IF NOT EXISTS fingerprint_edge_source_idx
                ON fingerprint_edge(source_account_id);

            CREATE INDEX IF NOT EXISTS fingerprint_edge_target_idx
                ON fingerprint_edge(target_account_id);

            CREATE INDEX IF NOT EXISTS fingerprint_edge_score_idx
                ON fingerprint_edge(score);

            CREATE TABLE IF NOT EXISTS ip_observation(
                ip INET NOT NULL,

                account_id BIGINT NOT NULL
                    REFERENCES fingerprint_account(account_id)
                    ON DELETE CASCADE,

                first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

                PRIMARY KEY(ip, account_id)
            );

            CREATE INDEX IF NOT EXISTS ip_observation_account_idx
                ON ip_observation(account_id);

            CREATE TABLE IF NOT EXISTS risk_assessment(
                id BIGSERIAL PRIMARY KEY,

                account_id BIGINT NOT NULL
                    REFERENCES fingerprint_account(account_id)
                    ON DELETE CASCADE,

                score INTEGER NOT NULL,
                level TEXT NOT NULL,
                recommended_action TEXT NOT NULL,

                evidence JSONB NOT NULL,
                related_account_ids JSONB NOT NULL,

                cluster_size INTEGER NOT NULL,
                strongest_fingerprint_score DOUBLE PRECISION NOT NULL,
                related_banned_account BOOLEAN NOT NULL,
                strong_fingerprint_relationship BOOLEAN NOT NULL,

                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS risk_assessment_account_idx
                ON risk_assessment(account_id);

            CREATE INDEX IF NOT EXISTS risk_assessment_created_at_idx
                ON risk_assessment(created_at);

            CREATE INDEX IF NOT EXISTS risk_assessment_pending_review_idx
                ON risk_assessment(created_at DESC)
                WHERE recommended_action IN ('manual_review', 'deny_verification');
        `);
    } catch (error) {
        console.error("Failed to initialize anti-alt guard tables:", error);
        throw error;
    }
}
