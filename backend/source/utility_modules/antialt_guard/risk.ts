
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
    | "allow" // simply verify the user
    | "additional_verification" // verify the user but log the risk assessment
    | "manual_review" // log the assessment but require manual moderator verification, no verification given
    | "deny_verification"; // deny verification and ban the account

export type RiskEvidenceType =
    | "fingerprint_similarity"
    | "fingerprint_cluster"
    | "related_banned_account"
    | "related_verified_account"
    | "shared_email"
    | "guild_membership"
    | "account_age"
    | "historical_relationship"
    | "shared_ip"
    | "no_avatar"
    | "has_premium"
    | "young_account"
    | "joined_too_soon"
    | "joined_same_day"

export interface RiskEvidence {
    readonly type: RiskEvidenceType;
    readonly points: number; // negative ++; positive --
    readonly description: string;
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
    readonly noAvatarPoints?: number;
    // discord account age related
    // Points are added to accounts with an age below the threshold (in days)
    // Points are added when the difference between the account age and joining date is below
    // the threshold (in days)
    readonly youngAccountPoints?: number;
    readonly joinedAgeDifferencePoints?: number;
    readonly joinedSameDayMultiplier?: number;

    // ip side
    readonly sharedIpPoints?: number;
    readonly maximumIpPoints?: number;

    // point deduction evidence //
    readonly accountHasPremiumPoints?: number;
    ///

    // thresholds
    readonly moderateThreshold?: number;
    readonly highThreshold?: number;
    readonly criticalThreshold?: number;

