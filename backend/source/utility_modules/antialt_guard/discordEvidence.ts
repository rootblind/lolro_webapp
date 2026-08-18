import type {
    DiscordAccountEvidence,
} from "../../interfaces/discord_types.js";

import type { UserInfo } from "../../interfaces/response_types.js";

import { hashEmail } from "./emailHash.js";

export function buildDiscordAccountEvidence(
    user: UserInfo,
): DiscordAccountEvidence {
    const emailHash = hashEmail(user.email);
    const joinedGuildAt = user.member?.joined_guild_at;
    return {
        id: user.id,
        ...(emailHash !== undefined ? { emailHash } : {}),

        emailVerified: user.verified_email,
        mfaEnabled: user.mfa,
        verified: user.verified,
        banned: user.banned,
        avatar: user.avatar,
        hasPremium: user.premium_active,
        createdAt: user.account_created_at,
        joined_guild_at: joinedGuildAt ? Number(joinedGuildAt) : null
    };
}
