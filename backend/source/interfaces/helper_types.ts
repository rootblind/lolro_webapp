import type { FingerprintHashes } from "../utility_modules/antialt_guard/hashing";

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | JsonValue[]
    | JsonObject;

export interface JsonObject {
    [key: string]: JsonValue
}

export interface CrossBrowserHash {
    [key: string]: JsonValue | JsonValue[] | JsonObject | null,
    platform: JsonValue | null;
    osCpu: JsonValue | null;
    architecture: JsonValue | null;
    hardwareConcurrency: JsonValue | null;
    fonts: JsonValue[];
    math: JsonObject;
    colorDepth: JsonValue | null;
    pdfViewerEnabled: JsonValue | null;
    timezoneOffset: JsonValue | null;
}

export interface FingerprintWeights {
    availability: FingerprintAvailability;
    userAgent: string | null;
}

export interface Fingerprint {
    hashes: FingerprintHashes;
    weights: FingerprintWeights;
}

export interface FingerprintAvailability {
    canvas: boolean;
    webGlBasics: boolean;
    fonts: boolean;
    audio: boolean;
    math: boolean;
    webGlExtensions: boolean;
    hardwareConcurrency: boolean;
    platform: boolean;
    architecture: boolean;
    deviceMemory: boolean;
    timezone: boolean;
    timezoneOffset: boolean;
    languages: boolean;
    colorDepth: boolean;
    screenResolution: boolean;
}

type CronChar = "*" | "/" | "-" | "," | `${number}`;
type CronField = `${CronChar}${string}` | CronChar;

type CronString =
    `${CronField} ${CronField} ${CronField} ${CronField} ${CronField}`;

/**
 * @param name The name of the task
 * @param schedule CronString for scheduling the cron task
 * @param job Async function to execute as the cron's task job
 * @param runCondition Async function to start the cron task if true or to pause it if it returns false
 * 
 * Interface for objects to be used in the cron_task_loader
 */
export interface CronTaskBuilder {
    name: string,
    schedule: CronString;
    job: () => Promise<void>;
    runCondition: () => Promise<boolean>

}

export type FingerprintComponentType = keyof FingerprintAvailability;