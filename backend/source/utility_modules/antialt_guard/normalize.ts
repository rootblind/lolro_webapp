import type { FingerprintAvailability, JsonObject, JsonValue } from "../../interfaces/helper_types.js";

const SCREEN_BUCKET = 16; // diminishing variation by encapsulating multiple screen sizes in buckets

// rounding precision for normalized values
const AUDIO_PRECISION = 2;
const MATH_PRECISION = 12;

/**
 * Highly volatile or just noise fields to be removed after fingerprint normalization
 */
const DROP_FIELDS = new Set([
    "domBlockers",
    "sessionStorage",
    "openDatabase",
    "invertedColors",
    "forcedColors",
    "monochrome",
    "contrast",
    "reducedMotion",
    "reducedTransparency",
    "hdr",
    "screenFrame",
]);

/**
 * The math functions to be taking into consideration for normalization, the rest are ignored
 */
const MATH_KEYS = new Set([
    "acos",
    "asin",
    "atan",
    "cos",
    "exp",
    "log",
    "pow",
    "powPI",
    "sin",
    "tan",
]);

/**
 * Returns true when a value is a JSON object, false otherwise
 */
function isJsonObject(value: JsonValue | undefined): value is JsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Returns the value contained in a FingerprintJS component while also supporting unwrapped values.
 */
export function getComponentValue(value: JsonValue | undefined): JsonValue | undefined {
    if (!isJsonObject(value)) {
        return value;
    }

    if (Object.prototype.hasOwnProperty.call(value, "value")) {
        return value.value;
    }

    return value;
}

/**
 * Deep clone a JSON
 *
 * The method preserves falsy values such as "false", 0 and empty strings.
 */
function cloneJson(value: JsonValue): JsonValue {
    if (value === null || typeof value !== "object") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(cloneJson);
    }

    const output: JsonObject = {};

    for (const [key, child] of Object.entries(value)) {
        output[key] = cloneJson(child);
    }

    return output;
}

/**
 * Recursively removes fields from the value.
 * 
 * @param value A JsonValue
 * 
 * @param fields The fields to be removed from value
 */
function removeFields(
    value: JsonValue,
    fields: ReadonlySet<string>,
): void {
    if (Array.isArray(value)) {
        for (const item of value) {
            removeFields(item, fields);
        }

        return;
    }

    if (!isJsonObject(value)) {
        return;
    }

    for (const key of Object.keys(value)) {
        if (fields.has(key)) {
            delete value[key];
            continue;
        }

        const child = value[key];

        if (child !== null && typeof child === "object") {
            removeFields(child, fields);
        }
    }
}

/**
 * Recursively removes undefined to prepare the value for normalization.
 * 
 * JsonValue can not be undefined but might be under the untyped environment of javascript.
 */
function cleanEmptyValues(value: JsonValue): JsonValue {
    if (Array.isArray(value)) {
        return value.map(cleanEmptyValues);
    }

    if (!isJsonObject(value)) {
        return value;
    }

    const output: JsonObject = {};

    for (const [key, child] of Object.entries(value)) {
        output[key] = cleanEmptyValues(child);
    }

    return output;
}

/**
 * Return the closes multiple of bocket to the value given.
 * 
 * @param value The number to be rounded.
 * 
 * @param bucket The number as base value to determine the rounding based on its multiples.
 */
function bucketNumber(value: number, bucket: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.round(value / bucket) * bucket);
}

/**
 * Normalize an audio fingerprint by setting the precision to avoid noise.
 */
function normalizeAudio(value: JsonValue): JsonValue {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "sanitized";
    }

    return Number(value.toFixed(AUDIO_PRECISION));
}

/**
 * Normalize screen resolution by bucketing screen sizes.
 */
