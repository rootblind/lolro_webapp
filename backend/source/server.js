const express = require("express");
const cors = require("cors");
const session = require("express-session");

const {config} = require("dotenv");
const path = require("path")
config();

const {authRouter} = require("./routes/authRoutes.js");

const { modelsInit } = require("./models/tablesInit.js");
const { rateLimiter } = require("./middleware/rateLimiter.js");
const { captchaRouter } = require("./routes/captchaRoutes.js");


const app = express();

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST;
const FRONT_PORT = process.env.FRONT_PORT || 5173;
const dirname = __dirname;

// middleware
if(process.env.NODE_ENV !== "production") {
    app.use(
        cors({
            origin: `${HOST}:${FRONT_PORT}`,
            credentials: true
        })
    );
}

app.use(express.json()); // parse json
app.use(rateLimiter);
app.use(session({
    secret: process.env.SESSION_SECRET,
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
    app.listen(PORT, () => {
        console.log("Server started")
    });
});


