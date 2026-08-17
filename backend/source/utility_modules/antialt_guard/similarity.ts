import type {
    JsonObject,
    JsonValue,
} from "../../interfaces/helper_types.js";

import type { FingerprintHashes } from "./hashing.js";

export type SimilarityConfidence =
    | "insufficient"
    | "low"
    | "moderate"
    | "high"
    | "very_high";

export type SimilarityEvidenceStrength =
    | "match"
    | "mismatch"
    | "unavailable";

export interface SimilarityEvidence {
    readonly component: string;
    readonly strength: SimilarityEvidenceStrength;
    readonly weight: number;
}

export interface SimilarityResult {
    readonly score: number; // do note that similarity score is not a probability
    // just the sum of weighted matches of components
    readonly confidence: SimilarityConfidence;
    // components for which both fingerprints had usable data.
    readonly comparableComponents: number;
    // number of comparable components that matched exactly.
    readonly matchingComponents: number;
    // weighted evidence that matched.
    readonly matchingWeight: number;
    // weighted evidence that was available but mismatched.
    readonly mismatchingWeight: number;
    // individual evidence used by the scorer.
    readonly evidence: readonly SimilarityEvidence[];
    // useful for explaining why a pair was considered suspicious.
    readonly strongMatches: readonly string[];
    // Strong contradictory evidence.
    readonly strongMismatches: readonly string[];
    // true when the fingerprints contain enough evidence to make the score meaningful.
    readonly sufficientEvidence: boolean;
    // whether the corss-browser evidence matched
    // reported separately as it overlaps with individual components
    readonly crossBrowserMatch: boolean;
}

interface ComponentDefinition {
    readonly name: string;
    readonly hashKey: keyof FingerprintHashes;
    readonly normalizedKey: string;
    readonly weight: number;
    readonly strong: boolean;
}

interface ComponentAvailability {
    readonly available: boolean;
    readonly hash: string;
}

/**
 * Component weights deliberately sum to 100.
 *
 * The weights reflect evidence strength, not uniqueness in isolation.
 *
 * In particular:
 *
 * - Canvas is strong evidence when collected consistently.
 * - WebGL renderer is strong evidence.
 * - Fonts are useful but relatively common.
 * - Language/timezone are weak because many unrelated users share them.
 * - Hardware concurrency/device memory are supporting evidence only.
 *
 * Group hashes are intentionally excluded because their underlying fields are
 * already represented here.
 */
const COMPONENTS: readonly ComponentDefinition[] = [
    {
        name: "canvas",
        hashKey: "canvasHash",
        normalizedKey: "canvas",
        weight: 25,
        strong: true,
    },
    {
        name: "webglBasics",
        hashKey: "webglBasicsHash",
        normalizedKey: "webGlBasics",
        weight: 18,
        strong: true,
    },
    {
        name: "fonts",
        hashKey: "fontsHash",
        normalizedKey: "fonts",
        weight: 12,
        strong: false,
    },
    {
        name: "audio",
        hashKey: "audioHash",
        normalizedKey: "audio",
        weight: 8,
        strong: false,
    },
    {
        name: "math",
        hashKey: "mathHash",
        normalizedKey: "math",
        weight: 8,
        strong: false,
    },
    {
        name: "webglExtensions",
        hashKey: "webglExtensionsHash",
        normalizedKey: "webGlExtensions",
        weight: 6,
        strong: false,
    },
    {
        name: "hardwareConcurrency",
        hashKey: "hardwareConcurrencyHash",
        normalizedKey: "hardwareConcurrency",
        weight: 5,
        strong: false,
    },
    {
        name: "platform",
        hashKey: "platformHash",
        normalizedKey: "platform",
        weight: 3,
        strong: false,
    },
    {
        name: "architecture",
        hashKey: "architectureHash",
        normalizedKey: "architecture",
        weight: 3,
        strong: false,
    },
    {
        name: "deviceMemory",
        hashKey: "deviceMemoryHash",
        normalizedKey: "deviceMemory",
        weight: 3,
        strong: false,
    },
    {
        name: "timezone",
        hashKey: "timezoneHash",
        normalizedKey: "timezone",
        weight: 2,
        strong: false,
    },
    {
        name: "timezoneOffset",
        hashKey: "timezoneOffsetHash",
        normalizedKey: "timezoneOffset",
        weight: 2,
        strong: false,
    },
    {
        name: "languages",
        hashKey: "languagesHash",
        normalizedKey: "languages",
        weight: 2,
        strong: false,
    },
    {
        name: "colorDepth",
        hashKey: "colorDepthHash",
        normalizedKey: "colorDepth",
        weight: 1,
        strong: false,
    },
    {
        name: "screenResolution",
        hashKey: "screenResolutionHash",
        normalizedKey: "screenResolution",
        weight: 2,
        strong: false,
    },
];

