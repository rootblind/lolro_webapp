import { config } from "dotenv";
import type { Request, Response } from "express";
import { hasValueProp } from "../utility_modules/utility_methods.js";
import type { Fingerprint } from "../interfaces/helper_types.js";
import {
    antiAltRiskEngine,
    fingerprintGraph,
    ipGraph,
    joinVelocityTracker,
} from "../utility_modules/antialt_guard/antiAltEngine.js";
import type {
    FingerprintObservation,
} from "../utility_modules/antialt_guard/graph.js";
import { buildHashes } from "../utility_modules/antialt_guard/hashing.js";
import { normalizeComponents } from "../utility_modules/antialt_guard/normalize.js";
import type { DiscordAccountEvidence } from "../interfaces/discord_types.js";
import { getUserById } from "../repositories/UserRepo.js";
import { buildDiscordAccountEvidence } from "../utility_modules/antialt_guard/discordEvidence.js";
import { hashEmail } from "../utility_modules/antialt_guard/emailHash.js";
import {
    saveEdges as saveFingerprintEdges,
    saveObservation as saveFingerprintObservation,
} from "../repositories/FingerprintRepo.js";
import { recordObservation as recordIpObservation } from "../repositories/IpRepo.js";
import { saveAssessment } from "../repositories/RiskAssessmentRepo.js";


config();
const isProduction = process.env.NODE_ENV === "production";

/**
 * Print in console the current state of the graphs
 */
export const getGraph = async (req: Request, res: Response) => {
    if (isProduction) {
        return res.status(404).json({
            success: false,
            error: "Not found"
        });
    }

    const clusters = fingerprintGraph.getClusters();

    if (!isProduction) {
        console.log('GRAPH STATE:');
        console.log(`Nodes: ${fingerprintGraph.nodeCount}`);
        console.log(`Edges: ${fingerprintGraph.edgeCount}`);
        console.log(`Clusters: ${clusters.length}`);

        clusters.forEach((cluster, i) => {
            console.log(`\nCluster ${i + 1}:`);
            console.log(`  Accounts: ${cluster.accountIds.join(', ')}`);
            console.log(`  Size: ${cluster.size}`);
            console.log(`  Max Similarity: ${cluster.maxSimilarity}`);
            console.log(`  Avg Similarity: ${cluster.averageSimilarity}`);
            console.log(`  Edges: ${cluster.edges.length}`);
        });

        console.log('\nIP CORRELATION:');
        console.log(`Accounts tracked: ${ipGraph.accountCount}`);
        console.log(`Distinct IPs tracked: ${ipGraph.ipCount}`);
        console.log('Velocity (per IP, current window):', joinVelocityTracker.getStats());
    }

    res.json({
        nodes: fingerprintGraph.nodeCount,
        edges: fingerprintGraph.edgeCount,
        clusters,

        ip: {
            accountsTracked: ipGraph.accountCount,
            ipsTracked: ipGraph.ipCount,
            velocity: joinVelocityTracker.getStats()
        },
    });

}

export const getVerifiedStatus = async (req: Request, res: Response) => {
    if (!req.session?.user) {
        return res.status(500).json({
            success: false,
            error: "No session or user found"
        });
    }

    return res.status(200).json({ success: true, verified: req.session.user.verified });
}

