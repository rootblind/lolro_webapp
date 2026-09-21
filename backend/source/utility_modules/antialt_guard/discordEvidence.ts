import type {
    DiscordAccountEvidence,
} from "../../interfaces/discord_types.js";

import type { UserInfo } from "../../interfaces/response_types.js";
import { getUserVerificationStatusType } from "../../repositories/VerificationStatusRepo.js";

import { hashEmail } from "./emailHash.js";

export async function buildDiscordAccountEvidence(
    user: UserInfo,
): Promise<DiscordAccountEvidence> {
    const emailHash = hashEmail(user.email);
    const joinedGuildAt = user.member?.joined_guild_at;
    const verificationStatus = await getUserVerificationStatusType(user.id);
    return {
        id: user.id,
        ...(emailHash !== undefined ? { emailHash } : {}),

        emailVerified: user.verified_email,
        mfaEnabled: user.mfa,
        verified: Boolean(verificationStatus),
        banned: user.banned,
        avatar: user.avatar,
        hasPremium: user.premium_active,
        createdAt: user.account_created_at,
        joined_guild_at: joinedGuildAt ? Number(joinedGuildAt) : null
    };
}
