# Blackbox — Explainable Sequential Matching

**A research workbench for making, explaining, and evaluating matchmaking decisions as profiles and feedback change over time.**

Blackbox lets an operator run a saved synthetic matching session, inspect why two members are eligible, follow their introduction and replies, and review the final outcome. It also presents recorded research results as a searchable casebook.

> **Presentation pitch:** “Blackbox makes matchmaking decisions traceable. It checks both people's requirements, asks for missing information within a budget, chooses compatible introductions, and explains the outcomes as feedback arrives.”

All live profiles are synthetic. The active engine is a deterministic conservative policy adapted from the organizer's public starter kit. Learned research models do not drive live decisions.

**Presenting this project?** See the [presenter guide](PRESENTATION.md) for a five-minute script, demo walkthrough, and technical Q&A.

## The problem

Matching involves more than shared interests. Both people's requirements must be met, profiles may be incomplete, members become unavailable, and feedback arrives later. A promising match may still fail a time-sensitive success criterion.

Blackbox treats this as a **sequential decision problem**:

**Observe → clarify → check eligibility → allocate introductions → collect feedback → repeat.**

Unknown information remains unknown. Declined fields are respected. Missing replies are not classified as rejection.

## What you can demonstrate

| Screen | Purpose |
| --- | --- |
| **Live matching** | Start, pause, or advance a saved session one day at a time; inspect candidates and suggested pairs. |
| **Matching pool** | Search members, inspect disclosed attributes, and review any pair's eligibility and selection explanation. |
| **Results** | Inspect outcomes, reasons, replies, and timelines; filter and export results as CSV. |
| **Activity feed** | Follow decisions and feedback observable at the current simulation day. |
| **Success / Failure cases** | Browse all 480 original research runs and inspect reconstructed pair-level evidence. |
| **Evidence** | Inspect experiment comparisons and the decision to retain the conservative policy. |
| **Architecture** | Explore application components and the separate research pipeline. |

Choose a **24-member guided pool** for a small demo or a **200-member generated cohort** for a larger simulation. Available scenarios are development, sparse, cold start, delayed, shift, and drift.

A fixed pool, scenario, seed, and sequence of actions reproduce the same JavaScript simulation.

## Run locally

Requirements: **Node.js 24**, npm, and **Python 3** available as `python` for the full checks.

Run from the directory containing this README and `package.json`:

~~~bash
npm ci
npm run dev
~~~

