import "express-session";
import type { BanInfo, MemberInfo, UserInfo } from "../interfaces/response_types.js";

declare module "express-session" {
    interface SessionData {
        user?: UserInfo,
        discordRefreshToken?: any,
        captcha?: any,
        identity?: any
    }
}