const CROSS_BROWSER_KEYS = [
    "platform",
    "architecture",
    "hardwareConcurrency",
    "deviceMemory",
    "fonts",
    "math",
    "colorDepth",
    "timezoneOffset",
] as const;

/**
 * Values that should not count as usable fingerprint evidence such as null
 */
function hasUsableValue(value: JsonValue | undefined): boolean {
    return value !== undefined && value !== null;
}

/**
 * Determines whether a normalized component actually exists and contains usable value
 */
function getNormalizedComponent(
    normalized: JsonObject,
    key: string,
): JsonValue | undefined {
    const component = normalized[key];

    if (!hasUsableValue(component)) {
        return undefined;
    }

    if (
        typeof component === "object" &&
        component !== null &&
        !Array.isArray(component)
    ) {
        const object = component as JsonObject;

        if ("value" in object) {
            return object.value;
        }
    }

    return component;
}

/**
 * Determine whether a component contains meaningful data.
 *
 * Empty arrays/objects are treated as unavailable. This prevents a collector
 * that returned [] or {} from becoming a false positive match.
 */
function isMeaningfulValue(value: JsonValue | undefined): boolean {
    if (!hasUsableValue(value)) {
        return false;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    if (typeof value === "object" && value !== null) {
        return Object.keys(value).length > 0;
    }

    if (typeof value === "string") {
        return value.length > 0;
    }

    return true;
}

function getAvailability(
    normalized: JsonObject,
    hashes: FingerprintHashes,
    definition: ComponentDefinition,
): ComponentAvailability {
    const normalizedValue = getNormalizedComponent(
        normalized,
        definition.normalizedKey,
    );

    if (!isMeaningfulValue(normalizedValue)) {
        return {
            available: false,
            hash: hashes[definition.hashKey],
        };
    }

    return {
        available: true,
        hash: hashes[definition.hashKey],
    };
}

function getConfidence(
    score: number,
    comparableComponents: number,
    matchingComponents: number,
    strongMatches: number,
): SimilarityConfidence {
    if (comparableComponents < 3) { // excluding few high weight components scoring high
        return "insufficient";
    }
    if (
        score >= 85 &&
        matchingComponents >= 4 &&
        strongMatches >= 1
    ) {
        return "very_high";
    }

    if (
        score >= 70 &&
        matchingComponents >= 3
    ) {
        return "high";
    }

    if (
        score >= 50 &&
        matchingComponents >= 2
    ) {
        return "moderate";
    }

    return "low";
}

/**
 * Build the cross-browser subset from normalized data.
 *
 * The subset mirrors hashes.ts and is used only to determine whether the
 * cross-browser hash represents actual available evidence for both clients.
 */
function hasCrossBrowserEvidence(
    normalized: JsonObject,
): boolean {
    let available = 0;

    for (const key of CROSS_BROWSER_KEYS) {
        const value = getNormalizedComponent(normalized, key);

        if (isMeaningfulValue(value)) {
            available += 1;
        }
    }

    // Require at least three components. A cross-browser hash based only on
    // one or two common values is not meaningful evidence.
    return available >= 3;
}

/**
 * Compare two normalized fingerprints.
 *
 * The hashes provide O(1) equality checks while normalized data is used to
 * determine whether each component was actually available.
 *
 */
export function compareFingerprints(
    normalizedA: JsonObject,
    hashesA: FingerprintHashes,
    normalizedB: JsonObject,
    hashesB: FingerprintHashes,
    debugLogging = false,
): SimilarityResult {

    if (debugLogging) {
        console.log("COMPARING FINGERPRINTS:");
        console.log("Available components (A):",
            COMPONENTS.filter(c => {
                const avail = getAvailability(normalizedA, hashesA, c);
                return avail.available;
            }).map(c => c.name)
        );
        console.log("Available components (B):",
            COMPONENTS.filter(c => {
                const avail = getAvailability(normalizedB, hashesB, c);
                return avail.available;
            }).map(c => c.name)
        );
    }

    const evidence: SimilarityEvidence[] = [];

    let totalWeight = 0;
    let matchingWeight = 0;
    let mismatchingWeight = 0;

    let comparableComponents = 0;
    let matchingComponents = 0;

    let strongMatches = 0;

    const strongMatchNames: string[] = [];
    const strongMismatchNames: string[] = [];

    for (const definition of COMPONENTS) {
        const a = getAvailability(
            normalizedA,
            hashesA,
            definition,
        );

        const b = getAvailability(
            normalizedB,
            hashesB,
            definition,
        );

        // unavailable components must be ignored
        // a component may be unavailable due to different browser apis
        if (!a.available || !b.available) {
            evidence.push({
                component: definition.name,
                strength: "unavailable",
                weight: definition.weight,
            });

            continue;
        }

        comparableComponents += 1;
        totalWeight += definition.weight;

        if (a.hash === b.hash) {
            matchingComponents += 1;
            matchingWeight += definition.weight;

            evidence.push({
                component: definition.name,
                strength: "match",
                weight: definition.weight,
            });

            if (definition.strong) {
                strongMatches += 1;
                strongMatchNames.push(definition.name);
            }
        } else {
            mismatchingWeight += definition.weight;

            evidence.push({
                component: definition.name,
                strength: "mismatch",
                weight: definition.weight,
            });

            if (definition.strong) {
                strongMismatchNames.push(definition.name);
            }
        }
    }

    // unavailable components are not matches nor mismatches, so total weight is normalized
    // based on available evidence
    const baseScore =
        totalWeight > 0
            ? (matchingWeight / totalWeight) * 100
            : 0;

    /*
     * Correlation guard.
     *
     * Canvas/WebGL/fonts/etc. are not statistically independent. A naive
     * additive score can therefore become overconfident.
     *
     * We cap the contribution of the strongest renderer signals when there is
     * too little independent evidence elsewhere.
     */
    const independentEvidenceWeight =
        evidence
            .filter(
                (item) =>
                    item.strength === "match" &&
                    item.component !== "canvas" &&
                    item.component !== "webglBasics" &&
                    item.component !== "webglExtensions",
            )
            .reduce(
                (sum, item) => sum + item.weight,
                0,
            );

    let score = baseScore;

    // if the correlating components are the only contributors, cap the score at 82
    if (
        independentEvidenceWeight < 10 &&
        comparableComponents >= 2
    ) {
        score = Math.min(score, 82);
    }

    // the cross-browser hash is used as corroborating evidence, not for scoring
    const crossBrowserMatch =
        hasCrossBrowserEvidence(normalizedA) &&
        hasCrossBrowserEvidence(normalizedB) &&
        hashesA.crossBrowserHash === hashesB.crossBrowserHash;

    // A score based on very little data should not receive high confidence.
    const sufficientEvidence =
        comparableComponents >= 4 &&
        totalWeight >= 25;

    if (!sufficientEvidence) { // cap insufficient evidence
        score = Math.min(score, 59);
    }

    score = Math.max(
        0,
        Math.min(100, Number(score.toFixed(2))),
    );

    const confidence = getConfidence(
        score,
        comparableComponents,
        matchingComponents,
        strongMatches,
    );

    if (debugLogging) {
        console.log(`Similarity Result:`);
        console.log(`   Score: ${score}`);
        console.log(`   Confidence: ${confidence}`);
        console.log(`   Comparable: ${comparableComponents}`);
        console.log(`   Matches: ${matchingComponents}`);
        console.log(`   Strong Matches: ${strongMatchNames.join(', ')}`);
        console.log(`   Strong Mismatches: ${strongMismatchNames.join(', ')}`);
        console.log(`   Sufficient Evidence: ${sufficientEvidence}`);
        console.log(`   Cross-browser match: ${crossBrowserMatch}`);
    }

    return {
        score,
        confidence,

        comparableComponents,
        matchingComponents,

        matchingWeight: Number(
            matchingWeight.toFixed(2),
        ),

        mismatchingWeight: Number(
            mismatchingWeight.toFixed(2),
        ),

        evidence,

        strongMatches: strongMatchNames,
        strongMismatches: strongMismatchNames,

        sufficientEvidence,

        crossBrowserMatch,
    };
}

/**
 * Convenience function for comparing only the hash structures.
 *
 * This should NOT be used for enforcement decisions because it cannot
 * distinguish "missing" from "present and equal to null".
 *
 * It is useful for fast candidate filtering after a database lookup.
 */
export function hashesArePotentialMatch(
    a: FingerprintHashes,
    b: FingerprintHashes,
): boolean {
    // At least one strong renderer signal or multiple independent signals
    // must agree before a pair is considered worth full comparison.

    const strongRendererMatch =
        a.canvasHash === b.canvasHash ||
        a.webglBasicsHash === b.webglBasicsHash;

    const independentMatches = [
        a.fontsHash === b.fontsHash,
        a.mathHash === b.mathHash,
        a.audioHash === b.audioHash,
        a.hardwareHash === b.hardwareHash,
        a.localeHash === b.localeHash,
    ].filter(Boolean).length;

    return strongRendererMatch || independentMatches >= 2;
}

/**
 * Returns true when a similarity result crosses a threshold
 */
export function isSuspiciousSimilarity(
    result: SimilarityResult,
): boolean {
    if (!result.sufficientEvidence) {
        return false;
    }
    // Require either very high overall similarity, or high similarity with multiple strong signals.
    if (
        result.score >= 85 &&
        result.matchingComponents >= 4
    ) {
        return true;
    }

    if (
        result.score >= 75 &&
        result.strongMatches.length >= 2 &&
        result.matchingComponents >= 4
    ) {
        return true;
    }

    return false;
}