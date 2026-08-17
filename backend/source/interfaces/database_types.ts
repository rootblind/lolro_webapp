import type { FingerprintHashes } from "../utility_modules/antialt_guard/hashing.js"
import type { JsonObject } from "./helper_types.js";
import type { SimilarityConfidence } from "../utility_modules/antialt_guard/similarity.js";
import type {
    RiskAction,
    RiskEvidence,
    RiskLevel,
} from "../utility_modules/antialt_guard/risk.js";


interface User {
    id: string,
    username: string,
    display_name: string,
    email: string,
    mfa: boolean,
    verified_email: boolean,
    verified: boolean,
    banned: boolean,
    registered_at?: string
}

/**
 * A fingerprint observation permanently associated with a Discord account.
 */
export interface FingerprintObservationRecord {
    readonly id: number;
    readonly account_id: string;
    readonly normalized: JsonObject;
    readonly hashes: FingerprintHashes;
    readonly observed_at: Date;
}

/**
 * Persistent relationship between two Discord accounts.
 */
export interface FingerprintEdgeRecord {
    readonly source_account_id: string;
    readonly target_account_id: string;
    readonly score: number;
    readonly confidence: SimilarityConfidence;
    readonly matching_components: readonly string[];
    readonly strong_matches: readonly string[];
    readonly strong_mismatches: readonly string[];
    readonly comparable_components: number;
    readonly matched_components: number;
    readonly observation_count: number;
    readonly first_seen_at: Date;
    readonly last_seen_at: Date;
}
/**
 * Database representation of a fingerprint graph node.
 */
export interface FingerprintAccountRecord {
    readonly account_id: string;
    readonly first_seen_at: Date;
    readonly last_seen_at: Date;
    readonly observation_count: number;
}
export interface IpObservationRecord {
    readonly ip: string;
    readonly account_id: string;
    readonly first_seen_at: Date;
    readonly last_seen_at: Date;
}
export interface RiskAssessmentRecord {
    readonly id: number;
    readonly account_id: string;
    readonly score: number;
    readonly level: RiskLevel;
    readonly recommended_action: RiskAction;
    readonly evidence: readonly RiskEvidence[];
    readonly related_account_ids: readonly string[];
    readonly cluster_size: number;
    readonly strongest_fingerprint_score: number;
    readonly related_banned_account: boolean;
    readonly strong_fingerprint_relationship: boolean;
    readonly created_at: Date;
}


export type { User };