function normalizeScreenResolution(value: JsonValue): JsonValue {
    if (!Array.isArray(value) || value.length < 2) {
        return value;
    }

    const width = Number(value[0]);
    const height = Number(value[1]);

    if (!Number.isFinite(width) || !Number.isFinite(height)) {
        return value;
    }

    return [
        bucketNumber(width, SCREEN_BUCKET),
        bucketNumber(height, SCREEN_BUCKET),
    ];
}

/**
 * Normalize a list of strings.
 */
function normalizeStringArray(value: JsonValue): JsonValue {
    if (!Array.isArray(value)) {
        return value;
    }

    const strings = value.filter(
        (item): item is string => typeof item === "string",
    );

    return [...new Set(strings)].sort((a, b) => a.localeCompare(b));
}

/**
 * Flatten nested arrays while retaining only JSON primitive values.
 */
function flattenJsonArray(value: JsonValue): JsonValue[] {
    if (!Array.isArray(value)) {
        return [value];
    }

    const output: JsonValue[] = [];

    for (const item of value) {
        if (Array.isArray(item)) {
            output.push(...flattenJsonArray(item));
        } else {
            output.push(item);
        }
    }

    return output;
}

/**
 * Normalize languages.
 *
 * Language order is not considered identity. Duplicates and nested arrays are
 * removed, then values are sorted deterministically.
 */
function normalizeLanguages(value: JsonValue): JsonValue {
    const flattened = flattenJsonArray(value);

    const languages = flattened.filter(
        (item): item is string => typeof item === "string",
    );

    return [...new Set(languages)].sort((a, b) => a.localeCompare(b));
}

function normalizeFonts(value: JsonValue): JsonValue {
    return normalizeStringArray(value);
}

/**
 * Extract plugin names and discard browser specific plugin metadata.
 */
function normalizePlugins(value: JsonValue): JsonValue {
    if (!Array.isArray(value)) {
        return value;
    }

    const names: string[] = [];

    for (const plugin of value) {
        if (!isJsonObject(plugin)) {
            continue;
        }

        const name = plugin.name;

        if (typeof name === "string" && name.length > 0) {
            names.push(name);
        }
    }

    return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

/**
 * Keep only the stable winding property from canvas
 */
function normalizeCanvas(value: JsonValue): JsonValue {
    if (!isJsonObject(value)) {
        return value;
    }

    const normalized = cloneJson(value);

    if (!isJsonObject(normalized)) {
        return normalized;
    }

    const componentValue = normalized.value;

    if (!isJsonObject(componentValue)) {
        return normalized;
    }

    const winding = Boolean(componentValue.winding);

    normalized.value = {
        winding,
    };

    return normalized;
}

/**
 * Normalize WebGL basics by cleaning and limiting the string
 */
function normalizeWebGlBasics(value: JsonValue): JsonValue {
    if (typeof value !== "string") {
        return value;
    }

    return value.trim().slice(0, 160);
}

/**
 * Normalize WebGL extension by sorting and deduplicating the list.
 */
function normalizeWebGlExtensions(value: JsonValue): JsonValue {
    if (!Array.isArray(value)) {
        return value;
    }

    const extensions = value.filter(
        (item): item is string => typeof item === "string",
    );

    return [...new Set(extensions)]
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 64);
}

/**
 * Math probes normalization removes keys that are not in MATH_KEYS and after a filtering for valid values
 * 
 * numbers have their precision set to MATH_PRECISION
 */
function normalizeMath(value: JsonValue): JsonValue {
    if (!isJsonObject(value)) {
        return value;
    }

    const rawValue = value.value;

    if (!isJsonObject(rawValue)) {
        return value;
    }

    const normalizedMath: JsonObject = {};

    for (const key of Object.keys(rawValue)) {
        if (!MATH_KEYS.has(key)) {
            continue;
        }

        const numericValue = Number(rawValue[key]);

        if (!Number.isFinite(numericValue)) {
            continue;
        }

        normalizedMath[key] = Number(
            numericValue.toPrecision(MATH_PRECISION),
        );
    }

    return {
        ...value,
        value: normalizedMath,
    };
}

