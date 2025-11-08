const express = require("express");
const {createCaptcha, verifyCaptcha, getCaptcha} = require("../controllers/captchaController.js");

const captchaRouter = express.Router();


captchaRouter.get("/create", createCaptcha);
captchaRouter.get("/", getCaptcha);

captchaRouter.post("/verify", verifyCaptcha);

module.exports = {
    captchaRouter
};