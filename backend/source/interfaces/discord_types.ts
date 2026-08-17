/** 
 * Discord-side evidence used by the anti-alt risk engine. 
*/
export interface DiscordAccountEvidence {
    readonly id: string;
    readonly emailHash?: string;
    readonly emailVerified: boolean;
    readonly mfaEnabled: boolean;
    readonly verified: boolean;
    readonly banned: boolean;
    readonly guildMember: boolean;
    readonly avatar: string | null;
    readonly createdAt?: number;
    readonly firstSeenAt?: number;
    readonly verifiedAt?: number;
}