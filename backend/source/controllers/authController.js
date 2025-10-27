const {poolConnection} = require("../config/database.js");
const url = require("url");
const axios = require("axios");
const {config} = require("dotenv");
config();

const refreshAccessToken = async (refreshToken) => {
    const refreshData = new url.URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
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

const getDiscordAuth = async (req, res) => {
    const { code } = req.query;

    if(!code) {
        return res.redirect(`${process.env.HOST}:${process.env.FRONT_PORT}/`);
    }

    try {
        const formatData = new url.URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code.toString(),
            redirect_uri: `${process.env.HOST}:${process.env.PORT}/api/auth/`
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
                avatar: userInfo.data.avatar
            };

            req.session.discordRefreshToken = output.data.refresh_token;

            // refresh access token
            // const refresh = await refreshAccessToken(output.data.refresh_token)

        }
        

        return res.redirect(`${process.env.HOST}:${process.env.FRONT_PORT}/`);
    } catch(error) {
        console.error(error);
        return res.status(500).send("Discord OAuth failed")
    }
    
};

const getMySession = async (req, res) => {
    if(req.session.user) {
        return res.json({loggedIn: true, user: req.session.user});
    }
    res.json({loggedIn: false});
}

const postLogOut = (req, res) => {
    req.session.destroy((err) => {
        if(err) {
            console.error("Log out error: ", err);
            return res.status(500).json({message: "Failed to log out"});
        }

        res.clearCookie("connect.sid");
        return res.status(200).json({loggedOut: true});
    })
}

module.exports = {
    getDiscordAuth,
    getMySession,
    postLogOut
}