Open [http://localhost:3000](http://localhost:3000). The development server builds the site and API handlers, then stores sessions in SQLite at `.runtime/local.db`. A remote database is unnecessary for a local demo.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Build and serve the application on port 3000. |
| `npm run build` | Restore and verify historical evidence; emit the static site in `dist/`. |
| `npm test` | Build, then verify the engine, results, explanations, APIs, UI controller, and historical records. |

The build restores 480 compressed evidence files; let it finish before opening the app. Sessions survive server restarts through SQLite. Preserve the browser's visitor cookie to restore its owned sessions.

## How the matching engine works

The core implementation is [lib/engine.mjs](lib/engine.mjs).

### 1. Observe the current state

The simulator keeps private synthetic traits and scheduled future events on the server. The policy receives disclosed profile fields, current availability, previous introductions, and feedback whose observation day has arrived.

### 2. Clarify missing constraints

The policy identifies potential pairs requiring hard-constraint information. It requests permitted constraints bundles within a **12-unit daily budget**. Each bundle costs **3 units**, allowing at most four per day. Declined fields are not automatically requested again.

### 3. Enforce reciprocal eligibility

Both directions must satisfy the hard checks: adult status, same pool, age preferences, who each member wants to meet, location, relationship structure, smoking preferences, children preferences, and schedule overlap.

`eligibility(a, b)` returns:

- **Feasible:** required information is known and all hard checks pass.
- **Needs clarification:** required information is missing and no known hard check fails.
- **Infeasible:** at least one hard requirement fails.

### 4. Score eligible pairs

The score counts exact agreements across seven disclosed soft attributes:

`relationship_goal`, `relationship_pace`, `lifestyle`, `conversations`, `emotional_availability`, `space_for_relationship`, and `relocate`.

A known agreement contributes one point. Unknown values contribute zero. The **0–7 score is an agreement count**, not a probability of success.

### 5. Allocate introductions greedily

`graphEdges()` ranks eligible pairs by descending score; exact ties use sorted internal member IDs. `choosePairs()` walks that order, selecting a pair only if neither member is already used. Previously introduced pairs are excluded.

An eligible pair can be skipped because an earlier pair already uses one member. This is an allocation conflict, not evidence of incompatibility.

The algorithm is **deterministic greedy matching**; it does not guarantee global optimality or maximum matching cardinality.

### 6. Advance the world

| Days | Behavior |
| --- | --- |
| **0–59** | Clarify profiles, allocate introductions, and collect feedback. |
| **60–99** | Follow-up only; no new introductions. |
| **100** | Session finished; inspect final results. |

The simulator schedules introduction responses, dates, and second-meeting intentions. Clients see events only once they become observable.

## What counts as success?

An **official qualifying couple** requires a first date within **30 days of introduction**, followed by **Yes from both members within 3 days of that date**.

A qualifying date with two later Yes replies is tracked separately as eventual mutual interest. Missing feedback remains missing rather than becoming an explicit No.

**Example:** introduction on day 2, date on day 10, Yes replies on days 12 and 14. There is mutual interest, but no timely success: one reply arrived four days after the date. This is why Results includes reply timelines alongside totals.

## Architecture

The frontend is plain HTML, CSS, and JavaScript. TypeScript API adapters call a session store and the JavaScript engine. The application does not run through a Next.js server, despite its retained `app/api/` route organization.

~~~mermaid
flowchart LR
    UI[Browser workspace] -->|Action, request ID, revision| API[API and visitor ownership]
    API --> STORE[Session store]
    STORE <-->|Load and save private state| DB[(SQLite / remote libSQL)]
    STORE --> ENGINE[Observed-state matching policy]
    ENGINE --> SIM[Synthetic world advances]
    SIM --> VIEW[Observed snapshot and explanations]
    VIEW --> UI
    CASES[Recorded research casebook] -->|Read-only evidence| UI
~~~

For **Step one day**, the server validates ownership and input, loads the saved state, checks its revision, advances the policy and simulator, saves the new revision, and returns an observed snapshot. The browser renders the graph, metrics, and activity from that response.

### Codebase map

| File or directory | Responsibility |
| --- | --- |
| [app/shell.html](app/shell.html) | Page layout, navigation, workspace controls, dialogs, and screen containers. |
| [public/live.js](public/live.js) | Browser API calls, playback, saved sessions, member/pair views, results, and exports. |
| [public/research.js](public/research.js) | Historical case browsing and recorded experiment presentation. |
| [public/ui-helpers.js](public/ui-helpers.js), [public/styles.css](public/styles.css) | Shared UI helpers and styling. |
| [lib/engine.mjs](lib/engine.mjs) | Eligibility, clarification, graph construction, allocation, simulation, metrics, and snapshots. |
| [lib/pair-explanation.mjs](lib/pair-explanation.mjs) | Read-only attribute, eligibility, score, ranking, and allocation-conflict explanations. |
| [lib/session-store.ts](lib/session-store.ts) | Validation, ownership, persistence, retry handling, and concurrency checks. |
| [api/](api/), [app/api/](app/api/) | Standalone entry points and shared request handlers. |
| [server/visitor.mjs](server/visitor.mjs) | Visitor identity, secure cookie, and removal of forged identity headers. |
| [server/storage.mjs](server/storage.mjs) | libSQL connection and initialization of the sessions table. |
| [scripts/dev-server.mjs](scripts/dev-server.mjs) | Local HTTP server and bundled API handlers. |
| [scripts/build.mjs](scripts/build.mjs) | Static build and SHA-256 verification of restored evidence. |
| [public/data/](public/data/) | Case summaries, CSVs, experiment evidence, and compressed pair details. |
| [public/diagrams/](public/diagrams/) | Application and research architecture visuals. |
| [scripts/](scripts/) | Verification and evidence reconstruction utilities. |

### APIs

| Endpoint | Purpose |
| --- | --- |
| `GET /api/session` | Restore the latest owned session, or one selected by `id`. |
| `POST /api/session` | Create, step, or clarify a session; stepping can include manually selected pairs. |
| `GET /api/sessions` | List the visitor's saved sessions. |
| `GET /api/pair` | Explain a pair at a specified owned session revision. |
| `GET /api/health` | Check database availability. |

### State integrity and privacy

- A 256-bit **HttpOnly, Secure, SameSite=Strict** cookie identifies a visitor. This is browser isolation, not account login.
- Reads and writes are scoped to the derived owner ID; caller-supplied identity headers are removed.
- Conditional updates check revisions so simultaneous tabs cannot overwrite each other's state.
- Repeating the latest mutation request ID returns its saved result instead of advancing again.
- Writes check request origin, and request bodies are limited to 16 KiB.
- Public snapshots exclude private simulator traits and unobserved future feedback.
- SQLite is used locally. The standalone production adapter requires a durable remote libSQL database.

## Recorded research and provenance

The original confirmation evaluated **two policies on 240 paired synthetic worlds**, producing 480 runs. These historical records are separate from live JavaScript sessions.

| Measure | Count |
| --- | ---: |
| Recorded runs | 480 |
| Runs with at least one official qualifying couple | 242 |
| Runs with zero official qualifying couples | 238 |
| Introductions across all runs | 35,837 |
| Official qualifying couples across all runs | 342 |

The 238 zero-score runs comprise 153 with late recorded mutual Yes, 78 with a date but no qualifying recorded mutual Yes, and 7 with no completed date. These describe observed outcomes, not proof of a unique causal failure.

**242 successful runs and 342 qualifying couples are different quantities.** The runs share worlds across policies; they do not represent 480 independent worlds or real-world dating results.

Pair details were reconstructed and checked against the original action digests and outcome counts. They are reproducibility evidence, not new independent evaluations or training data. See [scripts/verify-replayed-details.py](scripts/verify-replayed-details.py).

The large detail records are stored as deterministic gzip data encoded in base64. The build restores ordinary JSON and verifies each file's SHA-256 against its manifest; the browser needs no decompression code.

The [parent repository](https://github.com/jwalith4418-Mj/blackbox-sequential-matching) contains the separate Python research release. This folder is the interactive application. Its random generator differs from the Python simulator, so live scores are not official Python benchmark results.

## Verification and current limits

The checks cover:

- 12 deterministic sessions and 1,200 simulated days.
- Legal non-overlapping pairs, no repeated introductions, and question budgets.
- Explanations, results projection, and hidden/future-data exclusion.
- Actual API handlers with the libSQL driver and disposable local SQLite.
- Ownership isolation, forged-header removal, origin checks, retry handling, stale revisions, and competing updates.
- Browser-controller behavior in a Node VM with mocked transport.
- All 480 historical records and reconstructed details for 35,837 introductions.

These checks passed locally. UI-controller tests are not visual browser certification. Remote testing confirmed database health but exposed an unresolved ESM module-resolution issue in the standalone session adapter; use the local development workflow for the presentation.

The active policy is a conservative baseline. Recorded candidate comparisons did not justify replacing it. The project does not establish globally optimal allocation, guaranteed outcomes, population fairness, or real-world effectiveness.

## Attribution

The eligibility semantics, conservative policy, and synthetic outcome formulas are adapted from the organizer's public Sequential Matching Problem starter kit, version 1.0.0. See [third-party notices](THIRD_PARTY_NOTICES.md) and the [upstream MIT license](licenses/public-kit.LICENSE). The separate frozen research archive retains its own licensing boundaries.
