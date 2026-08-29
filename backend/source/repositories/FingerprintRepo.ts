import type { PoolClient } from "pg";
import database from "../config/database.js";

import type {
    FingerprintEdgeRecord,
    FingerprintObservationRecord,
} from "../interfaces/database_types.js";

import type {
    FingerprintObservation,
    GraphEdge,
} from "../utility_modules/antialt_guard/graph.js";

/**
 * Persist a single fingerprint observation.
 */
export const saveObservation = async (
    observation: FingerprintObservation,
): Promise<void> => {
    const client: PoolClient = await database.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            `
            INSERT INTO fingerprint_account(
                account_id, first_seen_at, last_seen_at, observation_count
            )
            VALUES(
                $1, to_timestamp($2 / 1000.0), to_timestamp($2 / 1000.0), 1
            )
            ON CONFLICT(account_id)
            DO UPDATE SET
                last_seen_at = to_timestamp($2 / 1000.0),
                observation_count = fingerprint_account.observation_count + 1
            `,
            [observation.accountId, observation.observedAt],
        );

        await client.query(
            `
            INSERT INTO fingerprint_observation(
                account_id, normalized, hashes, observed_at
            )
            VALUES($1, $2::jsonb, $3::jsonb, to_timestamp($4 / 1000.0))
            `,
            [
                observation.accountId,
                JSON.stringify(observation.normalized),
                JSON.stringify(observation.hashes),
                observation.observedAt,
            ],
        );

        await client.query("COMMIT");
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Persist edges returned by FingerprintGraph.addObservation().
 *
 * Canonical ordering (source < target) is computed here using the SAME
 * string comparison graph.ts uses internally
 * (observationA.accountId < observationB.accountId), rather than trusting
 * Postgres to sort BIGINT columns numerically. Those happen to agree for
 * real Discord snowflakes (consistent digit count), but this repository
 * shouldn't depend on that coincidence, the DB's CHECK(source < target)
 * is a safety net, not the source of truth for ordering.
 *
 * Note: edge.observationCount/score/etc. are already the final, correctly
 * incremented values by the time graph.ts hands you a GraphEdge (see
 * upsertEdge() in graph.ts), so this is a plain overwrite via EXCLUDED.*,
 * not an additional increment.
 */
export const saveEdges = async (
    edges: readonly GraphEdge[],
): Promise<void> => {
    for (const edge of edges) {
        const [source, target] =
            Number(edge.source) < Number(edge.target)
                ? [edge.source, edge.target]
                : [edge.target, edge.source];

        await database.query(
            `
            INSERT INTO fingerprint_edge(
                source_account_id, target_account_id, score, confidence,
                matching_components, strong_matches, strong_mismatches,
                comparable_components, matched_components,
                observation_count, first_seen_at, last_seen_at
            )
            VALUES(
                $1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb,
                $8, $9, $10, to_timestamp($11 / 1000.0), to_timestamp($12 / 1000.0)
            )
            ON CONFLICT(source_account_id, target_account_id)
            DO UPDATE SET
                score = EXCLUDED.score,
                confidence = EXCLUDED.confidence,
                matching_components = EXCLUDED.matching_components,
                strong_matches = EXCLUDED.strong_matches,
                strong_mismatches = EXCLUDED.strong_mismatches,
                comparable_components = EXCLUDED.comparable_components,
                matched_components = EXCLUDED.matched_components,
                observation_count = EXCLUDED.observation_count,
                last_seen_at = EXCLUDED.last_seen_at
            `,
            [
                source,
                target,
                edge.score,
                edge.confidence,
                JSON.stringify(edge.matchingComponents),
                JSON.stringify(edge.strongMatches),
                JSON.stringify(edge.strongMismatches),
                edge.comparableComponents,
                edge.matchedComponents,
                edge.observationCount,
                edge.firstSeenAt,
                edge.lastSeenAt,
            ],
        );
    }
};

/**
 * All fingerprint observations, oldest first, across every account.
 *
 * Used exclusively for boot-time rehydration
 */
export const loadAllObservations = async (): Promise<
    readonly FingerprintObservationRecord[]
> => {
    const result = await database.query<FingerprintObservationRecord>(
        `
        SELECT id, account_id, normalized, hashes, observed_at
        FROM fingerprint_observation
        ORDER BY observed_at ASC
        `,
    );

    return result.rows;
};

export const getObservationsForAccount = async (
    accountId: string,
): Promise<readonly FingerprintObservationRecord[]> => {
    const result = await database.query<FingerprintObservationRecord>(
        `
        SELECT id, account_id, normalized, hashes, observed_at
        FROM fingerprint_observation
        WHERE account_id = $1
        ORDER BY observed_at DESC
        `,
        [accountId],
    );

    return result.rows;
};

export const getEdgesForAccount = async (
    accountId: string,
): Promise<readonly FingerprintEdgeRecord[]> => {
    const result = await database.query<FingerprintEdgeRecord>(
        `
        SELECT
            source_account_id, target_account_id, score, confidence,
            matching_components, strong_matches, strong_mismatches,
            comparable_components, matched_components,
            observation_count, first_seen_at, last_seen_at
        FROM fingerprint_edge
        WHERE source_account_id = $1 OR target_account_id = $1
        ORDER BY score DESC
        `,
        [accountId],
    );

    return result.rows;
};


/**
 * Deletes all rows with expired ttl
 */
export const clearExpiredFingerprintData = async (days: number): Promise<void> => {
    if (days <= 0 || !Number.isInteger(days)) {
        throw new Error(`${days} was given as input, but a positive integer was expected.`)
    }
    try {
        await database.query("BEGIN");
        await database.query(
            `
        DELETE FROM fingerprint_observation
        WHERE observed_at <= CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day');

        DELETE FROM fingerprint_edge
        WHERE first_seen_at <= CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day');

        DELETE FROM risk_assessment
        WHERE created_at <= CURRENT_TIMESTAMP - ($1 * INTERVAL '1 day');

        DELETE FROM fingerprint_account fa
        WHERE NOT EXISTS (
            SELECT 1
            FROM fingerprint_observation fo
            WHERE fo.account_id = fa.account_id
        )
        AND NOT EXISTS (
            SELECT 1
            FROM fingerprint_edge fe
            WHERE fe.source_account_id = fa.account_id
            OR fe.target_account_id = fa.account_id
        )
        AND NOT EXISTS (
            SELECT 1
            FROM ip_observation io
            WHERE io.account_id = fa.account_id
        )
        AND NOT EXISTS (
            SELECT 1
            FROM risk_assessment ra
            WHERE ra.account_id = fa.account_id
        );
        `,
            [days]
        );
        await database.query("COMMIT");
    } catch (error) {
        await database.query("ROLLBACK");
        throw error;
    }
}