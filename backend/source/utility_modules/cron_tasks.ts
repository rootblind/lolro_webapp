/**
 * In this source file will be implemented cron tasks.
 * Cron tasks are recurring executions of blocks of code at the designated schedule.
 * Useful when the program needs to perform periodics checks and take actions accordingly
 * 
 * ATTENTION: Do not cluster too many cron tasks on the same scheduler, or some tasks might execute late
 */

import type { CronTaskBuilder } from "../interfaces/helper_types";
import { clearExpiredFingerprintData } from "../repositories/FingerprintRepo";
import { clearExpiredIps } from "../repositories/IpRepo";
import { fingerprintGraph } from "./antialt_guard/antiAltEngine";

export const removeExpiredIPs: CronTaskBuilder = {
    name: "Remove expired IPs",
    schedule: "0 0 * * *",
    job: async () => {
        const TTL = 90; // 90 days = 3 months
        await clearExpiredIps(TTL);
    },
    runCondition: async () => true
}

export const clearFpData: CronTaskBuilder = {
    name: "Clear fingerprint data",
    schedule: "0 1 * * *",
    job: async () => {
        const TTL = 365 * 3; // 3 years
        await clearExpiredFingerprintData(TTL);
        fingerprintGraph.pruneExpiredObservations();
    },
    runCondition: async () => true
}