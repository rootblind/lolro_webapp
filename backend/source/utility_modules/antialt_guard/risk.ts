
import type {
    DiscordAccountEvidence,
} from "../../interfaces/discord_types.js";

import type {
    FingerprintCluster,
    GraphEdge,
} from "./graph.js";

export type RiskLevel =
    | "low"
    | "moderate"
    | "high"
    | "critical";

export type RiskAction =
    | "allow"
    | "record"
    | "additional_verification"
    | "manual_review"
    | "deny_verification";

export type RiskEvidenceType =
    | "fingerprint_similarity"
    | "fingerprint_cluster"
    | "related_banned_account"
    | "related_verified_account"
    | "shared_email"
    | "mfa_difference"
    | "guild_membership"
    | "account_age"
    | "historical_relationship"
    | "shared_ip";

export interface RiskEvidence {
    readonly type: RiskEvidenceType;
    readonly points: number; // negative ++; positive --
    readonly description: string;
    // Optional Discord account IDs associated with this evidence.
    readonly relatedAccountIds: readonly string[];
}

export interface RiskAssessment {
    readonly accountId: string;
    readonly score: number; // policy score from 0 to 100
    readonly level: RiskLevel;
    readonly recommendedAction: RiskAction;
    readonly evidence: readonly RiskEvidence[];
    // Accounts directly connected to the evaluated account.
    readonly relatedAccountIds: readonly string[];
    // Number of accounts in the connected fingerprint cluster.
    readonly clusterSize: number;
    // Highest fingerprint similarity involving this account.
    readonly strongestFingerprintScore: number;
    // True when at least one related account is currently banned.
    readonly relatedBannedAccount: boolean;

    // true when the fingerprint relationship itself is sufficiently strong
    // to be relevant for risk evaluation.
    readonly strongFingerprintRelationship: boolean;
}

export interface RiskOptions {
    // fingerprint side
    readonly fingerprintScoreThreshold?: number;
    readonly strongFingerprintScoreThreshold?: number;
    readonly criticalFingerprintScoreThreshold?: number;
    readonly maximumFingerprintPoints?: number; // capping scoring for big clusters

    // discord side
    readonly relatedBannedAccountPoints?: number;
    readonly sharedEmailPoints?: number;
    readonly relatedVerifiedAccountPoints?: number;
    readonly historicalRelationshipPoints?: number;

    // ip side
    readonly sharedIpPoints?: number;
    readonly maximumIpPoints?: number;

    // Risk reduction
    readonly mfaEnabledReduction?: number;

    // thresholds
    readonly moderateThreshold?: number;
    readonly highThreshold?: number;
    readonly criticalThreshold?: number;
}
// TODO: ADD DISCORD DEFAULT AVATAR AS A RISK
const DEFAULT_OPTIONS: Required<RiskOptions> = {
    fingerprintScoreThreshold: 75,
    strongFingerprintScoreThreshold: 85,
    criticalFingerprintScoreThreshold: 92,
    maximumFingerprintPoints: 60,
    relatedBannedAccountPoints: 35,
    sharedEmailPoints: 25,
    relatedVerifiedAccountPoints: 5,
    historicalRelationshipPoints: 10,
    sharedIpPoints: 8,
    maximumIpPoints: 15,
    mfaEnabledReduction: 2,
    moderateThreshold: 30,
    highThreshold: 60,
    criticalThreshold: 85,
};

/**
 * anti-alt risk engine.
 *
 * It consumes the collected evidence and produces a deterministic, explainable risk assessment.
 */
export class AntiAltRiskEngine {
    private readonly options: Required<RiskOptions>;

