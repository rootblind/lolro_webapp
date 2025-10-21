const {Ratelimit} = require("@upstash/ratelimit");
const {Redis} = require("@upstash/redis");
const {config} = require("dotenv");
config();

// rate limiter
const rateLimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(
        process.env.RATE_LIMIT_COUNT,
        process.env.RATE_LIMIT_TIME
    )
});

module.exports = { rateLimit };