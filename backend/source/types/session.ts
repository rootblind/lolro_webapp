import "express-session";
import type { BanInfo, MemberInfo } from "../interfaces/response_types.js";

declare module "express-session" {
    interface SessionData {
        user?: {
            id: string,
            username: string,
            display_name: string,
            clan: any,
            mfa: boolean,
            locale: string,
            email: string,
            verified_email: boolean,
            verified: boolean,
            banned: boolean,
            ban: BanInfo | null,
            member: MemberInfo | null
        },
        discordRefreshToken?: any,
        captcha?: any,
        identity?: any
    }
}