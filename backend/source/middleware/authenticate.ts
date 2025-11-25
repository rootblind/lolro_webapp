import { config } from "dotenv";
config();

import type { Request, Response, NextFunction } from "express";
import { get_env_var } from "../utility_modules/utility_methods.js";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers["lolro-api-key"];
    if(token && token == get_env_var("CLIENT_SECRET")) {
        next();
    } else {
        res.status(403).json({error: "Forbidden: invalid API key"});
    }
}

export default authenticate;