const express = require("express");
const {getDiscordAuth, getMySession, postLogOut} = require("../controllers/authController.js");

const authRouter = express.Router();


authRouter.get("/", getDiscordAuth);
authRouter.get("/me", getMySession);
authRouter.post("/logout", postLogOut);

module.exports = {
    authRouter
};