/*

    The user is not verified, therefore it is prompted to verify

    The verification process checks in the following order:
    1) If the user is banned:
        - yes: The accounts gets verified and registered for future reference, but gets flagged as banned
                additionally, associated accounts get banned or flagged for manual verification
                users flagged as banned get prompted to a "you are banned" UI page
        - no: continue

    2) If the user is on the server:
        - yes: continue
        - no: Verification cannot proceed unless the user is also a server member
                the user gets redirected or notified to join the server before clicking verify
    
    3) If the user matches other entries:
        - yes: A similarity score is calculated:
            - weak: Grant access, but log the user as suspicious
            - medium: Flag the user for manual verification
            - high: The user gets banned
        - no:  The user simply gets access.
*/

//import botapi from "../config/botapi.js"
import { config } from "dotenv";
import {normalizeComponents, buildHashes, buildCrossBrowserHash} from "../utility_modules/fingerprint_tools.js";
import type { Request, Response } from "express";
import { hasValueProp } from "../utility_modules/utility_methods.js";
import type { Fingerprint } from "../interfaces/helper_types.js";

config();

export const getVerifiedStatus = async (req: Request, res: Response) => {
    if(!req.session?.user) {
        return res.status(500).json({
            success: false,
            error: "No session or user found"
        });
    }
    
    return res.status(200).json({success: true, verified: req.session.user.verified});
}

export const getVerified = async (req: Request, res: Response) => {
    if(!req.session?.user) {
        return res.status(500).json({
            success: false,
            error: "No session or user found"
        });
    }
    
    if(!req.session.user.banned && !req.session.user.member) {
        // not banned and not on the server makes the user unable to verify
        return res.status(400).json({
            success: false,
            error: "The user is neither banned, nor a member of the server"
        });
    }

    /*
    TODO: compare discord data with other accounts when database table exists
    */

    /*
    TODO: compare fingerprint when database table exists
    */

    /*
    TODO: compare ip and ip-related data when database table exists
    */
    return res.status(200).json({success: true, verified: true});
}

export const setADN = async (req: Request, res: Response) => {
    const { adn, userAgent } = req.body;
    
    if(!req.session?.user) {
        return res.status(500).json({
            success: false,
            error: "No session or user found"
        });
    }

    if(!adn) {
        return res.status(400).json({
            success: false,
            error: "No fingerprint provided"
        });
    }

    const rawComponents = adn.components;
    const normalized = normalizeComponents(rawComponents);
    const hashes = buildHashes(normalized, userAgent);
    const crossHash = buildCrossBrowserHash(rawComponents);

    const weights = {
        platform: hasValueProp(normalized.platform!) ? 
            normalized.platform.value ?? null :
            normalized.platform ?? null,
        timezone: hasValueProp(normalized.timezone!) ?
            normalized.timezone.value ?? null :
            normalized.timezone ?? null,
        browserVendor: hasValueProp(normalized.vendor!) ?
            normalized.vendor.value ?? null :
            normalized.vendor ?? null,
        fonts: hasValueProp(normalized.fonts!) ?
            normalized.fonts.value ?? null :
            normalized.fonts ?? null,
        screenResolution: hasValueProp(normalized.screenResolution!) ? 
            normalized.screenResolution.value ?? null :
            normalized.screenResolution ?? null,
        hardwareConcurrency: hasValueProp(normalized.hardwareConcurrency!) ? 
            normalized.hardwareConcurrency.value ?? null :
            normalized.hardwareConcurrency ?? null,
        languages: hasValueProp(normalized.languages!) ?
            normalized.languages.value ?? null :
            normalized.languages ?? null,
        userAgent: userAgent || null
    };

    const fingerPrint: Fingerprint = {
        hashes,
        crossHash,
        weights
    };

    req.session.identity = {
        createdAt: new Date().toISOString(),
        fingerprint: fingerPrint,
        ip: null
    }

    res.status(201).json({success: true});
}

export const setIP = async (req: Request, res: Response) => {
    if(!req.session?.user) {
        return res.status(500).json({
            success: false,
            error: "No session or user found"
        });
    }

    if(!req.ip) return res.status(400).json({success: false, error: "Failed to fetch the IP address"});

    if(req.session.identity) {
        req.session.identity.ip = req.ip;
    } else {
        return res.status(400).json({success: false, error: "End-point accessed too early, call /api/verify/adn/ first"})
    }
    return res.status(201).json({success: true});
}

/* must be called in this order
    setADN,
    setIP,
    getVerified,
    getVerifiedStatus
*/