    public constructor(
        options: RiskOptions = {},
    ) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
    }

    /**
     * Evaluate an account against its current fingerprint graph cluster
     * and any IP-correlated accounts.
     *
     * accounts should contain the Discord-side information available for
     * the current account and every related account, both fingerprint-cluster-related AND ip-related. 
     * The caller is responsible for fetching evidence for both sets before calling evaluate().
     *
     * ipRelatedAccountIds may be non-empty even when cluster is undefined that's the whole point of IP evidence: catching a
     * different physical device that never matches on fingerprint at all.
     */
    public evaluate(
        account: DiscordAccountEvidence,
        cluster: FingerprintCluster | undefined,
        accounts: ReadonlyMap<
            string,
            DiscordAccountEvidence
        >,
        ipRelatedAccountIds: readonly string[] = [],
    ): RiskAssessment {
        const evidence: RiskEvidence[] = [];

        const ipRelated = ipRelatedAccountIds.filter(
            (id) => id !== account.id,
        );

        if (cluster === undefined && ipRelated.length === 0) {
            const baseScore = this.applyMfaReduction(
                0,
                account,
                evidence,
            );

            return this.buildAssessment(
                account.id,
                baseScore,
                evidence,
                [],
                1,
                0,
                false,
            );
        }

        const relatedEdges = cluster !== undefined
            ? this.getAccountEdges(
                account.id,
                cluster.edges,
            )
            : [];

        const clusterRelatedAccountIds = cluster !== undefined
            ? this.getRelatedAccountIds(
                account.id,
                cluster,
            )
            : [];

        let strongestFingerprintScore = 0;
        let strongFingerprintRelationship = false;

        if (cluster !== undefined) {
            const strongestEdge = this.getStrongestEdge(
                relatedEdges,
            );

            strongestFingerprintScore =
                strongestEdge?.score ?? 0;

            strongFingerprintRelationship =
                strongestFingerprintScore >=
                this.options.strongFingerprintScoreThreshold;

            const fingerprintPoints =
                this.calculateFingerprintPoints(
                    relatedEdges,
                );

            if (fingerprintPoints > 0) {
                evidence.push({
                    type: "fingerprint_similarity",
                    points: fingerprintPoints,
                    description: this.describeFingerprintEvidence(
                        strongestFingerprintScore,
                        relatedEdges,
                    ),
                    relatedAccountIds: clusterRelatedAccountIds,
                });
            }
        }

        const relatedAccountIds = [
            ...new Set([
                ...clusterRelatedAccountIds,
                ...ipRelated,
            ]),
        ];

        const relatedAccounts = relatedAccountIds
            .map(
                (id) => accounts.get(id),
            )
            .filter(
                (
                    value,
                ): value is DiscordAccountEvidence =>
                    value !== undefined,
            );

        const bannedAccounts = relatedAccounts.filter(
            (related) => related.banned,
        );

        if (bannedAccounts.length > 0) {
            evidence.push({
                type: "related_banned_account",
                points: this.options.relatedBannedAccountPoints,
                description:
                    "A technically related Discord account is currently banned from the guild.",
                relatedAccountIds: bannedAccounts.map(
                    (related) => related.id,
                ),
            });
        }

        const sharedEmailAccounts =
            this.getSharedEmailAccounts(
                account,
                relatedAccounts,
            );

        if (sharedEmailAccounts.length > 0) {
            evidence.push({
                type: "shared_email",
                points: this.options.sharedEmailPoints,
                description:
                    "The account shares the same normalized email identifier with a technically related account.",
                relatedAccountIds:
                    sharedEmailAccounts.map(
                        (related) => related.id,
                    ),
            });
        }

        const relatedVerifiedAccounts =
            relatedAccounts.filter(
                (related) => related.verified,
            );

        if (relatedVerifiedAccounts.length > 0) {
            evidence.push({
                type: "related_verified_account",
                points:
                    this.options.relatedVerifiedAccountPoints,
                description:
                    "A technically related account has previously completed application verification.",
                relatedAccountIds:
                    relatedVerifiedAccounts.map(
                        (related) => related.id,
                    ),
            });
        }

        if (cluster !== undefined) {
            const persistentEdges = relatedEdges.filter(
                (edge) => edge.observationCount >= 2,
            );

            if (persistentEdges.length > 0) {
                evidence.push({
                    type: "historical_relationship",
                    points:
                        this.options.historicalRelationshipPoints,
                    description:
                        "The fingerprint relationship has been observed repeatedly over time.",
                    relatedAccountIds:
                        this.getAccountsFromEdges(
                            account.id,
                            persistentEdges,
                        ),
                });
            }
        }

        if (ipRelated.length > 0) {
            const ipPoints = Math.min(
                this.options.sharedIpPoints,
                this.options.maximumIpPoints,
            );

            evidence.push({
                type: "shared_ip",
                points: ipPoints,
                description:
                    "The account has been observed from the same IP address as a technically related account. " +
                    "This is treated as weak, corroborating evidence only.",
                relatedAccountIds: ipRelated,
            });
        }

        let score = this.sumPositiveEvidence(
            evidence,
        );

        score = this.applyMfaReduction(
            score,
            account,
            evidence,
        );

        score = Math.min(
            score,
            100,
        );

        return this.buildAssessment(
            account.id,
            score,
            evidence,
            relatedAccountIds,
            cluster?.size ?? 1,
            strongestFingerprintScore,
            strongFingerprintRelationship,
        );
    }

    private calculateFingerprintPoints(
        edges: readonly GraphEdge[],
    ): number {
        if (edges.length === 0) {
            return 0;
        }

        const relevant = edges.filter(
            (edge) =>
                edge.score >=
                this.options.fingerprintScoreThreshold &&
                edge.matchedComponents >= 4,
        );

        if (relevant.length === 0) {
            return 0;
        }

        // Use the strongest relationship as the primary signal.
        // Additional independent strong relationships contribute diminishing amounts rather than linearly increasing risk.
        const sorted = [...relevant].sort(
            (a, b) => b.score - a.score,
        );

        const strongest = sorted[0]?.score ?? 0;

        let points = this.scoreFingerprint(
            strongest,
        );

        const persistent = relevant.filter(
            (edge) => edge.observationCount >= 2,
        ).length;

        if (persistent >= 2) {
            points += 5;
        }

        // Multiple strong relationships increase confidence, but are capped.
        const additionalStrong = sorted
            .slice(1)
            .filter(
                (edge) =>
                    edge.score >=
                    this.options.strongFingerprintScoreThreshold,
            ).length;

        points += Math.min(
            additionalStrong * 3,
            10,
        );

        return Math.min(
            points,
            this.options.maximumFingerprintPoints,
        );
    }

    private scoreFingerprint(
        score: number,
    ): number {
        if (
            score >=
            this.options.criticalFingerprintScoreThreshold
        ) {
            return 55;
        }

        if (
            score >=
            this.options.strongFingerprintScoreThreshold
        ) {
            return 45;
        }

        if (
            score >=
            this.options.fingerprintScoreThreshold
        ) {
            return 30;
        }

        return 0;
    }

    private applyMfaReduction(
        score: number,
        account: DiscordAccountEvidence,
        evidence: RiskEvidence[],
    ): number {
        if (!account.mfaEnabled) {
            return score;
        }

        const reduced = Math.max(
            0,
            score - this.options.mfaEnabledReduction,
        );

        if (reduced !== score) {
            evidence.push({
                type: "mfa_difference",
                points:
                    -this.options.mfaEnabledReduction,
                description:
                    "The account has MFA enabled; this is treated as a weak mitigating signal.",
                relatedAccountIds: [],
            });
        }

        return reduced;
    }

    private getAccountEdges(
        accountId: string,
        edges: readonly GraphEdge[],
    ): readonly GraphEdge[] {
        return edges.filter(
            (edge) =>
                edge.source === accountId ||
                edge.target === accountId,
        );
    }

    private getStrongestEdge(
        edges: readonly GraphEdge[],
    ): GraphEdge | undefined {
        let strongest: GraphEdge | undefined;

        for (const edge of edges) {
            if (
                strongest === undefined ||
                edge.score > strongest.score
            ) {
                strongest = edge;
            }
        }

        return strongest;
    }

    private getRelatedAccountIds(
        accountId: string,
        cluster: FingerprintCluster,
    ): readonly string[] {
        return cluster.accountIds.filter(
            (id) => id !== accountId,
        );
    }

    private getAccountsFromEdges(
        accountId: string,
        edges: readonly GraphEdge[],
    ): readonly string[] {
        const ids = new Set<string>();

        for (const edge of edges) {
            if (edge.source === accountId) {
                ids.add(edge.target);
            }

            if (edge.target === accountId) {
                ids.add(edge.source);
            }
        }

        return [...ids];
    }

    private getSharedEmailAccounts(
        account: DiscordAccountEvidence,
        relatedAccounts: readonly DiscordAccountEvidence[],
    ): readonly DiscordAccountEvidence[] {
        if (
            account.emailHash === undefined ||
            account.emailHash.length === 0
        ) {
            return [];
        }

        return relatedAccounts.filter(
            (related) =>
                related.emailHash !== undefined &&
                related.emailHash === account.emailHash,
        );
    }

    private sumPositiveEvidence(
        evidence: readonly RiskEvidence[],
    ): number {
        return evidence.reduce(
            (sum, item) => sum + item.points,
            0,
        );
    }

    private describeFingerprintEvidence(
        score: number,
        edges: readonly GraphEdge[],
    ): string {
        const strongest =
            this.getStrongestEdge(edges);

        if (strongest === undefined) {
            return "No qualifying fingerprint relationship.";
        }

        const components =
            strongest.matchingComponents.join(
                ", ",
            );

        if (
            score >=
            this.options.criticalFingerprintScoreThreshold
        ) {
            return `Very strong fingerprint relationship with similarity ${score}; matching components: ${components}.`;
        }

        if (
            score >=
            this.options.strongFingerprintScoreThreshold
        ) {
            return `Strong fingerprint relationship with similarity ${score}; matching components: ${components}.`;
        }

        return `Suspicious fingerprint relationship with similarity ${score}; matching components: ${components}.`;
    }

    private buildAssessment(
        accountId: string,
        score: number,
        evidence: readonly RiskEvidence[],
        relatedAccountIds: readonly string[],
        clusterSize: number,
        strongestFingerprintScore: number,
        strongFingerprintRelationship: boolean,
    ): RiskAssessment {
        const normalizedScore = Math.max(
            0,
            Math.min(
                100,
                Math.round(score),
            ),
        );

        const level = this.getRiskLevel(
            normalizedScore,
        );

        return {
            accountId,
            score: normalizedScore,
            level,
            recommendedAction:
                this.getRecommendedAction(level),
            evidence,
            relatedAccountIds,
            clusterSize,
            strongestFingerprintScore,
            relatedBannedAccount: evidence.some(
                (item) =>
                    item.type ===
                    "related_banned_account",
            ),
            strongFingerprintRelationship,
        };
    }

    private getRiskLevel(
        score: number,
    ): RiskLevel {
        if (
            score >=
            this.options.criticalThreshold
        ) {
            return "critical";
        }

        if (
            score >=
            this.options.highThreshold
        ) {
            return "high";
        }

        if (
            score >=
            this.options.moderateThreshold
        ) {
            return "moderate";
        }

        return "low";
    }

    private getRecommendedAction(
        level: RiskLevel,
    ): RiskAction {
        switch (level) {
            case "critical":
                return "deny_verification";

            case "high":
                return "manual_review";

            case "moderate":
                return "additional_verification";

            case "low":
                return "allow";
        }
    }
}
