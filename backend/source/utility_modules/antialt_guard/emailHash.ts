import crypto from "node:crypto";

/**
 * Normalize an email address before hashing.
 */
export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function hashEmail(email: string | null | undefined): string | undefined {
    if (typeof email !== "string") {
        return undefined;
    }

    const normalized = normalizeEmail(email);

    if (normalized.length === 0) {
        return undefined;
    }

    return crypto
        .createHash("sha256")
        .update(normalized, "utf8")
        .digest("hex");
}
