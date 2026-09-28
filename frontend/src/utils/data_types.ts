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
    member: MemberInfo | null,
    isAdmin: boolean,
    avatar: string | null,
    premium_active: boolean,
    verification_status_type?: VerificationStatusType | null
}

export type VerificationStatusType = "pending" | "accepted" | "denied";

export type { User, UserInfo, MemberInfo, BanInfo };

export type RiskAction =
    | "allow" // simply verify the user
    | "additional_verification" // verify the user but log the risk assessment
    | "manual_review" // log the assessment but require manual moderator verification, no verification given
    | "deny_verification"; // deny verification and ban the account