const express = require("express");
const cors = require("cors");
const {config} = require("dotenv");
config();

const {testRounter} = require("./routes/testRoutes.js");
const {xRoutes} = require("./routes/xRoutes.js");
const { modelsInit } = require("./models/tablesInit.js");
const { rateLimiter } = require("./middleware/rateLimiter.js");


const app = express();

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST;
const FRONT_PORT = process.env.FRONT_PORT || 5173;

// middleware
app.use(
    cors({
        origin: `${HOST}:${FRONT_PORT}`
    })
);
app.use(express.json()); // parse json
app.use(rateLimiter);



// routes
app.use("/test", testRounter);
app.use("/x", xRoutes);

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


