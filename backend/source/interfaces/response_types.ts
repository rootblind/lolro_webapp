import type { User, VerificationStatusType } from "./database_types";

interface BanInfo {
    banned: boolean,
    moderator: string | null,
    expires: string | number,
    reason: string,
    timestamp: string | null,
    account_created_at: number
}

interface MemberInfo {
    avatar: string | null,
    joined_guild_at: string,
    account_created_at: number
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

export interface UserSession {
    id: string,
    emailVerified: boolean,
    mfaEnabled: boolean,
    verified: boolean,
    banned: boolean,
    isMember: boolean
}

export interface VerificationAssessmentResponse {
    success: boolean,
    verification_status: VerificationStatusType,
    banned?: boolean
}

export type { BanInfo, MemberInfo, UserInfo };