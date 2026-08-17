import type {
    DiscordAccountEvidence,
} from "../../interfaces/discord_types.js";

import type { UserInfo } from "../../interfaces/response_types.js";

import { hashEmail } from "./emailHash.js";

export function buildDiscordAccountEvidence(
    user: UserInfo,
): DiscordAccountEvidence {
    const emailHash = hashEmail(user.email);

    return {
        id: user.id,
        ...(emailHash !== undefined ? { emailHash } : {}),

        emailVerified: user.verified_email,
        mfaEnabled: user.mfa,
        verified: user.verified,
        banned: user.banned,
        guildMember: user.member !== null,
        avatar: user.avatar
    };
}
