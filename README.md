# Antialt Guard - LOLRO webapp

A verification backend for a Discord community that collects a browser
fingerprint, correlates it with IP and account history, scores the
likelihood an account is a ban-evasion alt, and hands that assessment to
the Discord bot for a final accept/deny/manual-review decision.

## License

- [GPL v3](https://www.gnu.org/licenses/gpl-3.0.md)

## Table of contents

- [Overview](#overview)
- [How it works](#how-it-works)
- [Verification flow](#verification-flow)
- [API reference](#api-reference)
- [Configuration](#configuration)
- [Database schema](#database-schema)
- [Installation](#installation)
- [Running locally](#running-locally)
- [Project structure](#project-structure)
- [Moderator tools](#moderator-tools)
- [Known issues / maintainer notes](#known-issues--maintainer-notes)
- [License](#license)

---

## Overview

This service sits between a Discord OAuth login flow, a frontend that
collects a browser fingerprint, and a Discord bot that enforces the final
verification decision. It does three things:

1. **Collects evidence** - a browser fingerprint (canvas, WebGL, fonts,
   hardware characteristics, locale), the submitting IP, and Discord-side
   account facts (email, MFA, account age, ban history).
2. **Correlates it against every other account it has seen** - fingerprint
   similarity scoring, IP co-occurrence, shared email, related bans - using
   an in-memory graph rebuilt from Postgres on every boot.
3. **Produces a risk assessment** and hands it to the Discord bot, which
   makes the authoritative accept / deny / manual-review decision. This
   service does **not** unilaterally verify or ban anyone - it's an
   evidence-and-scoring layer the bot consumes.

This piece of software is built with the needs of League of Legends Romania discord community needs in mind.

## How it works

### 1. Fingerprint collection → normalization → hashing

The frontend posts a raw browser fingerprint to `POST /api/verify/adn/`.
Server-side:

- `normalizeComponents()` cleans the raw fingerprint into a deterministic
  shape (drops volatile/irrelevant fields, buckets noisy values).
- `buildAvailability()` derives a boolean per-component map - whether each
  tracked component was actually collectable for this client. This is
  stored and compared separately from the component values themselves,
  specifically so the comparison step can tell "this browser doesn't
  expose this API" apart from "this browser exposed it and it happened to
  match." Conflating those two would make cross-browser comparisons
  systematically wrong.
- `buildHashes()` produces one SHA-256 hash per component, plus a few
  grouped/broad hashes (including a `crossBrowserHash` deliberately built
  only from signals that survive a browser change, for recognizing the
  same *device* across different browsers).

### 2. Similarity scoring

`compareFingerprints()` compares two fingerprints component by component:

- A component only counts toward the score if **both** sides have it
  available (per the availability map above) - otherwise it's skipped
  entirely, not treated as a mismatch.
- Where both sides have a component, a **hash equality check** decides
  match/mismatch. Weights are fixed per component (canvas and WebGL carry
  the most weight as "strong" signals; locale/timezone carry almost none,
  since too many unrelated people share them).
- A **correlation guard** caps the score when canvas/WebGL/renderer
  signals are doing all the work with little independent corroboration -
  these signals aren't statistically independent of each other, so
  agreeing on all of them isn't as strong as it looks.
- A **sufficiency floor** caps the score when too few components were
  comparable at all, regardless of how well what little exists matches.
- `crossBrowserMatch` is reported separately as corroborating context, not
  folded into the score (it would double-count signals already scored).

### 3. Graph & IP correlation

- `FingerprintGraph` indexes every observation, runs candidate comparisons
  against it, and forms an edge between two accounts when similarity
  clears the configured thresholds. `getClusterForAccount()` returns the
  connected group an account currently belongs to.
- `IpCorrelationGraph` tracks which accounts have shared an IP. This is
  treated as a deliberately weak signal - any IP with too many distinct
  accounts on it is excluded entirely as too noisy to be informative
  (shared networks, CGNAT, campus/office Wi-Fi).
- `JoinVelocityTracker` watches for burst patterns per IP (possible raids)
  but is **not** folded into any individual account's score - a burst is
  evidence about an IP at a moment in time, not proof about a specific
  account caught in it.

### 4. Risk scoring

`AntiAltRiskEngine.evaluate()` combines fingerprint-cluster evidence,
IP-correlation evidence, and Discord-side evidence (shared email hash,
related bans, MFA, account age where available) into a score, a level
(`low` / `moderate` / `high` / `critical`), and a `recommendedAction`.

### 5. Bot handoff

The score is **advisory**. `getVerified` POSTs `{ decision, risk, guild_id }`
to the bot's `/verify/assessment` endpoint; the bot's response
(`verification_status`, optionally `banned`) is what actually gets
persisted and returned to the client. If the bot reports the account as
banned, this service updates its own `banned` flag on the user record to
match.

### 6. Persistence & rehydration

`FingerprintGraph`/`IpCorrelationGraph` are in-memory for speed. Every
observation, edge, IP pairing, and risk assessment is also written to
Postgres as it happens (best-effort - a DB write failure is logged but
never blocks a verification decision). On boot, `rehydrateAntiAltState()`
replays every persisted fingerprint observation back through
`addObservation()` in chronological order, which **recomputes** the graph
under whatever comparison logic is currently deployed, rather than
trusting potentially stale precomputed edges.

---

## Verification flow

Calls from the frontend must happen in this order:

```
1. GET  /api/auth/              Discord OAuth callback - establishes session
2. POST /api/verify/adn/        Submit browser fingerprint
3. POST /api/verify/ip/         Associate request IP (required before step 4)
4. GET  /api/verify/            Run risk evaluation, get bot's decision
5. GET  /api/verify/status/     Cheap re-check of current status
```

If an account already has a `verification_status_type` set, step 4 returns
that status immediately without re-running detection.

## Installation

```bash
git clone https://github.com/rootblind/lolro_webapp
cd lolro_webapp
npm install
cp .env.example .env # fill in every value
```

```bash
npm run build
npm start
```

### Requirements

- Node.js
- PostgreSQL
- An Upstash Redis instance (rate limiting)
- A registered Discord application (OAuth client ID/secret, bot token)
- The companion Discord bot running and reachable at `BOT_PORT`

# Parent project

This web application functions as an extension of [justice-bot](https://github.com/rootblind/justice-bot).