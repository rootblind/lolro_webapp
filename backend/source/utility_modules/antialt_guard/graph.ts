import type {
    JsonObject,
} from "../../interfaces/helper_types.js";

import type {
    FingerprintHashes,
} from "./hashing.js";

import {
    compareFingerprints,
    hashesArePotentialMatch,
    type SimilarityResult,
} from "./similarity.js";

export interface FingerprintObservation {
    readonly accountId: string;
    readonly normalized: JsonObject;
    readonly hashes: FingerprintHashes;
    readonly observedAt: number;
}

export interface GraphNode {
    readonly accountId: string;
    readonly firstSeenAt: number;
    readonly lastSeenAt: number;
    readonly observationCount: number;
}

export interface GraphEdge {
    readonly source: string;
    readonly target: string;
    // Similarity score at the time this edge was created/updated.
    readonly score: number;
    readonly confidence: SimilarityResult["confidence"];
    // Highest-level explanation of the relationship.
    readonly matchingComponents: readonly string[];
    readonly strongMatches: readonly string[];
    readonly strongMismatches: readonly string[];
    // Number of independent fingerprint components available to compare.
    readonly comparableComponents: number;
    // Number of matching components.
    readonly matchedComponents: number;

    // metadata
    readonly firstSeenAt: number;
    readonly lastSeenAt: number;
    readonly observationCount: number;
}

export interface FingerprintCluster {
    readonly accountIds: readonly string[];
    readonly edges: readonly GraphEdge[];
    // Maximum pairwise similarity observed inside the cluster.
    readonly maxSimilarity: number;
    // Average similarity of the graph's accepted edges.
    readonly averageSimilarity: number;
    // Number of independent accounts in the cluster.
    readonly size: number;
    // Number of accounts connected through at least one strong fingerprint relationship.
    readonly strongRelationshipCount: number;
}

export interface GraphOptions {
    // Minimum similarity score required before an edge is retained.
    readonly minimumEdgeScore?: number;
    // Minimum number of matching components required for an edge.
    readonly minimumMatchingComponents?: number;
    // Minimum number of comparable components required for an edge.
    readonly minimumComparableComponents?: number;
    // Maximum number of observations retained for one account.
    readonly maxObservationsPerAccount?: number;
    // Maximum number of candidate accounts considered for a new observation.
    // This prevents an O(n squared) comparison against the entire database.
    readonly maxCandidatesPerObservation?: number;
    // Maximum age of an observation considered for candidate matching.
    // Setting it to undefined disables expiration
    readonly observationTtlMs?: number;

    // Set the graph to verbose
    readonly debugLogging?: boolean;
}

const DEFAULT_OPTIONS: Required<GraphOptions> = {
    minimumEdgeScore: 75,
    minimumMatchingComponents: 4,
    minimumComparableComponents: 4,
    maxObservationsPerAccount: 10,
    maxCandidatesPerObservation: 500,
    observationTtlMs: 1000 * 60 * 60 * 24 * 365,
    debugLogging: false,
};

/**
 * A lightweight union-find implementation.
 *
 * It provides efficient connected-component construction without requiring
 * graph traversal for every cluster query.
 */
class DisjointSet {
    private readonly parent = new Map<string, string>(); // <child, parent>
    private readonly rank = new Map<string, number>();

    // initiate every element as being its own parent and rank 0
    public add(value: string): void {

        if (this.parent.has(value)) {
            return;
        }

        this.parent.set(value, value);
        this.rank.set(value, 0);
    }

    /**
     * 
     * @param value 
     * @returns 
     */
    public find(value: string): string {
        const parent = this.parent.get(value);

        if (parent === undefined) {
            this.add(value);
            return value;
        }

        if (parent === value) {
            return value;
        }

        const root = this.find(parent);

        this.parent.set(value, root);

        return root;
    }

    public union(a: string, b: string): void {
        const rootA = this.find(a);
        const rootB = this.find(b);

        if (rootA === rootB) {
            return;
        }

