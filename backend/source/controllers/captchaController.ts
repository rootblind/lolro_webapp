import svgCaptcha from "svg-captcha";
import type { Request, Response } from "express";

export const getCaptcha = async (req: Request, res: Response) => {
    if (req.session?.captcha) {
        return res.status(200).json({
            captchaText: req.session.captcha.text,
            solved: req.session.captcha.solved
        });
    } else {
        return res.status(400).json({ success: false, message: "This session has no captcha object" });
    }
}

export const createCaptcha = async (req: Request, res: Response) => {
    const captcha = svgCaptcha.create({
        size: 5,
        noise: 2,
        color: true,
        background: "#f9f9f9"
    });

    req.session.captcha = {
        text: captcha.text,
        solved: false
    }

    res.type("svg");
    return res.status(200).send(captcha.data);
}

export const verifyCaptcha = async (req: Request, res: Response) => {
    const { captchaInput } = req.body;

    if (typeof captchaInput !== "string" || captchaInput.length === 0) {
        return res.status(400).json({ success: false, message: "Missing input" });
    }

    if (!req.session?.captcha) {
        return res.status(400).json({ success: false, message: "The captcha doesn't exist" });
    }

    // TODO uncomment AFTER DEVELOPMENT
    /*if (captchaInput.trim().toLowerCase() !== req.session.captcha.text.toLowerCase()) {
        return res.status(400).json({ success: false, message: "Wrong input" });
    }*/

    req.session.captcha.solved = true;
    return res.status(200).json({ success: true, message: "Captcha solved" });
}