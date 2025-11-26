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

export interface FingerprintHashes {
    systemHash: string;
    rendererHash: string;
    prefsHash: string;
    minimizedHash: string;
    fullSanitizedHash: string;
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
    platform: JsonValue | null;
    timezone: JsonValue | null;
    browserVendor: JsonValue | null;
    fonts: JsonValue | null;
    screenResolution: JsonValue | null;
    hardwareConcurrency: JsonValue | null;
    languages: JsonValue | null;
    userAgent: string | null;
}

export interface Fingerprint {
    hashes: FingerprintHashes;
    crossHash: string; // the hash of CrossBrowserHash
    weights: FingerprintWeights;
}