        const rankA = this.rank.get(rootA) ?? 0;
        const rankB = this.rank.get(rootB) ?? 0;

        if (rankA < rankB) {
            this.parent.set(rootA, rootB);
            return;
        }

        if (rankA > rankB) {
            this.parent.set(rootB, rootA);
            return;
        }

        this.parent.set(rootB, rootA);
        this.rank.set(rootA, rankA + 1);
    }
}

interface StoredObservation {
    readonly observation: FingerprintObservation;
    readonly storedAt: number;
}

interface CandidateIndexes {
    readonly canvas: Map<string, Set<string>>;
    readonly webgl: Map<string, Set<string>>;
    readonly fonts: Map<string, Set<string>>;
    readonly hardware: Map<string, Set<string>>;
    readonly crossBrowser: Map<string, Set<string>>;
}

/**
 * In-memory fingerprint relationship graph.
 */
export class FingerprintGraph {
    private readonly options: Required<GraphOptions>;

    private readonly nodes = new Map<string, GraphNode>();

    private readonly observations = new Map<
        string,
        StoredObservation[]
    >();

    private readonly edges = new Map<string, GraphEdge>();

    private readonly indexes: CandidateIndexes = {
        canvas: new Map(),
        webgl: new Map(),
        fonts: new Map(),
        hardware: new Map(),
        crossBrowser: new Map(),
    };