    // discord age threshold
    readonly accountAgeThreshold?: number;
    readonly joinedAgeDifferenceThreshold?: number;
}
const DEFAULT_OPTIONS: Required<RiskOptions> = {
    fingerprintScoreThreshold: 75,
    strongFingerprintScoreThreshold: 85,
    criticalFingerprintScoreThreshold: 92,
    maximumFingerprintPoints: 60,

    relatedBannedAccountPoints: 35,
    sharedEmailPoints: 25,
    relatedVerifiedAccountPoints: 5,
    historicalRelationshipPoints: 10,
    noAvatarPoints: 4,
    // discord age related
    youngAccountPoints: 30,
    joinedAgeDifferencePoints: 15,
    joinedSameDayMultiplier: 2,

    sharedIpPoints: 8,
    maximumIpPoints: 15,

    // point deduction evidence //
    accountHasPremiumPoints: 4,
    ///

    moderateThreshold: 30,
    highThreshold: 60,
    criticalThreshold: 85,

    // discord age threshold
    accountAgeThreshold: 2,
    joinedAgeDifferenceThreshold: 3,
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
            const strongestEdge = this.getStrongestEdge(relatedEdges);

            strongestFingerprintScore = strongestEdge?.score ?? 0;

            strongFingerprintRelationship =
                strongestFingerprintScore >=
                this.options.strongFingerprintScoreThreshold;

            const fingerprintPoints = this.calculateFingerprintPoints(relatedEdges);

            if (fingerprintPoints > 0) {
                evidence.push({
                    type: "fingerprint_similarity",
                    points: fingerprintPoints,
                    description: this.describeFingerprintEvidence(
                        strongestFingerprintScore,
                        relatedEdges
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
                description: "A suspected related account is currently banned from the guild.",
                relatedAccountIds: bannedAccounts.map((related) => related.id)
            });
        }

        const sharedEmailAccounts = this.getSharedEmailAccounts(
            account,
            relatedAccounts
        );

        if (sharedEmailAccounts.length > 0) {
            evidence.push({
                type: "shared_email",
                points: this.options.sharedEmailPoints,
                description: "The account shares the same normalized email identifier with a suspected related account.",
                relatedAccountIds: sharedEmailAccounts.map((related) => related.id)
            });
        }

        const relatedVerifiedAccounts = relatedAccounts.filter((related) => related.verified);

        if (relatedVerifiedAccounts.length > 0) {
            evidence.push({
                type: "related_verified_account",
                points: this.options.relatedVerifiedAccountPoints,
                description: "A suspected related account has previously completed application verification.",
                relatedAccountIds: relatedVerifiedAccounts.map((related) => related.id)
            });
        }

        // avatar factor
        const discordAvatar = account.avatar;
        if (discordAvatar === null) {
            evidence.push({
                type: "no_avatar",
                points: this.options.noAvatarPoints,
                description: "This account has no avatar.",
                relatedAccountIds: []
            });
        }

        if (cluster !== undefined) {
            const persistentEdges = relatedEdges.filter(
                (edge) => edge.observationCount >= 2,
            );

            if (persistentEdges.length > 0) {
                evidence.push({
                    type: "historical_relationship",
                    points: this.options.historicalRelationshipPoints,
                    description: "The fingerprint relationship has been observed repeatedly over time.",
                    relatedAccountIds: this.getAccountsFromEdges(
                        account.id,
                        persistentEdges,
                    )
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
                description: "The account has been observed from the same IP address as other accounts. ",
                relatedAccountIds: ipRelated,
            });
        }

        if (account.createdAt) {
            const DAY_IN_SECONDS = 24 * 60 * 60;
            const now = Math.floor(Date.now() / 1000); // current timestamp in seconds
            const accountAgeNormalized = Math.max(0, now - account.createdAt);
            if (accountAgeNormalized <= this.options.accountAgeThreshold * DAY_IN_SECONDS) {
                // if the account is too young
                evidence.push({
                    type: "young_account",
                    points: this.options.youngAccountPoints,
                    description: "Account created recently; age doesn't meet the threshold.",
                    relatedAccountIds: []
                });

                if (account.joined_guild_at) {
                    const joinCreateDifference = Math.max(0, account.joined_guild_at - account.createdAt);
                    if (joinCreateDifference <= this.options.joinedAgeDifferenceThreshold * DAY_IN_SECONDS) {
                        // set the multiplier: if the difference is <= one day, then the multiplier applies
                        // otherwise, multiplier is 1 (one)
                        const multiplier =
                            joinCreateDifference <= DAY_IN_SECONDS ?
                                this.options.joinedSameDayMultiplier :
                                1;
                        evidence.push({
                            type: multiplier === 1 ? "joined_too_soon" : "joined_same_day",
                            points: this.options.joinedAgeDifferencePoints * this.options.joinedSameDayMultiplier,
                            description: "This account joined the guild too soon after creation.",
                            relatedAccountIds: []
                        });
                    }
                }
            }
        }

        // iterate through RiskEvidence to sum up the score
        let score = this.sumPositiveEvidence(evidence);
        // check deduction conditions that may reduce the score
        score = this.sumScoreDeduction(score, account, evidence);

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

    private calculateFingerprintPoints(edges: readonly GraphEdge[]): number {
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
            (a, b) => b.score - a.score
        );

        const strongest = sorted[0]?.score ?? 0;

        let points = this.scoreFingerprint(
            strongest
        );

        const persistent = relevant.filter(
            (edge) => edge.observationCount >= 2
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

        points += Math.min(additionalStrong * 3, 10);

        return Math.min(
            points,
            this.options.maximumFingerprintPoints
        );
    }

    private scoreFingerprint(score: number,): number {
        if (score >= this.options.criticalFingerprintScoreThreshold) {
            return 55;
        }
        if (score >= this.options.strongFingerprintScoreThreshold) {
            return 45;
        }
        if (score >= this.options.fingerprintScoreThreshold) {
            return 30;
        }
        return 0;
    }

    private getAccountEdges(accountId: string, edges: readonly GraphEdge[]): readonly GraphEdge[] {
        return edges.filter(
            (edge) =>
                edge.source === accountId ||
                edge.target === accountId,
        );
    }

    private getStrongestEdge(edges: readonly GraphEdge[]): GraphEdge | undefined {
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

    private getRelatedAccountIds(accountId: string, cluster: FingerprintCluster): readonly string[] {
        return cluster.accountIds.filter((id) => id !== accountId);
    }

    private getAccountsFromEdges(accountId: string, edges: readonly GraphEdge[]): readonly string[] {
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

    private sumPositiveEvidence(evidence: readonly RiskEvidence[]): number {
        return evidence.reduce((sum, item) => sum + item.points, 0);
    }

    private sumScoreDeduction(
        score: number, account:
            DiscordAccountEvidence,
        evidence: RiskEvidence[]
    ): number {
        let reduced = score;
        // premium
        if (account.hasPremium) {
            reduced = Math.max(0, score - this.options.accountHasPremiumPoints);
            evidence.push({
                type: "has_premium",
                points: -this.options.accountHasPremiumPoints,
                description: "This account has Nitro active, risk potential decreased.",
                relatedAccountIds: []
            });
        }

        return reduced;
    }

    private describeFingerprintEvidence(score: number, edges: readonly GraphEdge[]): string {
        const strongest =
            this.getStrongestEdge(edges);

        if (strongest === undefined) {
            return "No qualifying fingerprint relationship.";
        }

        const components = strongest.matchingComponents.join(", ");

        if (score >= this.options.criticalFingerprintScoreThreshold) {
            return `Very strong fingerprint relationship with similarity ${score}; matching components: ${components}.`;
        }

        if (score >= this.options.strongFingerprintScoreThreshold) {
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
        const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));

        const level = this.getRiskLevel(
            normalizedScore,
        );

        return {
            accountId,
            score: normalizedScore,
            level,
            recommendedAction: this.getRecommendedAction(level),
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

    private getRiskLevel(score: number): RiskLevel {
        if (score >= this.options.criticalThreshold) {
            return "critical";
        }
        if (score >= this.options.highThreshold) {
            return "high";
        }
        if (score >= this.options.moderateThreshold) {
            return "moderate";
        }
        return "low";
    }

    private getRecommendedAction(level: RiskLevel): RiskAction {
        switch (level) {
            case "critical": return "deny_verification";
            case "high": return "manual_review";
            case "moderate": return "additional_verification";
            case "low": return "allow";
        }
    }
}
