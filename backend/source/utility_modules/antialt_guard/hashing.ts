
import crypto from "node:crypto";

import type {
    JsonObject,
    JsonValue,
} from "../../interfaces/helper_types.js";

import { getComponentValue } from "./normalize.js";

export interface FingerprintHashes {
    // individual hashing
    platformHash: string;
    architectureHash: string;
    osCpuHash: string;
    hardwareConcurrencyHash: string;
    deviceMemoryHash: string;

    canvasHash: string;
    audioHash: string;
    webglBasicsHash: string;
    webglExtensionsHash: string;
    fontsHash: string;
    pluginsHash: string;
    mathHash: string;

    timezoneHash: string;
    timezoneOffsetHash: string;
    languagesHash: string;
    screenResolutionHash: string;
    colorDepthHash: string;

    // group hashing
    hardwareHash: string;
    rendererHash: string;
    softwareHash: string;
    localeHash: string;
    displayHash: string;

    // scoped hashing
    minimizedHash: string;
    fullSanitizedHash: string;
    crossBrowserHash: string;
}

interface HashableComponent {
    [key: string]: JsonValue;
}

/**
 * Canonicalize JSON deterministically.
 *
 * Important:
 * - false is retained
 * - 0 is retained
 * - "" is retained
 * - null is retained
 * - object keys are sorted
 * - array order is preserved
 *
 * Array order is intentionally preserved here. Individual normalizers such as
 * fonts/languages/WebGL extensions are responsible for sorting arrays where
 * ordering is not semantically meaningful.
 */
function canonicalize(value: JsonValue): JsonValue {
    if (value === null || typeof value !== "object") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }

    const object = value as JsonObject;
    const output: JsonObject = {};

    for (const key of Object.keys(object).sort()) {
        const child = object[key];

        if (child !== undefined) {
            output[key] = canonicalize(child);
        }
    }

    return output;
}

/**
 * Hash the canonical value of a JSON.
 * 
 * Using sha256
 */
function hashValue(value: JsonValue): string {
    const canonical = canonicalize(value);

    return crypto
        .createHash("sha256")
        .update(JSON.stringify(canonical), "utf8")
        .digest("hex");
}

function componentValue(
    normalized: JsonObject,
    key: string,
): JsonValue {
    const value = normalized[key];

    if (value === undefined) {
        return null;
    }

    return getComponentValue(value) ?? null;
}

/**
 * Extract an object containing selected components.
 *
 * Missing properties are represented as null. This makes the hash structure
 * deterministic while allowing the similarity engine to separately determine
 * whether a component was actually present.
 */
function selectComponents(
    normalized: JsonObject,
    keys: readonly string[],
): JsonObject {
    const output: JsonObject = {};

    for (const key of keys) {
        output[key] = componentValue(normalized, key);
    }

    return output;
}

/**
 * Normalize a user agent to browser family + major version.
 *
 * Example: Chrome/138.0.7204.51 to Chrome 138
 */
export function normalizeUserAgent(userAgent: string): string {
    const ua = userAgent.trim();

    if (ua.length === 0) {
        return "Unknown";
    }

    const edge = /(?:Edg|EdgiOS|EdgA)\/(\d+)/i.exec(ua);

    if (edge?.[1] !== undefined) {
        return `Edge ${edge[1]}`;
    }

    const opera = /(?:OPR|Opera)\/(\d+)/i.exec(ua);

    if (opera?.[1] !== undefined) {
        return `Opera ${opera[1]}`;
    }

    const firefox = /(?:Firefox|FxiOS)\/(\d+)/i.exec(ua);

    if (firefox?.[1] !== undefined) {
        return `Firefox ${firefox[1]}`;
    }

    const chrome = /(?:Chrome|CriOS)\/(\d+)/i.exec(ua);

    if (chrome?.[1] !== undefined) {
        return `Chrome ${chrome[1]}`;
    }

    const safari = /Version\/(\d+).*Safari\//i.exec(ua);

    if (safari?.[1] !== undefined) {
        return `Safari ${safari[1]}`;
    }


    // fall back to a bounded representation rather than hashing an arbitrary UA string.
    return ua.slice(0, 128);
}

// the following arrays are used to select these components out of the normalized fingerprint
// to create independent hashes and grouped hashes
const HARDWARE_COMPONENTS = [
    "platform",
    "architecture",
    "osCpu",
    "hardwareConcurrency",
    "deviceMemory",
] as const;

const RENDERER_COMPONENTS = [
    "canvas",
    "audio",
    "webGlBasics",
    "webGlExtensions",
] as const;

const SOFTWARE_COMPONENTS = [
    "fonts",
    "plugins",
    "math",
] as const;

const LOCALE_COMPONENTS = [
    "timezone",
    "timezoneOffset",
    "languages",
] as const;

