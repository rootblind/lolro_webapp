import type { User } from "./database_types";

interface BanInfo {
    banned: boolean,
    moderator: string | bigint | null,
    expires: string | bigint | number,
    reason: string,
    timestamp: string | bigint | null
}

interface MemberInfo {
    avatar: string,
    joined_guild_at: number | null,
    premium: boolean
}

interface UserInfo extends User {
    locale: string,
    ban: BanInfo | null,
    member: MemberInfo | null
}

export type { BanInfo, MemberInfo, UserInfo };