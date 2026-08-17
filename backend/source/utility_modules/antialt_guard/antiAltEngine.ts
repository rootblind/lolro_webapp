
import {
    FingerprintGraph,
} from "./graph.js";

import {
    AntiAltRiskEngine,
} from "./risk.js";

import {
    IpCorrelationGraph,
    JoinVelocityTracker,
} from "./ipGraph.js";

import {
    getGraphOptionsFromEnv,
    getIpGraphOptionsFromEnv,
    getRiskOptionsFromEnv,
    getVelocityOptionsFromEnv,
} from "./riskConfig.js";

const isProduction = process.env.NODE_ENV === "production";
// initializing singletons

export const fingerprintGraph =
    new FingerprintGraph({
        ...getGraphOptionsFromEnv(),
        debugLogging: !isProduction,
    });

/*
 * Weights/thresholds are read from env
*/
export const antiAltRiskEngine =
    new AntiAltRiskEngine(
        getRiskOptionsFromEnv(),
    );

export const ipGraph =
    new IpCorrelationGraph({
        ...getIpGraphOptionsFromEnv(),
        debugLogging: !isProduction,
    });

export const joinVelocityTracker =
    new JoinVelocityTracker({
        ...getVelocityOptionsFromEnv(),
        debugLogging: !isProduction,
    });