const DISPLAY_COMPONENTS = [
    "screenResolution",
    "colorDepth",
] as const;

/**
 * Build all hashes used by the anti-alt detection system.
 *
 * rawCanvasHash is optional because the current normalize.ts deliberately
 * sanitizes canvas down to the winding property. A real canvas rendering hash
 * should be generated before normalization if available.
 */
export function buildHashes(
    normalized: JsonObject,
    userAgent: string,
    rawCanvasHash?: string,
): FingerprintHashes {
    const hardware = selectComponents(
        normalized,
        HARDWARE_COMPONENTS,
    );

    const renderer = selectComponents(
        normalized,
        RENDERER_COMPONENTS,
    );

    const software = selectComponents(
        normalized,
        SOFTWARE_COMPONENTS,
    );

    const locale = selectComponents(
        normalized,
        LOCALE_COMPONENTS,
    );

    const display = selectComponents(
        normalized,
        DISPLAY_COMPONENTS,
    );

    // individual hashes
    const canvasHash =
        rawCanvasHash !== undefined
            ? rawCanvasHash
            : hashValue(componentValue(normalized, "canvas"));

    const audioHash = hashValue(
        componentValue(normalized, "audio"),
    );

    const webglBasicsHash = hashValue(
        componentValue(normalized, "webGlBasics"),
    );

    const webglExtensionsHash = hashValue(
        componentValue(normalized, "webGlExtensions"),
    );

    const fontsHash = hashValue(
        componentValue(normalized, "fonts"),
    );

    const pluginsHash = hashValue(
        componentValue(normalized, "plugins"),
    );

    const mathHash = hashValue(
        componentValue(normalized, "math"),
    );

    const platformHash = hashValue(
        componentValue(normalized, "platform"),
    );

    const architectureHash = hashValue(
        componentValue(normalized, "architecture"),
    );

    const osCpuHash = hashValue(
        componentValue(normalized, "osCpu"),
    );

    const hardwareConcurrencyHash = hashValue(
        componentValue(normalized, "hardwareConcurrency"),
    );

    const deviceMemoryHash = hashValue(
        componentValue(normalized, "deviceMemory"),
    );

    const timezoneHash = hashValue(
        componentValue(normalized, "timezone"),
    );

    const timezoneOffsetHash = hashValue(
        componentValue(normalized, "timezoneOffset"),
    );

    const languagesHash = hashValue(
        componentValue(normalized, "languages"),
    );

    const screenResolutionHash = hashValue(
        componentValue(normalized, "screenResolution"),
    );

    const colorDepthHash = hashValue(
        componentValue(normalized, "colorDepth"),
    );

    const hardwareHash = hashValue(hardware);
    const rendererHash = hashValue(renderer);
    const softwareHash = hashValue(software);
    const localeHash = hashValue(locale);
    const displayHash = hashValue(display);

    // scoped hashes

    // minimum relevant fingerprint components
    const minimized = selectComponents(normalized, [
        "platform",
        "architecture",
        "hardwareConcurrency",
        "deviceMemory",
        "languages",
    ]);
    const minimizedHash = hashValue(minimized);

    const normalizedUa = normalizeUserAgent(userAgent);

    const fullSanitized: JsonObject = {
        ...normalized,
        userAgent: normalizedUa,
    };

    const fullSanitizedHash = hashValue(fullSanitized);


    // it is designed to survive a browser change while still identifying a
    // collection of relatively stable device characteristics.
    const crossBrowser: HashableComponent = {
        platform: componentValue(normalized, "platform"),
        architecture: componentValue(normalized, "architecture"),
        hardwareConcurrency: componentValue(
            normalized,
            "hardwareConcurrency",
        ),
        deviceMemory: componentValue(
            normalized,
            "deviceMemory",
        ),
        fonts: componentValue(normalized, "fonts"),
        math: componentValue(normalized, "math"),
        colorDepth: componentValue(normalized, "colorDepth"),
        timezoneOffset: componentValue(
            normalized,
            "timezoneOffset",
        ),
    };

    const crossBrowserHash = hashValue(crossBrowser);

    return {
        platformHash,
        architectureHash,
        osCpuHash,
        hardwareConcurrencyHash,
        deviceMemoryHash,
        canvasHash,
        audioHash,
        webglBasicsHash,
        webglExtensionsHash,
        fontsHash,
        pluginsHash,
        mathHash,
        timezoneHash,
        timezoneOffsetHash,
        languagesHash,
        screenResolutionHash,
        colorDepthHash,
        hardwareHash,
        rendererHash,
        softwareHash,
        localeHash,
        displayHash,
        minimizedHash,
        fullSanitizedHash,
        crossBrowserHash,
    };
}