    public constructor(options: GraphOptions = {}) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
    }

    /**
     * Add or update an account observation.
     *
     * Returns the newly-created/updated edges.
     */
    public addObservation(
        observation: FingerprintObservation,
    ): readonly GraphEdge[] {
        this.validateObservation(observation);

        const now = Date.now();

        this.pruneExpiredObservations(now);

        this.upsertNode(observation, now);

        const previousObservations =
            this.observations.get(observation.accountId) ?? [];

        const candidates = this.getCandidates(observation);

        const newEdges: GraphEdge[] = [];

        for (const candidate of candidates) {
            // never compare an account with itself.
            if (
                candidate.observation.accountId ===
                observation.accountId
            ) {
                continue;
            }

            // Multiple observations from the same account are not useful for cross-account graph relationships.
            if (
                candidate.observation.accountId ===
                observation.accountId
            ) {
                continue;
            }

            /*
             * Fast candidate rejection.
             *
             * This is deliberately only a pre-filter. Final decisions always
             * use compareFingerprints().
             */
            if (
                !hashesArePotentialMatch(
                    observation.hashes,
                    candidate.observation.hashes,
                )
            ) {
                continue;
            }

            const result = compareFingerprints(
                observation.normalized,
                observation.hashes,
                candidate.observation.normalized,
                candidate.observation.hashes,
                this.options.debugLogging,
            );

            if (!this.qualifiesAsEdge(result)) {
                continue;
            }

            const edge = this.upsertEdge(
                observation,
                candidate.observation,
                result,
                now,
            );

            newEdges.push(edge);

            if (this.options.debugLogging) {
                console.log(`Edge created between ${observation.accountId} and ${candidate.observation.accountId}`);
                console.log(`   Score: ${result.score}`);
                console.log(`   Confidence: ${result.confidence}`);
                console.log(`   Matching components: ${result.matchingComponents}/${result.comparableComponents}`);
                console.log(`   Strong matches: ${result.strongMatches.join(', ')}`);
                console.log('---');
            }
        }

        /*
         * Add the new observation only after candidate discovery so that the
         * observation cannot accidentally match itself.
         */
        const updated = [
            ...previousObservations,
            {
                observation,
                storedAt: now,
            },
        ];

        if (
            updated.length >
            this.options.maxObservationsPerAccount
        ) {
            updated.splice(
                0,
                updated.length -
                this.options.maxObservationsPerAccount,
            );
        }

        this.observations.set(
            observation.accountId,
            updated,
        );

        this.indexObservation(observation);

        return newEdges;
    }

    /**
     * Get a single account node.
     */
    public getNode(
        accountId: string,
    ): GraphNode | undefined {
        return this.nodes.get(accountId);
    }

    /**
     * Get all retained edges involving an account.
     */
    public getEdgesForAccount(
        accountId: string,
    ): readonly GraphEdge[] {
        const result: GraphEdge[] = [];

        for (const edge of this.edges.values()) {
            if (
                edge.source === accountId ||
                edge.target === accountId
            ) {
                result.push(edge);
            }
        }

        return result;
    }

    /**
     * Return the accounts directly connected to an account.
     */
    public getNeighbors(
        accountId: string,
    ): readonly string[] {
        const neighbors = new Set<string>();

        for (const edge of this.edges.values()) {
            if (edge.source === accountId) {
                neighbors.add(edge.target);
            } else if (edge.target === accountId) {
                neighbors.add(edge.source);
            }
        }

        return [...neighbors];
    }

    /**
     * Construct all connected components in the current graph.
     */
    public getClusters(): readonly FingerprintCluster[] {
        const disjointSet = new DisjointSet();

        for (const accountId of this.nodes.keys()) {
            disjointSet.add(accountId);
        }

        for (const edge of this.edges.values()) {
            disjointSet.union(
                edge.source,
                edge.target,
            );
        }

        const grouped = new Map<
            string,
            Set<string>
        >();

        for (const accountId of this.nodes.keys()) {
            const root = disjointSet.find(accountId);

            const group =
                grouped.get(root) ??
                new Set<string>();

            group.add(accountId);
            grouped.set(root, group);
        }

        const clusters: FingerprintCluster[] = [];

        for (const accountIds of grouped.values()) {
            if (accountIds.size < 2) {
                continue;
            }

            const clusterEdges = [...this.edges.values()]
                .filter(
                    (edge) =>
                        accountIds.has(edge.source) &&
                        accountIds.has(edge.target),
                );

            if (clusterEdges.length === 0) {
                continue;
            }

            const maxSimilarity = Math.max(
                ...clusterEdges.map(
                    (edge) => edge.score,
                ),
            );

            const averageSimilarity =
                clusterEdges.reduce(
                    (sum, edge) =>
                        sum + edge.score,
                    0,
                ) / clusterEdges.length;

            const strongRelationshipCount =
                clusterEdges.filter(
                    (edge) =>
                        edge.strongMatches.length >= 2,
                ).length;

            clusters.push({
                accountIds: [...accountIds],
                edges: clusterEdges,
                maxSimilarity: Number(
                    maxSimilarity.toFixed(2),
                ),
                averageSimilarity: Number(
                    averageSimilarity.toFixed(2),
                ),
                size: accountIds.size,
                strongRelationshipCount,
            });
        }

        return clusters.sort(
            (a, b) => b.maxSimilarity - a.maxSimilarity,
        );
    }

    /**
     * Return the cluster containing a particular account.
     */
    public getClusterForAccount(
        accountId: string,
    ): FingerprintCluster | undefined {
        const clusters = this.getClusters();

        return clusters.find(
            (cluster) =>
                cluster.accountIds.includes(accountId),
        );
    }

    /**
     * Remove all information associated with an account.
     */
    public removeAccount(
        accountId: string,
    ): void {
        this.nodes.delete(accountId);
        this.observations.delete(accountId);

        for (const [key, edge] of this.edges) {
            if (
                edge.source === accountId ||
                edge.target === accountId
            ) {
                this.edges.delete(key);
            }
        }

        this.removeAccountFromIndexes(accountId);
    }

    /**
     * Remove expired observations and their corresponding accounts/edges.
     */
    public pruneExpiredObservations(
        now = Date.now(),
    ): void {
        const ttl = this.options.observationTtlMs;

        if (ttl <= 0) {
            return;
        }

        const cutoff = now - ttl;

        for (
            const [accountId, storedObservations]
            of this.observations
        ) {
            const retained = storedObservations.filter(
                (stored) =>
                    stored.storedAt >= cutoff,
            );

            if (retained.length === 0) {
                this.removeAccount(accountId);
                continue;
            }

            this.observations.set(
                accountId,
                retained,
            );

            const node = this.nodes.get(accountId);

            if (node !== undefined) {
                this.nodes.set(accountId, {
                    ...node,
                    firstSeenAt:
                        retained[0]?.observation
                            .observedAt ??
                        node.firstSeenAt,
                    lastSeenAt:
                        retained[
                            retained.length - 1
                        ]?.observation.observedAt ??
                        node.lastSeenAt,
                    observationCount:
                        retained.length,
                });
            }
        }

        this.rebuildIndexes();

        // Remove edges whose accounts no longer exist.        
        for (const [key, edge] of this.edges) {
            if (
                !this.nodes.has(edge.source) ||
                !this.nodes.has(edge.target)
            ) {
                this.edges.delete(key);
            }
        }
    }

    /**
     * Number of accounts currently represented by the graph.
     */
    public get nodeCount(): number {
        return this.nodes.size;
    }

    /**
     * Number of retained relationships.
     */
    public get edgeCount(): number {
        return this.edges.size;
    }

    private validateObservation(
        observation: FingerprintObservation,
    ): void {
        if (
            typeof observation.accountId !==
            "string" ||
            observation.accountId.length === 0
        ) {
            throw new TypeError(
                "Fingerprint observation requires a non-empty accountId.",
            );
        }

        if (
            !Number.isFinite(
                observation.observedAt,
            )
        ) {
            throw new TypeError(
                "Fingerprint observation requires a finite observedAt timestamp.",
            );
        }
    }

    private upsertNode(
        observation: FingerprintObservation,
        now: number,
    ): void {
        const existing = this.nodes.get(
            observation.accountId,
        );

        if (existing === undefined) {
            this.nodes.set(
                observation.accountId,
                {
                    accountId:
                        observation.accountId,
                    firstSeenAt:
                        observation.observedAt,
                    lastSeenAt:
                        observation.observedAt,
                    observationCount: 1,
                },
            );

            return;
        }

        this.nodes.set(
            observation.accountId,
            {
                ...existing,
                firstSeenAt: Math.min(
                    existing.firstSeenAt,
                    observation.observedAt,
                ),
                lastSeenAt: Math.max(
                    existing.lastSeenAt,
                    observation.observedAt,
                ),
                observationCount:
                    existing.observationCount + 1,
            },
        );

        void now;
    }

    /**
     * Retrieve candidates through multiple independent indexes.
     *
     * This avoids comparing every new fingerprint against every account.
     */
    private getCandidates(
        observation: FingerprintObservation,
    ): readonly StoredObservation[] {
        const candidateIds = new Set<string>();

        this.collectIndexCandidates(
            this.indexes.canvas,
            observation.hashes.canvasHash,
            candidateIds,
        );

        this.collectIndexCandidates(
            this.indexes.webgl,
            observation.hashes.webglBasicsHash,
            candidateIds,
        );

        this.collectIndexCandidates(
            this.indexes.fonts,
            observation.hashes.fontsHash,
            candidateIds,
        );

        this.collectIndexCandidates(
            this.indexes.hardware,
            observation.hashes.hardwareHash,
            candidateIds,
        );

        this.collectIndexCandidates(
            this.indexes.crossBrowser,
            observation.hashes.crossBrowserHash,
            candidateIds,
        );

        const candidates: StoredObservation[] = [];

        for (const accountId of candidateIds) {
            if (
                accountId ===
                observation.accountId
            ) {
                continue;
            }

            const accountObservations =
                this.observations.get(accountId);

            if (accountObservations === undefined) {
                continue;
            }

            // Use the most recent observation for candidate comparison.            
            const latest =
                accountObservations[
                accountObservations.length - 1
                ];

            if (latest !== undefined) {
                candidates.push(latest);
            }
        }

        candidates.sort(
            (a, b) =>
                b.storedAt - a.storedAt,
        );

        return candidates.slice(
            0,
            this.options
                .maxCandidatesPerObservation,
        );
    }

    private collectIndexCandidates(
        index: Map<string, Set<string>>,
        hash: string,
        output: Set<string>,
    ): void {
        const accounts = index.get(hash);

        if (accounts === undefined) {
            return;
        }

        for (const accountId of accounts) {
            output.add(accountId);
        }
    }

    private qualifiesAsEdge(
        result: SimilarityResult,
    ): boolean {
        if (!result.sufficientEvidence) {
            return false;
        }

        if (
            result.score <
            this.options.minimumEdgeScore
        ) {
            return false;
        }

        if (
            result.matchingComponents <
            this.options.minimumMatchingComponents
        ) {
            return false;
        }

        if (
            result.comparableComponents <
            this.options.minimumComparableComponents
        ) {
            return false;
        }

        return true;
    }

    private upsertEdge(
        observationA: FingerprintObservation,
        observationB: FingerprintObservation,
        result: SimilarityResult,
        now: number,
    ): GraphEdge {
        /*
         * Canonical ordering guarantees that A-B and B-A map to the same edge.
         */
        const [source, target] =
            observationA.accountId <
                observationB.accountId
                ? [
                    observationA.accountId,
                    observationB.accountId,
                ]
                : [
                    observationB.accountId,
                    observationA.accountId,
                ];

        const key = `${source}:${target}`;

        const existing = this.edges.get(key);

        const edge: GraphEdge = {
            source,
            target,

            score: result.score,
            confidence: result.confidence,

            matchingComponents:
                result.evidence
                    .filter(
                        (item) =>
                            item.strength ===
                            "match",
                    )
                    .map(
                        (item) =>
                            item.component,
                    ),

            strongMatches:
                result.strongMatches,

            strongMismatches:
                result.strongMismatches,

            comparableComponents:
                result.comparableComponents,

            matchedComponents:
                result.matchingComponents,

            firstSeenAt:
                existing?.firstSeenAt ??
                Math.min(
                    observationA.observedAt,
                    observationB.observedAt,
                ),

            lastSeenAt: now,

            observationCount:
                (existing?.observationCount ?? 0) + 1,
        };

        this.edges.set(key, edge);

        return edge;
    }

    private indexObservation(
        observation: FingerprintObservation,
    ): void {
        this.addToIndex(
            this.indexes.canvas,
            observation.hashes.canvasHash,
            observation.accountId,
        );

        this.addToIndex(
            this.indexes.webgl,
            observation.hashes.webglBasicsHash,
            observation.accountId,
        );

        this.addToIndex(
            this.indexes.fonts,
            observation.hashes.fontsHash,
            observation.accountId,
        );

        this.addToIndex(
            this.indexes.hardware,
            observation.hashes.hardwareHash,
            observation.accountId,
        );

        this.addToIndex(
            this.indexes.crossBrowser,
            observation.hashes.crossBrowserHash,
            observation.accountId,
        );
    }

    private addToIndex(
        index: Map<string, Set<string>>,
        hash: string,
        accountId: string,
    ): void {
        const accounts =
            index.get(hash) ??
            new Set<string>();

        accounts.add(accountId);

        index.set(hash, accounts);
    }

    private removeAccountFromIndexes(
        accountId: string,
    ): void {
        for (const index of Object.values(
            this.indexes,
        )) {
            for (const [hash, accounts] of index) {
                accounts.delete(accountId);

                if (accounts.size === 0) {
                    index.delete(hash);
                }
            }
        }
    }

    private rebuildIndexes(): void {
        for (const index of Object.values(
            this.indexes,
        )) {
            index.clear();
        }

        for (const storedObservations of this.observations.values()) {
            const latest =
                storedObservations[
                storedObservations.length - 1
                ];

            if (latest !== undefined) {
                this.indexObservation(
                    latest.observation,
                );
            }
        }
    }
}