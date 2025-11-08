const svgCaptcha = require("svg-captcha");

const getCaptcha = async (req, res) => {
    if(req.session?.captcha) {
        return res.status(200).json({
            captchaText: req.session.captcha.text,
            solved: req.session.captcha.solved
        });
    } else {
        return res.status(400).json({success: false, message: "This session has no captcha object"});
    }
}

const createCaptcha = async (req, res) => {
    const captcha = svgCaptcha.create({
        size: 5,
        noise: 2,
        color: true,
        background: "#f9f9f9"
    });

    req.session.captcha = {}
    req.session.captcha.text = captcha.text;
    req.session.captcha.solved = false;
    res.type("svg");
    return res.status(200).send(captcha.data);
}

const verifyCaptcha = async (req, res) => {
    const {captchaInput} = req.body;
    if(!captchaInput) {
        return res.status(400).json({success: false, message: "Missing input"});
    }

    if(captchaInput == req.session.captcha.text) {
        req.session.captcha.solved = true;
        return res.status(200).json({success: true, message: "Captcha solved"});
    } else {
        return res.status(400).json({success: false, message: "Wrong input"});
    }
}

module.exports = {
    createCaptcha,
    verifyCaptcha,
    getCaptcha
}