interface User { // the database object
    id: bigint,
    username: string,
    display_name: string,
    email: string | Buffer,
    mfa: boolean,
    verified_email: boolean,
    verified: boolean,
    banned: boolean,
    registered_at?: string
}

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

export type { User, UserInfo, MemberInfo, BanInfo };