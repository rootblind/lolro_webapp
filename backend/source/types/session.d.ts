import "express-session";
import type {  UserInfo } from "../interfaces/response_types.js";
import type { Fingerprint } from "../interfaces/helper_types.js";

declare module "express-session" {
    interface SessionData {
        user?: UserInfo,
        discordRefreshToken?: string,
        captcha?: {
            text: string,
            solved: boolean
        },
        identity?: {
            createdAt: string,
            ip: string | null,
            fingerprint: Fingerprint

        }
    }
}