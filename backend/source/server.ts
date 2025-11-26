import express from "express";
import cors from "cors";
import session from "express-session";
import { config } from "dotenv";
import path from "path";
import { get_env_var } from "./utility_modules/utility_methods.js";
config();

import authRouter from "./routes/authRoutes.js";
import modelsInit from "./models/modelsInit.js";
import rateLimiter from "./middleware/rateLimiter.js";
import captchaRouter from "./routes/captchaRoutes.js";
import verifyRouter from "./routes/verifyRoutes.js";
import { fileURLToPath } from "url";

const app = express();

const PORT = Number(get_env_var("PORT"));
const HOST = get_env_var("HOST");
const FRONT_PORT = get_env_var("FRONT_PORT");
//const BOT_PORT = get_env_var("BOT_PORT");

const __filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(__filename);

const allowedOrigins = `${HOST}:${FRONT_PORT}`;

// middleware
if(process.env.NODE_ENV !== "production") {
    app.use(
        cors({
            origin: allowedOrigins,
            credentials: true
            
        })
    );
}

app.use(express.json()); // parse json
app.use(rateLimiter);
app.use(session({
    secret: get_env_var("SESSION_SECRET"),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 // milliseconds * seconds * minutes * hours
    }
}));


// routes
app.use("/api/auth/", authRouter);
app.use("/api/captcha/", captchaRouter);
app.use("/api/verify/", verifyRouter);

if(process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(dirname, "../../frontend/dist")));

    app.use((req, res) => {
        res.sendFile(path.join(dirname, "../../frontend/dist/index.html"));
    });

}

// doing database tables checks and then starting the server
(
    async () => {
        try{
            await modelsInit();
            console.log("All models were initialized.")
        } catch(err) {
            console.error("Initialization of database models failed: ", err);
        }
    }
)().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
        console.log("Server started")
    });
});