export const getVerified = async (req: Request, res: Response) => {
    if (!req.session?.user) {
        return res.status(500).json({
            success: false,
            error: "No session or user found"
        });
    }

    const user = req.session.user;

    // discord validation
    // only members and banned users can verify
    if (!user.banned && !user.member) {
        return res.status(400).json({
            success: false,
            error: "The user is neither banned, nor a member of the server"
        });
    }

    if (!req.session.identity) {
        return res.status(400).json({
            success: false,
            error: "Fingerprint has not been collected"
        });
    }

    // enforce ip collection
    if (req.session.identity.ip === null) {
        return res.status(400).json({
            success: false,
            error: "IP has not been associated with this session."
        });
    }

    // fetch the graph cluster
    const cluster = fingerprintGraph.getClusterForAccount(user.id);

    // discord evidence
    const currentAccount = buildDiscordAccountEvidence(user);

    // load discord evidence for other accounts
    const accounts = new Map<string, DiscordAccountEvidence>();

    accounts.set(currentAccount.id, currentAccount);

    // ip correlation
    const ipRelatedAccountIds =
        ipGraph.getRelatedAccounts(user.id);


    // load Discord information for every related account's fingerprint-cluster-related and ip-related.
    // A set dedupes accounts that show up via both relationships, so we never fetch twice.
    const relatedAccountIdsToLoad = new Set<string>();
    if (cluster !== undefined) {
        for (const accountId of cluster.accountIds) {
            if (accountId !== user.id) {
                relatedAccountIdsToLoad.add(accountId);
            }
        }
    }

    for (const accountId of ipRelatedAccountIds) {
        if (accountId !== user.id) {
            relatedAccountIdsToLoad.add(accountId);
        }
    }

    for (const accountId of relatedAccountIdsToLoad) {
        const relatedUser = await getUserById(accountId);

        if (relatedUser === false) {
            continue;
        }

        const relatedEmailHash = hashEmail(relatedUser.email);

        accounts.set(
            accountId,
            {
                id: accountId,
                ...(relatedEmailHash !== undefined
                    ? { emailHash: relatedEmailHash }
                    : {}),

                emailVerified: Boolean(relatedUser.verified_email),
                mfaEnabled: Boolean(relatedUser.mfa),
                verified: Boolean(relatedUser.verified),
                banned: Boolean(relatedUser.banned),
                guildMember: Boolean(relatedUser.member),
                avatar: relatedUser.avatar
            }
        );
    }

    // make the risk assessment
    const assessment = antiAltRiskEngine.evaluate(
        currentAccount,
        cluster,
        accounts,
        ipRelatedAccountIds
    );

    if (!isProduction) {
        console.log('\nRISK ASSESSMENT:');
        console.log('Account:', currentAccount.id);
        console.log('Score:', assessment.score);
        console.log('Level:', assessment.level);
        console.log('Action:', assessment.recommendedAction);
        console.log('Evidence:', assessment.evidence.map(e => ({
            type: e.type,
            points: e.points,
            description: e.description
        })));
        console.log('Related Accounts:', assessment.relatedAccountIds);
        console.log('IP-Related Accounts:', ipRelatedAccountIds);
        console.log('Cluster Size:', assessment.clusterSize);
        console.log('Strong Fingerprint:', assessment.strongFingerprintRelationship);
        console.log('---\n');
    }

    // save the assessment in the database
    try {
        await saveAssessment(assessment);
    } catch (error) {
        console.error("Failed to persist risk assessment", error);
    }

    if (user.banned) {
        return res.status(403).json({
            success: false,
            verified: false,
            decision: "banned",
            risk: assessment
        });
    }

    // response based on assessment decision
    switch (assessment.recommendedAction) {
        case "allow":
            return res.status(200).json({
                success: true,
                verified: true,
                decision: "allow",
                risk: assessment
            });

        case "additional_verification":
            return res.status(200).json({
                success: false,
                verified: false,
                decision: "additional_verification",
                risk: assessment
            });

        case "manual_review":
            return res.status(403).json({
                success: false,
                verified: false,
                decision: "manual_review",
                risk: assessment
            });

        case "deny_verification":
            return res.status(403).json({
                success: false,
                verified: false,
                decision: "deny_verification",
                risk: assessment
            });
    }
};

/**
 * Fetching and processing the fingerprint to be normalized and hashed before evaluation
 */
