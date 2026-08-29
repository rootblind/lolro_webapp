/**
 * IMPORTANT this is intentionally a much weaker signal than fingerprint
 * matching, and getRelatedAccounts() is written to reflect that:
 * If an IP has more than `maxAccountsPerIp` distinct accounts observed
 * on it, that IP is treated as too noisy to be informative at all
 * getRelatedAccounts() silently excludes it rather than returning a
 * huge, meaningless related-accounts list.
 *
 * This class only ever answers "which accounts share an IP with this one".
 * It does not decide how much that should matter, that's risk.ts's job,
 * and risk.ts caps IP evidence low and never lets it alone reach
 * deny_verification.
 */
export interface IpGraphOptions {
    readonly maxAccountsPerIp?: number;
    readonly ipTtlMs?: number;
    readonly debugLogging?: boolean;
}

const DEFAULT_OPTIONS: Required<IpGraphOptions> = {
    maxAccountsPerIp: 20,
    ipTtlMs: 1000 * 60 * 60 * 24 * 90, // 90 days
    debugLogging: false,
};

export class IpCorrelationGraph {
    // TODO: COMPARE THE IP AGAINST DEFINED VPN AND PROXY LISTS
    // ALTERNATIVELY BLOCK THE LISTS FROM THE NETWORK
    private readonly options: Required<IpGraphOptions>;

    // <ip, <accountId, last observed at>>
    private readonly ipToAccounts = new Map<string, Map<string, number>>();

    // <accountId, set of ips it's been observed on>
    private readonly accountToIps = new Map<string, Set<string>>();

    public constructor(options: IpGraphOptions = {}) {
        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };
    }

    public recordObservation(
        accountId: string,
        ip: string,
        now: number = Date.now(),
    ): void {
        if (accountId.length === 0 || ip.length === 0) {
            return;
        }

        let accountsForIp = this.ipToAccounts.get(ip);

        if (accountsForIp === undefined) {
            accountsForIp = new Map();
            this.ipToAccounts.set(ip, accountsForIp);
        }

        accountsForIp.set(accountId, now);

        let ipsForAccount = this.accountToIps.get(accountId);

        if (ipsForAccount === undefined) {
            ipsForAccount = new Set();
            this.accountToIps.set(accountId, ipsForAccount);
        }

        ipsForAccount.add(ip);

        if (this.options.debugLogging) {
            console.log(
                `IP observation: account=${accountId} ip=${ip} (${accountsForIp.size} account(s) now observed on this IP)`,
            );
        }
    }

    /**
     * Other account IDs observed on the same IP(s) as accountId, within
     * the TTL window, EXCLUDING any IP that's expired or too noisy
     */
    public getRelatedAccounts(
        accountId: string,
        now: number = Date.now(),
    ): readonly string[] {
        const ips = this.accountToIps.get(accountId);

        if (ips === undefined) {
            return [];
        }

        const related = new Set<string>();
        const cutoff = now - this.options.ipTtlMs;
        for (const ip of ips) {
            const accountsForIp = this.ipToAccounts.get(ip);

            if (accountsForIp === undefined) {
                continue;
            }

            for (const [accountId, observedAt] of accountsForIp) {
                // clear expired IPs
                if (observedAt < cutoff) {
                    accountsForIp.delete(accountId);
                }
            }
            const fresh = [...accountsForIp.entries()];

            if (fresh.length > this.options.maxAccountsPerIp) {
                if (this.options.debugLogging) {
                    console.log(
                        `IP ${ip} excluded from correlation: ${fresh.length} distinct accounts observed, exceeds maxAccountsPerIp=${this.options.maxAccountsPerIp}`,
                    );
                }

                continue;
            }

            for (const [otherAccountId] of fresh) {
                if (otherAccountId !== accountId) {
                    related.add(otherAccountId);
                }
            }
        }

        return [...related];
    }

    public get accountCount(): number {
        return this.accountToIps.size;
    }

    public get ipCount(): number {
        return this.ipToAccounts.size;
    }
}

/**
 * Simple in-memory join/verification velocity tracker.
 */
export interface VelocityOptions {
    readonly windowMs?: number;
    readonly burstThreshold?: number;
    readonly debugLogging?: boolean;
}

const DEFAULT_VELOCITY_OPTIONS: Required<VelocityOptions> = {
    windowMs: 1000 * 60 * 10, // 10 minutes
    burstThreshold: 8,
    debugLogging: false,
};

export interface VelocityResult {
    readonly countInWindow: number;
    readonly isBurst: boolean;
}

export class JoinVelocityTracker {
    private readonly options: Required<VelocityOptions>;
    private readonly timestampsByIp = new Map<string, number[]>();

    public constructor(options: VelocityOptions = {}) {
        this.options = {
            ...DEFAULT_VELOCITY_OPTIONS,
            ...options,
        };
    }

    public recordAttempt(
        ip: string,
        now: number = Date.now(),
    ): VelocityResult {
        if (ip.length === 0) {
            return { countInWindow: 0, isBurst: false };
        }

        let timestamps = this.timestampsByIp.get(ip);

        if (timestamps === undefined) {
            timestamps = [];
            this.timestampsByIp.set(ip, timestamps);
        }

        timestamps.push(now);

        const cutoff = now - this.options.windowMs;

        while (
            timestamps.length > 0 &&
            timestamps[0] !== undefined &&
            timestamps[0] < cutoff
        ) {
            timestamps.shift();
        }

        const countInWindow = timestamps.length;
        const isBurst = countInWindow >= this.options.burstThreshold;

        if (isBurst && this.options.debugLogging) {
            console.warn(
                `Possible raid pattern: ${countInWindow} verification attempts from IP ${ip} within ${this.options.windowMs}ms`,
            );
        }

        return { countInWindow, isBurst };
    }

    /**
     * Snapshot of current per-IP counts, for the debug graph endpoint.
     */
    public getStats(
        now: number = Date.now(),
    ): readonly { ip: string; countInWindow: number }[] {
        const cutoff = now - this.options.windowMs;

        return [...this.timestampsByIp.entries()].map(([ip, timestamps]) => ({
            ip,
            countInWindow: timestamps.filter((t) => t >= cutoff).length,
        }));
    }
}
