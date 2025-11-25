import type { Request, Response, NextFunction } from "express";

const requireLogin = (req: Request, res: Response, next: NextFunction) => {
    if(req.session?.user?.id) {
        next();
    } else {
        res.status(401).json({error: "Unauthorized request: login required"});
    }
}

export default requireLogin;