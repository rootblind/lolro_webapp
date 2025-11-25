import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { config } from "dotenv";
import { get_env_var } from "../utility_modules/utility_methods.js";
config();

import type { Duration } from "@upstash/ratelimit";

const rateLimitCount: number = Number(get_env_var("RATE_LIMIT_COUNT"))
const rateLimitTime: Duration = `${Number(get_env_var("RATE_LIMIT_TIME"))} s`;
// rate limiter
const rateLimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(
        rateLimitCount,
        rateLimitTime
    )
});

export default rateLimit;