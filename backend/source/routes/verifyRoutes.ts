import express from "express";

import {
    getVerified,
    setADN,
    setIP,
    getVerifiedStatus,
    getGraph,
    manualVerification,
    getRequestStatus
} from "../controllers/verifyController.js";
import requireLogin from "../middleware/requireLogin.js";
import authenticate from "../middleware/authenticate.js";

const verifyRouter = express.Router();

// dev only
verifyRouter.get("/graph/", getGraph);

verifyRouter.get("/", requireLogin, getVerified);
verifyRouter.get("/status/", requireLogin, getVerifiedStatus);
verifyRouter.get("/request_status/", authenticate, getRequestStatus)

verifyRouter.post("/adn/", requireLogin, setADN);
verifyRouter.post("/ip/", requireLogin, setIP);
verifyRouter.post("/manual_review/", authenticate, manualVerification);

export default verifyRouter;
