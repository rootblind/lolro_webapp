import express from "express";

import {
    getVerified,
    setADN,
    setIP,
    getVerifiedStatus
} from "../controllers/verifyController.js";
import requireLogin from "../middleware/requireLogin.js";

const verifyRouter = express.Router();

verifyRouter.get("/", requireLogin, getVerified);
verifyRouter.get("/status/", requireLogin, getVerifiedStatus);

verifyRouter.post("/adn/", requireLogin, setADN);
verifyRouter.post("/ip/", requireLogin, setIP);

export default verifyRouter;
