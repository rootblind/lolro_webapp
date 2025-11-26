import crypto from "crypto";
import type { JsonValue, JsonObject, FingerprintHashes, CrossBrowserHash } from "../interfaces/helper_types.js";
import { hasValueProp } from "./utility_methods.js";

export function hashObject(obj: JsonObject): string {
  const canon = canonicalize(obj);
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(canon))
    .digest("hex");
}

export function canonicalize(obj: JsonValue): JsonValue {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);

  const record = obj as JsonObject;
  const out: JsonObject = {};
  for (const key of Object.keys(record).sort()) {
    if(record[key]) out[key] = canonicalize(record[key]);
  }

  return out;
}

function flattenDeep(arr: unknown[]): unknown[] {
  const out: unknown[] = [];
  for (const item of arr) {
    if (Array.isArray(item)) out.push(...flattenDeep(item));
    else out.push(item);
  }
  return out;
}


export function normalizeComponents(raw: JsonValue = {}): JsonObject {
  const c = JSON.parse(JSON.stringify(raw)) as JsonObject;

  (function removeDurations(o: JsonValue): void {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) {
      o.forEach(removeDurations);
      return;
    }

    const obj = o as JsonObject;

    for (const k of Object.keys(obj)) {
      if (k === "duration") {
        delete obj[k];
      } else {
        if(obj[k]) removeDurations(obj[k]);
      }
      
    }
  })(c);

  // sanitize canvas
  if(typeof c.canvas === "object" && c.canvas && "value" in c.canvas) {
    const val = (c.canvas as JsonObject).value;
    if(val && typeof val === "object") {
      (val as JsonObject).text = "";
      if ("geometry" in val) (val as JsonObject).geometry = "sanitized";

      (c.canvas as JsonObject).value = { winding: Boolean((val as JsonObject).winding) };
    }
  }
  

  // sanitize audio
  if (c.audio && typeof (c.audio as JsonObject).value === "number") {
    (c.audio as JsonObject).value = Math.round(Number((c.audio as JsonObject).value));
  } else if (c.audio) {
    (c.audio as JsonObject).value = "sanitized";
  }

  // sanitize webgl
  if (c.webGlBasics) c.webGlBasics = String(c.webGlBasics).slice(0, 80);

  if (c.webGlExtensions) {
    c.webGlExtensions = Array.isArray(c.webGlExtensions)
      ? c.webGlExtensions.slice(0, 20)
      : c.webGlExtensions;
  }

  // fonts
  if (typeof c.fonts === "object" && c.fonts && "value" in c.fonts && Array.isArray(c.fonts.value)) {
    const strings = c.fonts.value.filter(
      (x: unknown): x is string => typeof x === "string"
    );

    const unique = Array.from(new Set(strings)) as string[];

    unique.sort((a, b) => a.localeCompare(b)); // 'a' and 'b' are string

    c.fonts.value = unique;
  }

  // plugins
  if (c.plugins && typeof c.plugins === "object" && "value" in c.plugins) {
    const arr = c.plugins.value;
    if(Array.isArray(arr)) {
      const names = arr
        .map((p): string =>
          typeof p === "object" && p && "name" in p && typeof p.name === "string" ?
          p.name : ""
        
        )
        .filter(Boolean);
        c.plugins.value = [...new Set(names)].sort();
      }
  }

  // languages
  if (typeof c.languages === "object" && c.languages && "value" in c.languages) {
    const langArr = c.languages.value;
    if(Array.isArray(langArr)) {
      const flat = flattenDeep(langArr).filter(
        (x): x is JsonValue => x !== undefined && x !== null
      );
      const uniq = Array.from(new Set(flat)).sort();
      c.languages.value = uniq;
    }
  }

  // math normalization
  if (c.math && typeof c.math === "object" && "value" in c.math && typeof c.math.value === "object") {
    if(!Array.isArray(c.math.value)) {
      const mathObj = c.math.value as JsonObject;
      for (const k of Object.keys(mathObj)) {
        const v = Number(mathObj[k]);
        if (!Number.isNaN(v) && Number.isFinite(v)) {
          mathObj[k] = Number(v.toPrecision(12));
        }
      }
    }
    
  }

  // screenResolution
  if (c.screenResolution && typeof c.screenResolution === "object" && "value" in c.screenResolution) {
    const scrResArr = c.screenResolution.value;
    if(Array.isArray(scrResArr)) {
      const [w, h] = scrResArr.map((n): number => Number(n) || 0);
      (c.screenResolution as JsonObject).value = [
        Math.max(0, Math.round(w!)),
        Math.max(0, Math.round(h!)),
      ];
    }
    
  }

  // drop volatile fields
  const drop = [
    "domBlockers",
    "deviceMemory",
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
  ] as const;

  for (const k of drop) delete c[k];

  return c;
}

