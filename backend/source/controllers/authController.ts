import url from "url";
import axios from "axios";
import { config } from "dotenv";
import botapi from "../config/botapi.js";
import {
    isUserVerified,
    putUser,
} from "../repositories/UserRepo.js";
import {
    get_env_var,
} from "../utility_modules/utility_methods.js";

import type {
    Request,
    Response,
} from "express";

import type {
    User,
} from "../interfaces/database_types.js";
import type { BanInfo } from "../interfaces/response_types.js";

config();

/**
 * At the moment it consists of env defined admin ids.
 */
function isAdminAccount(discordId: string): boolean {
    const raw = process.env.ADMIN_DISCORD_IDS ?? "";

    const ids = raw
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);

    return ids.includes(discordId);
}

interface DiscordOAuthTokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

interface DiscordUserResponse {
    id: string;
    username: string;
    global_name: string | null;
    email: string | null;
    verified: boolean;
    mfa_enabled: boolean;
    locale: string;
}

interface DiscordBanResponse {
    banned: boolean;
    ban: unknown | null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const refreshAccessToken = async (refreshToken: string): Promise<DiscordOAuthTokenResponse> => {
    const refreshData = new url.URLSearchParams({
        client_id: get_env_var("CLIENT_ID"),
        client_secret: get_env_var("CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: refreshToken
    });

    const response = await axios.post<DiscordOAuthTokenResponse>(
        "https://discord.com/api/oauth2/token",
        refreshData,
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    return response.data;
};

export const getDiscordAuth = async (req: Request, res: Response) => {
    const { code } = req.query;

    const host = get_env_var("HOST");
    const host_front = get_env_var("HOST_FRONT");
    const frontPort = Number(get_env_var("FRONT_PORT"));
    const port = Number(get_env_var("PORT"));

    if (typeof code !== "string" || code.length === 0) {
        return res.redirect(`${host_front}:${frontPort}/`);
    }

    try {
        // exchange oauth code
        const formatData = new url.URLSearchParams({
            client_id: get_env_var("CLIENT_ID"),
            client_secret: get_env_var("CLIENT_SECRET"),
            grant_type: "authorization_code",
            code,
            redirect_uri: `${host}:${port}/api/auth/`,
        });

        const tokenResponse = await axios.post<DiscordOAuthTokenResponse>(
            "https://discord.com/api/oauth2/token",
            formatData,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );
        const token = tokenResponse.data;

        // fetch discord api data
        const userResponse = await axios.get<DiscordUserResponse>(
            "https://discord.com/api/users/@me",
            {
                headers: {
                    Authorization: `Bearer ${token.access_token}`
                }
            }
        );

        const discordUser = userResponse.data;

        // initialize identity with discord data
        req.session.user = {
            id: discordUser.id,
            username: discordUser.username,
            display_name: discordUser.global_name ?? discordUser.username,
            mfa: discordUser.mfa_enabled,
            locale: discordUser.locale,
            email: discordUser.email ?? "",
            verified_email: discordUser.verified,
            verified: false,
            banned: false,
            ban: null,
            member: null,
            isAdmin: isAdminAccount(discordUser.id),
        };

        req.session.discordRefreshToken = token.refresh_token;

        // fetch data from bot api
        try {
            const memberResponse = await botapi.get(
                "/member/info",
                {
                    params: {
                        guild_id: get_env_var("GUILD"),
                        member_id: discordUser.id
                    }
                }
            );

            req.session.user.member = memberResponse.data.member;

            // if not a member, check the banned status of the user
            if (!memberResponse.data.member) {
                try {
                    const banResponse = await botapi.get<DiscordBanResponse>(
                        "/ban/info",
                        {
                            params: {
                                guild_id: get_env_var("GUILD"),
                                ban_id: discordUser.id,
                            }
                        }
                    );

                    if (banResponse.data.banned) {
                        req.session.user.banned = true;
                        req.session.user.ban = banResponse.data.ban as BanInfo | null;
                    }
                } catch (error) {
                    console.error("Failed to fetch Discord ban information", error);
                }
            }
        } catch (error) {
            console.error("Failed to fetch Discord member information", error);
        }


        req.session.user.verified = await isUserVerified(discordUser.id); // check if the user is verified

        const userObj: User = {
            id: discordUser.id,
            username: discordUser.username,
            display_name: discordUser.global_name ?? discordUser.username,
            email: discordUser.email ?? "",
            mfa: discordUser.mfa_enabled,
            verified_email: discordUser.verified,
            verified: req.session.user.verified,
            banned: req.session.user.banned
        };

        try {
            await putUser(userObj);
        } catch (error) {
            console.error("Failed to persist Discord user", error);
        }

        return res.redirect(`${host}:${frontPort}/`);
    } catch (error) {
        console.error("Discord OAuth failed", error);

        return res.status(500).json({
            success: false,
            message: "Discord OAuth failed"
        });
    }
};

export const getMySession = async (req: Request, res: Response) => {
    if (req.session.user) {
        return res.json({
            loggedIn: true,
            user: req.session.user
        });
    }

    return res.json({
        loggedIn: false,
        user: null
    });
};

export const postLogOut = (req: Request, res: Response) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Log out error:", error);
            return res.status(500).json({
                message: "Failed to log out"
            });
        }

        res.clearCookie("connect.sid");

        res.status(200).json({ loggedOut: true });

    });
};