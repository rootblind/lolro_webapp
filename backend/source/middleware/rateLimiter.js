const {rateLimit} = require("../config/upstash.js");

const rateLimiter = async (req, res, next) => {
    try {
        const key = `login:${req.session?.user?.id || req.ip}`;
        const {success} = await rateLimit.limit(key);

        if(!success) {
            return res.status(429).json({
                message: "rate limited"
            });
        }
        
        next();
    } catch(err) {
        console.error(err);

        next(err);
    }
}


module.exports = { rateLimiter };