export function buildHashes(normalized: JsonObject, userAgent: string): FingerprintHashes {
  const system: JsonObject = {
    platform: normalized.platform ?? null,
    osCpu: normalized.osCpu ?? null,
    architecture: normalized.architecture ?? null,
    hardwareConcurrency: normalized.hardwareConcurrency ?? null,
  };

  const renderer: JsonObject = {
    canvas: normalized.canvas ?? null,
    audio: normalized.audio ?? null,
    webGlBasics: normalized.webGlBasics ?? null,
    webGlExtensions: normalized.webGlExtensions ?? null,
    fonts: normalized.fonts ?? null,
    plugins: normalized.plugins ?? null,
    math: normalized.math ?? null,
  };

  const prefs: JsonObject = {
    timezone: normalized.timezone ?? null,
    languages: normalized.languages ?? null,
    screenResolution: normalized.screenResolution ?? null,
    colorDepth: normalized.colorDepth ?? null,
  };

  const minimized: JsonObject = {
    platform: normalized.platform ?? null,
    architecture: normalized.architecture ?? null,
    hardwareConcurrency: normalized.hardwareConcurrency ?? null,
    languages: normalized.languages ?? null,
  };

  const fullSanitizedHash: JsonObject = { ...normalized, userAgent };

  return {
    systemHash: hashObject(system),
    rendererHash: hashObject(renderer),
    prefsHash: hashObject(prefs),
    minimizedHash: hashObject(minimized),
    fullSanitizedHash: hashObject(fullSanitizedHash),
  };
}

export function buildCrossBrowserHash(normalized: JsonObject): string {
  
  let fonts: JsonValue[] = [];
  if (normalized.fonts && hasValueProp(normalized.fonts) && Array.isArray(normalized.fonts.value)) {
    fonts = Array.from(new Set(normalized.fonts.value)).sort();
  }
  
  const mathKeys = ["powPI", "acos", "sin"] as const;
  const math: JsonObject = {};

  if (normalized.math && 
    hasValueProp(normalized.math) &&
    typeof normalized.math.value === "object" &&
    !Array.isArray(normalized.math.value)
  
  ) {
    const mathObj = normalized.math.value as JsonObject;
    for (const k of mathKeys) {
      if (mathObj[k] != null) {
        math[k] = Number(mathObj[k]).toPrecision(5);
      }
    }
  }

  const cross: CrossBrowserHash = {
    platform: hasValueProp(normalized.platform!)
      ? normalized.platform.value ?? null
      : normalized.platform ?? null,

    osCpu: hasValueProp(normalized.osCpu!)
      ? normalized.osCpu.value ?? null
      : normalized.osCpu ?? null,

    architecture: hasValueProp(normalized.architecture!)
      ? normalized.architecture.value ?? null
      : normalized.architecture ?? null,

    hardwareConcurrency: hasValueProp(normalized.hardwareConcurrency!)
      ? normalized.hardwareConcurrency.value ?? null
      : normalized.hardwareConcurrency ?? null,

    fonts,
    math,

    colorDepth: hasValueProp(normalized.colorDepth!)
      ? normalized.colorDepth.value ?? null
      : normalized.colorDepth ?? null,

    pdfViewerEnabled: hasValueProp(normalized.pdfViewerEnabled!)
      ? normalized.pdfViewerEnabled.value ?? null
      : null,

    timezoneOffset: normalized.timezoneOffset ?? null,
  };


  return hashObject(cross);
}
