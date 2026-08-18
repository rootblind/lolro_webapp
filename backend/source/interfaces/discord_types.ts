/** 
 * Discord-side evidence used by the anti-alt risk engine.
 * 
 * Timestamps such as createdAt and joined_guild_at are in seconds 
*/
export interface DiscordAccountEvidence {
    readonly id: string;
    readonly emailHash?: string;
    readonly emailVerified: boolean;
    readonly mfaEnabled: boolean;
    readonly verified: boolean;
    readonly banned: boolean;
    readonly avatar?: string | null;
    readonly hasPremium?: boolean;
    readonly createdAt?: number;
    readonly joined_guild_at?: number | null;
}