export const setADN = async (req: Request, res: Response) => {
    const { adn, userAgent } = req.body;

    if (!req.session?.user) {
        return res.status(500).json({
            success: false,
            error: "No session or user found"
        });
    }

    if (
        !adn ||
        typeof adn !== "object" ||
        typeof adn.components !== "object" ||
        adn.components === null
    ) {
        return res.status(400).json({
            success: false,
            error: "No fingerprint provided"
        });
    }

    if (
        typeof userAgent !== "string" ||
        userAgent.length === 0 ||
        userAgent.length > 2048
    ) {
        return res.status(400).json({
            success: false,
            error: "No user agent provided"
        });
    }

    const rawComponents = adn.components;

    const normalized =
        normalizeComponents(rawComponents);

    const hashes = buildHashes(
        normalized,
        userAgent
    );

    const weights = {
        platform: hasValueProp(normalized.platform!)
            ? normalized.platform.value ?? null
            : normalized.platform ?? null,

        timezone: hasValueProp(normalized.timezone!)
            ? normalized.timezone.value ?? null
            : normalized.timezone ?? null,

        browserVendor: hasValueProp(normalized.vendor!)
            ? normalized.vendor.value ?? null
            : normalized.vendor ?? null,

        fonts: hasValueProp(normalized.fonts!)
            ? normalized.fonts.value ?? null
            : normalized.fonts ?? null,

        screenResolution:
            hasValueProp(
                normalized.screenResolution!,
            )
                ? normalized.screenResolution.value ??
                null
                : normalized.screenResolution ?? null,

        hardwareConcurrency:
            hasValueProp(
                normalized.hardwareConcurrency!,
            )
                ? normalized.hardwareConcurrency.value ??
                null
                : normalized.hardwareConcurrency ??
                null,

        languages: hasValueProp(normalized.languages!)
            ? normalized.languages.value ?? null
            : normalized.languages ?? null,

        userAgent
    };

    const fingerPrint: Fingerprint = {
        hashes,
        weights
    };

    const observation: FingerprintObservation = {
        accountId: String(req.session.user.id),
        normalized,
        hashes,
        observedAt: Date.now()
    };

    const edges = fingerprintGraph.addObservation(observation);

    // save the fingerprint graph observation in the database
    try {
        await saveFingerprintObservation(observation);

        if (edges.length > 0) {
            await saveFingerprintEdges(edges);
        }
    } catch (error) {
        console.error(
            "Failed to persist fingerprint observation/edges",
            error
        );
    }

    req.session.identity = {
        createdAt: new Date().toISOString(),
        fingerprint: fingerPrint,
        ip: null
    };

    if (isProduction) {
        return res.status(201).json({
            success: true,
        });
    }

    // TODO: AFTER TESTING, STRIP DOWN TO THE MINIMUM REQUIRED
    return res.status(201).json({
        success: true,

        graph: {
            matchedAccounts: edges.length,
            relationships: edges.map(
                (edge) => ({
                    accountId:
                        edge.source ===
                            req.session.user?.id
                            ? edge.target
                            : edge.source,

                    score: edge.score,
                    confidence: edge.confidence,
                    matchingComponents:
                        edge.matchingComponents,
                }),
            ),
        },
    });
};

/**
 * Fetch and set the IP for the current session
 */
export const setIP = async (req: Request, res: Response) => {
    if (!req.session?.user) {
        return res.status(500).json({
            success: false,
            error: "No session or user found"
        });
    }

    if (!req.ip) return res.status(400).json({ success: false, error: "Failed to fetch the IP address" });

    if (req.session.identity) {
        req.session.identity.ip = req.ip;
    } else {
        return res.status(400).json({
            success: false,
            error: "End-point accessed too early, the fingerprint is not set yet."
        });
    }

    // Record this IP-account observation for later correlation in getVerified
    ipGraph.recordObservation(req.session.user.id, req.ip);

    // record ip observation in the database
    try {
        await recordIpObservation(req.session.user.id, req.ip);
    } catch (error) {
        console.error("Failed to persist IP observation", error);
    }

    const velocity = joinVelocityTracker.recordAttempt(req.ip);

    if (velocity.isBurst) { // anti raid warning
        console.warn(
            `!! Possible raid: ${velocity.countInWindow} verification attempts from IP ${req.ip} in the current window.`,
        );
    }

    return res.status(201).json({ success: true });
}

/* must be called in this order
    setADN,
    setIP,
    getVerified,
    getVerifiedStatus
*/
