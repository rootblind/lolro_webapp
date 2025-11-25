import crypto from "crypto";

export function hashObject(obj: any): string {
  const canon = canonicalize(obj);
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(canon))
    .digest("hex");
}

export function canonicalize(obj: any): any {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);

  const keys = Object.keys(obj).sort();
  const out: Record<string, any> = {};
  for (const k of keys) out[k] = canonicalize(obj[k]);
  return out;
}

export function normalizeComponents(raw: any = {}): any {
  const c = JSON.parse(JSON.stringify(raw));

  (function removeDurations(o: any) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) {
      o.forEach(removeDurations);
      return;
    }
    for (const k of Object.keys(o)) {
      if (k === "duration") {
        delete o[k];
        continue;
      }
      removeDurations(o[k]);
    }
  })(c);

  // sanitize canvas
  if (c.canvas?.value) {
    c.canvas.value.text = "";
    if ("geometry" in c.canvas.value) c.canvas.value.geometry = "sanitized";

    c.canvas.value = { winding: !!c.canvas.value.winding };
  }

  // sanitize audio
  if (c.audio && typeof c.audio.value === "number") {
    c.audio.value = Math.round(c.audio.value);
  } else if (c.audio) {
    c.audio.value = "sanitized";
  }

  // sanitize webgl
  if (c.webGlBasics) c.webGlBasics = String(c.webGlBasics).slice(0, 80);

  if (c.webGlExtensions) {
    c.webGlExtensions = Array.isArray(c.webGlExtensions)
      ? c.webGlExtensions.slice(0, 20)
      : c.webGlExtensions;
  }

  // fonts
  if (c.fonts?.value && Array.isArray(c.fonts.value)) {
    const strings = c.fonts.value.filter(
      (x: any): x is string => typeof x === "string"
    );

    const unique = Array.from(new Set(strings)) as string[];

    unique.sort((a, b) => a.localeCompare(b)); // ✔ 'a' and 'b' are string

    c.fonts.value = unique;
  }




  // plugins
  if (c.plugins?.value && Array.isArray(c.plugins.value)) {
    const names = c.plugins.value
      .map((p: any) => (p?.name ? p.name : ""))
      .filter(Boolean);
    const uniq = Array.from(new Set(names)).sort();
    c.plugins.value = uniq;
  }

  // languages
  if (c.languages?.value && Array.isArray(c.languages.value)) {
    const flat = c.languages.value.flat(Infinity).filter(Boolean);
    const uniq = Array.from(new Set(flat)).sort();
    c.languages.value = uniq;
  }

  // math normalization
  if (c.math?.value) {
    for (const k of Object.keys(c.math.value)) {
      const v = Number(c.math.value[k]);
      if (!Number.isNaN(v) && Number.isFinite(v)) {
        c.math.value[k] = Number(v.toPrecision(12));
      }
    }
  }

  // screenResolution
  if (c.screenResolution?.value && Array.isArray(c.screenResolution.value)) {
    const [w, h] = c.screenResolution.value.map((n: any) => Number(n) || 0);
    c.screenResolution.value = [
      Math.max(0, Math.round(w)),
      Math.max(0, Math.round(h)),
    ];
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

export function buildHashes(normalized: any, userAgent: string) {
  const system = {
    platform: normalized.platform,
    osCpu: normalized.osCpu,
    architecture: normalized.architecture,
    hardwareConcurrency: normalized.hardwareConcurrency,
  };

  const renderer = {
    canvas: normalized.canvas,
    audio: normalized.audio,
    webGlBasics: normalized.webGlBasics,
    webGlExtensions: normalized.webGlExtensions,
    fonts: normalized.fonts,
    plugins: normalized.plugins,
    math: normalized.math,
  };

  const prefs = {
    timezone: normalized.timezone,
    languages: normalized.languages,
    screenResolution: normalized.screenResolution,
    colorDepth: normalized.colorDepth,
  };

  const minimized = {
    platform: normalized.platform,
    architecture: normalized.architecture,
    hardwareConcurrency: normalized.hardwareConcurrency,
    languages: normalized.languages,
  };

  const fullSanitizedHash = { ...normalized, userAgent };

  return {
    systemHash: hashObject(system),
    rendererHash: hashObject(renderer),
    prefsHash: hashObject(prefs),
    minimizedHash: hashObject(minimized),
    fullSanitizedHash: hashObject(fullSanitizedHash),
  };
}

export function buildCrossBrowserHash(normalized: any) {
  const fonts = normalized.fonts?.value
    ? [...new Set(normalized.fonts.value)].sort()
    : null;

  const mathKeys = ["powPI", "acos", "sin"] as const;
  const math: Record<string, string | undefined> = {};

  if (normalized.math?.value) {
    for (const k of mathKeys) {
      if (normalized.math.value[k] != null) {
        math[k] = Number(normalized.math.value[k]).toPrecision(9);
      }
    }
  }

  const cross = {
    platform: normalized.platform?.value ?? normalized.platform ?? null,
    osCpu: normalized.osCpu?.value ?? normalized.osCpu ?? null,
    architecture:
      normalized.architecture?.value ?? normalized.architecture ?? null,
    hardwareConcurrency:
      normalized.hardwareConcurrency?.value ??
      normalized.hardwareConcurrency ??
      null,
    fonts,
    math,
    colorDepth: normalized.colorDepth?.value ?? normalized.colorDepth ?? null,
    pdfViewerEnabled: normalized.pdfViewerEnabled?.value ?? null,
    timezoneOffset: normalized.timezoneOffset ?? null,
  };

  return hashObject(cross);
}