function normalizeTimezone(value: JsonValue): JsonValue {
    if (typeof value !== "string") {
        return value;
    }

    const timezone = value.trim();

    return timezone.length <= 128 ? timezone : timezone.slice(0, 128);
}

/**
 * Offsets are numeric and should remain numeric.
 */
function normalizeTimezoneOffset(value: JsonValue): JsonValue {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return value;
    }

    return Math.trunc(value);
}

/**
 * hardware numbers are truncated to integer values
 */
function normalizeHardwareNumber(value: JsonValue): JsonValue {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return value;
    }

    return Math.max(0, Math.trunc(value));
}

/**
 * Truncate color depth
 */
function normalizeColorDepth(value: JsonValue): JsonValue {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return value;
    }

    return Math.max(0, Math.trunc(value));
}

/**
 * This method calls all normalization functions on the browser fingerprint, processes the results and returns
 * 
 * the normalized fingerprint.
 */
export function normalizeComponents(
    raw: JsonValue = {},
): JsonObject {
    const cloned = cloneJson(raw);

    if (!isJsonObject(cloned)) {
        return {};
    }

    const normalized = cleanEmptyValues(cloned); // initialize the normalization by cleaning undefined values

    if (!isJsonObject(normalized)) {
        return {};
    }

    removeFields(normalized, DROP_FIELDS);

    // canvas
    if (Object.prototype.hasOwnProperty.call(normalized, "canvas")) {
        const canvas = normalized.canvas;
        if (canvas !== undefined) normalized.canvas = normalizeCanvas(canvas);
    }

    // audio
    if (Object.prototype.hasOwnProperty.call(normalized, "audio")) {
        const audio = normalized.audio;

        if (isJsonObject(audio)) {
            const value = audio.value;

            normalized.audio = {
                ...audio,
                value:
                    value !== undefined
                        ? normalizeAudio(value)
                        : "sanitized",
            };
        } else {
            if (audio !== undefined) normalized.audio = normalizeAudio(audio);
        }
    }

    // webgl
    if (Object.prototype.hasOwnProperty.call(normalized, "webGlBasics")) {
        const webGlBasics = normalized.webGlBasics;
        if (webGlBasics !== undefined) normalized.webGlBasics = normalizeWebGlBasics(webGlBasics);
    }

    // webgl extensions
    if (Object.prototype.hasOwnProperty.call(normalized, "webGlExtensions")) {
        const webGlExtensions = normalized.webGlExtensions;
        if (webGlExtensions !== undefined) normalized.webGlExtensions = normalizeWebGlExtensions(webGlExtensions);
    }

    // fonts
    if (Object.prototype.hasOwnProperty.call(normalized, "fonts")) {
        const fonts = normalized.fonts;

        if (isJsonObject(fonts)) {
            normalized.fonts = {
                ...fonts,
                value:
                    fonts.value !== undefined
                        ? normalizeFonts(fonts.value)
                        : [],
            };
        } else {
            if (fonts !== undefined) normalized.fonts = normalizeFonts(fonts);
        }
    }

    // plugins
    if (Object.prototype.hasOwnProperty.call(normalized, "plugins")) {
        const plugins = normalized.plugins;

        if (isJsonObject(plugins)) {
            normalized.plugins = {
                ...plugins,
                value:
                    plugins.value !== undefined
                        ? normalizePlugins(plugins.value)
                        : [],
            };
        } else {
            if (plugins !== undefined) normalized.plugins = normalizePlugins(plugins);
        }
    }

    // langs
    if (Object.prototype.hasOwnProperty.call(normalized, "languages")) {
        const languages = normalized.languages;

        if (isJsonObject(languages)) {
            normalized.languages = {
                ...languages,
                value:
                    languages.value !== undefined
                        ? normalizeLanguages(languages.value)
                        : [],
            };
        } else {
            if (languages !== undefined) normalized.languages = normalizeLanguages(languages);
        }
    }

    // browser math
    if (Object.prototype.hasOwnProperty.call(normalized, "math")) {
        const math = normalized.math;
        if (math !== undefined) normalized.math = normalizeMath(math);
    }

    // screen resolution values
    if (Object.prototype.hasOwnProperty.call(normalized, "screenResolution")) {
        const resolution = normalized.screenResolution;

        if (isJsonObject(resolution) && resolution !== undefined) {
            normalized.screenResolution = {
                ...resolution,
                value:
                    resolution.value !== undefined
                        ? normalizeScreenResolution(resolution.value)
                        : resolution.value,
            } as JsonValue;
        } else {
            if (resolution !== undefined) normalized.screenResolution = normalizeScreenResolution(resolution);
        }
    }


    // deviceMemory is deliberately retained. it has relatively low entropy, but is useful as supporting evidence.
    for (const field of [
        "hardwareConcurrency",
        "deviceMemory",
        "colorDepth",
    ] as const) {
        if (!Object.prototype.hasOwnProperty.call(normalized, field)) {
            continue;
        }

        const component = normalized[field];

        if (isJsonObject(component)) {
            const value = component.value;

            if (value !== undefined) {
                const normalizedValue =
                    field === "colorDepth"
                        ? normalizeColorDepth(value)
                        : normalizeHardwareNumber(value);

                normalized[field] = {
                    ...component,
                    value: normalizedValue,
                };
            }
        } else if (component !== undefined) {
            const normalizedValue =
                field === "colorDepth"
                    ? normalizeColorDepth(component)
                    : normalizeHardwareNumber(component);

            normalized[field] = normalizedValue;
        }
    }

    // time related normalization

    if (Object.prototype.hasOwnProperty.call(normalized, "timezone")) {
        const timezone = normalized.timezone;

        if (isJsonObject(timezone)) {
            normalized.timezone = {
                ...timezone,
                value:
                    timezone.value !== undefined
                        ? normalizeTimezone(timezone.value)
                        : timezone.value,
            } as JsonValue;
        } else {
            if (timezone !== undefined) normalized.timezone = normalizeTimezone(timezone);
        }
    }
    if (
        Object.prototype.hasOwnProperty.call(
            normalized,
            "timezoneOffset",
        )
    ) {
        const timezoneOffset = normalized.timezoneOffset;
        if (timezoneOffset) normalized.timezoneOffset = normalizeTimezoneOffset(timezoneOffset);
    }

    return normalized;
}

