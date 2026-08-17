import type { GraphOptions } from "./graph.js";
import type { RiskOptions } from "./risk.js";
import type { IpGraphOptions, VelocityOptions } from "./ipGraph.js";

function readNumber(name: string): number | undefined {
    const raw = process.env[name];

    if (raw === undefined || raw.trim().length === 0) {
        return undefined;
    }

    const parsed = Number(raw);

    if (!Number.isFinite(parsed)) {
        console.warn(
            `⚠️  ${name}="${raw}" is not a valid number, ignoring and using the default.`,
        );

        return undefined;
    }

    return parsed;
}

/**
 * Build an options object containing only the keys that were actually set.
 *
 * { ...DEFAULT_OPTIONS, ...options }` will overwrite a default with undefined.
 */
function withoutUndefined<T extends object>(
    input: { [K in keyof T]: T[K] | undefined }
): Partial<T> {
    const output: Partial<T> = {};

    for (const key of Object.keys(input) as (keyof T)[]) {
        const value = input[key];

        if (value !== undefined) {
            output[key] = value as T[typeof key];
        }
    }

    return output;
}

export function getGraphOptionsFromEnv(): GraphOptions {
    return withoutUndefined<GraphOptions>({
        minimumEdgeScore: readNumber("ANTIALT_MIN_EDGE_SCORE"),
        minimumMatchingComponents: readNumber("ANTIALT_MIN_MATCHING_COMPONENTS"),
        minimumComparableComponents: readNumber("ANTIALT_MIN_COMPARABLE_COMPONENTS"),
        maxObservationsPerAccount: readNumber("ANTIALT_MAX_OBSERVATIONS_PER_ACCOUNT"),
        maxCandidatesPerObservation: readNumber("ANTIALT_MAX_CANDIDATES_PER_OBSERVATION"),
        observationTtlMs: readNumber("ANTIALT_OBSERVATION_TTL_MS"),
    });
}

export function getRiskOptionsFromEnv(): RiskOptions {
    return withoutUndefined<RiskOptions>({
        fingerprintScoreThreshold: readNumber("ANTIALT_FINGERPRINT_SCORE_THRESHOLD"),
        strongFingerprintScoreThreshold: readNumber("ANTIALT_STRONG_FINGERPRINT_SCORE_THRESHOLD"),
        criticalFingerprintScoreThreshold: readNumber("ANTIALT_CRITICAL_FINGERPRINT_SCORE_THRESHOLD"),
        maximumFingerprintPoints: readNumber("ANTIALT_MAX_FINGERPRINT_POINTS"),
        relatedBannedAccountPoints: readNumber("ANTIALT_RELATED_BANNED_ACCOUNT_POINTS"),
        sharedEmailPoints: readNumber("ANTIALT_SHARED_EMAIL_POINTS"),
        relatedVerifiedAccountPoints: readNumber("ANTIALT_RELATED_VERIFIED_ACCOUNT_POINTS"),
        noAvatarPoints: readNumber("ANTIALT_NO_AVATAR_POINTS"),
        historicalRelationshipPoints: readNumber("ANTIALT_HISTORICAL_RELATIONSHIP_POINTS"),
        sharedIpPoints: readNumber("ANTIALT_SHARED_IP_POINTS"),
        maximumIpPoints: readNumber("ANTIALT_MAX_IP_POINTS"),
        mfaEnabledReduction: readNumber("ANTIALT_MFA_ENABLED_REDUCTION"),
        moderateThreshold: readNumber("ANTIALT_MODERATE_THRESHOLD"),
        highThreshold: readNumber("ANTIALT_HIGH_THRESHOLD"),
        criticalThreshold: readNumber("ANTIALT_CRITICAL_THRESHOLD"),
    });
}

export function getIpGraphOptionsFromEnv(): IpGraphOptions {
    return withoutUndefined<IpGraphOptions>({
        maxAccountsPerIp: readNumber("ANTIALT_IP_MAX_ACCOUNTS_PER_IP"),
        ipTtlMs: readNumber("ANTIALT_IP_TTL_MS"),
    });
}

export function getVelocityOptionsFromEnv(): VelocityOptions {
    return withoutUndefined<VelocityOptions>({
        windowMs: readNumber("ANTIALT_VELOCITY_WINDOW_MS"),
        burstThreshold: readNumber("ANTIALT_VELOCITY_BURST_THRESHOLD"),
    });
}
