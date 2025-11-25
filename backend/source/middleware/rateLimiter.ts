import rateLimit from "../config/upstash.js";

import type { Request, Response, NextFunction } from "express";

const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const key = `login:${req.session?.user?.id || req.ip}`;
        const { success } = await rateLimit.limit(key);

        if(!success) {
            return res.status(429).json({
                message: "rate-limited"
            });
        }
        
        next();
    } catch(err) {
        console.error(err);

        next(err);
    }
}

export default rateLimiter;