export function hasAvailableValue(value: JsonValue | undefined): boolean {
    if (value === undefined || value === null) {
        return false;
    }

    if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        "value" in value
    ) {
        return hasAvailableValue(value.value);
    }

    if (typeof value === "string") {
        return value.length > 0;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    if (typeof value === "object") {
        return Object.keys(value).length > 0;
    }

    // numbers and booleans, including 0 and false, are valid values.
    return true;
}

export function buildAvailability(
    normalized: JsonObject,
): FingerprintAvailability {
    return {
        canvas: hasAvailableValue(normalized.canvas),
        webGlBasics: hasAvailableValue(normalized.webGlBasics),
        fonts: hasAvailableValue(normalized.fonts),
        audio: hasAvailableValue(normalized.audio),
        math: hasAvailableValue(normalized.math),
        webGlExtensions: hasAvailableValue(normalized.webGlExtensions),
        hardwareConcurrency: hasAvailableValue(
            normalized.hardwareConcurrency,
        ),
        platform: hasAvailableValue(normalized.platform),
        architecture: hasAvailableValue(normalized.architecture),
        deviceMemory: hasAvailableValue(normalized.deviceMemory),
        timezone: hasAvailableValue(normalized.timezone),
        timezoneOffset: hasAvailableValue(
            normalized.timezoneOffset,
        ),
        languages: hasAvailableValue(normalized.languages),
        colorDepth: hasAvailableValue(normalized.colorDepth),
        screenResolution: hasAvailableValue(
            normalized.screenResolution,
        ),
    };
}