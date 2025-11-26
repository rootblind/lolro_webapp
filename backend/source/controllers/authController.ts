import url from "url";
import axios from "axios";
import { config } from "dotenv";
import botapi from "../config/botapi.js";
import { isUserVerified, putUser } from "../repositories/UserRepo.js";
import { get_env_var } from "../utility_modules/utility_methods.js";

import type { Request, Response } from "express";
import type { User } from "../interfaces/database_types.js";
config();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const refreshAccessToken = async (refreshToken: string) => {
    const refreshData = new url.URLSearchParams({
        client_id: get_env_var("CLIENT_ID"),
        client_secret: get_env_var("CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: refreshToken
    });

    const refresh = await axios.post("https://discord.com/api/oauth2/token",
        refreshData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    return refresh;
}

export const getDiscordAuth = async (req: Request, res: Response) => {
    const { code } = req.query;

    const HOST: string = get_env_var("HOST");
    const FRONT_PORT: number = Number(get_env_var("FRONT_PORT"));
    const PORT: number = Number(get_env_var("PORT"));

    if(!code) {
        return res.redirect(`${HOST}:${FRONT_PORT}/`);
    }

    try {
        const formatData = new url.URLSearchParams({
            client_id: get_env_var("CLIENT_ID"),
            client_secret: get_env_var("CLIENT_SECRET"),
            grant_type: "authorization_code",
            code: code.toString(),
            redirect_uri: `${HOST}:${PORT}/api/auth/`
        });

        const output = await axios.post("https://discord.com/api/oauth2/token",
            formatData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        if(output.data) {
            const access = output.data.access_token;
            
            const userInfo = await axios.get("https://discord.com/api/users/@me", {
                headers: {
                    "Authorization": `Bearer ${access}`
                }
            });

            req.session.user = {
                id: userInfo.data.id,
                username: userInfo.data.username,
                display_name: userInfo.data.global_name,
                mfa: userInfo.data.mfa_enabled,
                locale: userInfo.data.locale,
                email: userInfo.data.email,
                verified_email: userInfo.data.verified,
                verified: false, // verified on the webapp
                banned: false, // banned on the server, initialize with false, but will be checked at verification
                ban: null,
                member: null
            };

            // fetching the member object, user.member will be null if the user is not a guild member
            try{
                const memberInfoResponse = await botapi.get("/member/info", {
                    params: {
                        guild_id: process.env.GUILD,
                        member_id: userInfo.data.id
                    }
                });

                req.session.user.member = memberInfoResponse.data.member;
                if(!memberInfoResponse.data.member) {
                    // maybe the user is banned
                    try{
                        const banInfoResponse = await botapi.get("/ban/info", {
                            params: {
                                guild_id: process.env.GUILD,
                                ban_id: req.session?.user?.id
                            }
                        });

                        if(banInfoResponse.data.banned) {
                            req.session.user.banned = true;
                            req.session.user.ban = banInfoResponse.data.ban;
                        }

                    } catch(error) {
                        console.error(error);
                        return res.status(500).json({
                            success: false,
                            error: "Couldn't fetch the ban from the bot."
                        });
                    }
                }
            } catch(error) {
                console.error("Failed to fetch the member object", error);
            }
            
            req.session.discordRefreshToken = output.data.refresh_token;
            // refresh access token
            // const refresh = await refreshAccessToken(output.data.refresh_token)

            // check if user is registered and verified already
            req.session.user.verified = await isUserVerified(userInfo.data.id);
            
            const userObj: User = {
                id: userInfo.data.id,
                username: userInfo.data.username,
                display_name: userInfo.data.global_name,
                email: userInfo.data.email,
                mfa: userInfo.data.mfa_enabled,
                verified_email: userInfo.data.verified,
                verified: req.session.user.verified,
                banned: req.session.user.banned
            };

            try { // register user or update the user entry if something changed
                await putUser(userObj);
            } catch(error) {
                console.error(error);
            }

        }
        

        return res.redirect(`${get_env_var("HOST")}:${get_env_var("FRONT_PORT")}/`);
    } catch(error) {
        console.error(error);
        return res.status(500).json({message: "Discord OAuth failed"})
    }
    
};

export const getMySession = async (req: Request, res: Response) => {
    if(req.session.user) {
        return res.json({loggedIn: true, user: req.session.user});
    }
    res.json({loggedIn: false, user: null});
}

export const postLogOut = (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if(err) {
            console.error("Log out error: ", err);
            return res.status(500).json({message: "Failed to log out"});
        }

        res.clearCookie("connect.sid");
        return res.status(200).json({loggedOut: true});
    })
}
