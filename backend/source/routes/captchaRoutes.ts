import express from "express";
import { createCaptcha, verifyCaptcha, getCaptcha } from "../controllers/captchaController.js";
import requireLogin from "../middleware/requireLogin.js";

const captchaRouter = express.Router();


captchaRouter.get("/create", requireLogin, createCaptcha);
captchaRouter.get("/", requireLogin, getCaptcha);

captchaRouter.post("/verify", requireLogin, verifyCaptcha);

export default captchaRouter;
