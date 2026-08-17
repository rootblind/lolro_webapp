import express from "express";

import {
    getVerified,
    setADN,
    setIP,
    getVerifiedStatus,
    getGraph
} from "../controllers/verifyController.js";
import requireLogin from "../middleware/requireLogin.js";

const verifyRouter = express.Router();

// dev only
verifyRouter.get("/graph/", getGraph);

verifyRouter.get("/", requireLogin, getVerified);
verifyRouter.get("/status/", requireLogin, getVerifiedStatus);

verifyRouter.post("/adn/", requireLogin, setADN);
verifyRouter.post("/ip/", requireLogin, setIP);

export default verifyRouter;
