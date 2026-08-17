import { fingerprintGraph, ipGraph } from "./antiAltEngine.js";
import type { FingerprintObservation } from "./graph.js";

import {
    loadAllObservations as loadAllFingerprintObservations,
    saveEdges,
} from "../../repositories/FingerprintRepo.js";

import { loadAllObservations as loadAllIpObservations } from "../../repositories/IpRepo.js";

/**
 * Rebuild in-memory anti-alt detection state from Postgres on boot.
 *
 * Must be called after modelsInit() and before the server starts.
 * FingerprintGraph/IpCorrelationGraph are deliberately in-memory-only.
 */
export async function rehydrateAntiAltState(): Promise<void> {
    console.log("Rehydrating anti-alt detection state from the database...");

    const fingerprintRows = await loadAllFingerprintObservations();

    let replayedObservations = 0;
    let replayedEdges = 0;

    for (const row of fingerprintRows) {
        const observation: FingerprintObservation = {
            accountId: row.account_id,
            normalized: row.normalized,
            hashes: row.hashes,
            observedAt: row.observed_at.getTime(),
        };

        try {
            const edges = fingerprintGraph.addObservation(observation);
            replayedObservations++;

            if (edges.length > 0) {
                await saveEdges(edges);
                replayedEdges += edges.length;
            }
        } catch (error) {
            console.error(
                `Failed to replay fingerprint observation for account ${row.account_id}`,
                error,
            );
        }
    }

    const ipRows = await loadAllIpObservations();
    let replayedIps = 0;

    for (const row of ipRows) {
        try {
            ipGraph.recordObservation(
                row.account_id,
                row.ip,
                row.last_seen_at.getTime(),
            );
            replayedIps++;
        } catch (error) {
            console.error(
                `Failed to replay IP observation for account ${row.account_id}`,
                error,
            );
        }
    }

    console.log(
        `Rehydration complete: ${replayedObservations} fingerprint observation(s), ` +
        `${replayedEdges} edge write(s), ${replayedIps} IP observation(s) replayed. ` +
        `Graph now has ${fingerprintGraph.nodeCount} node(s), ${fingerprintGraph.edgeCount} edge(s).`,
    );
}
