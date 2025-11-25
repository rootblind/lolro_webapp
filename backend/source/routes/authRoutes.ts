import express from "express";
import { getDiscordAuth, getMySession, postLogOut } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.get("/", getDiscordAuth);
authRouter.get("/me", getMySession);
authRouter.post("/logout", postLogOut);

export default authRouter;