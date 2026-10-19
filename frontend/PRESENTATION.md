# Blackbox — Presenter Guide

## Your central message

> “Blackbox is an explainable sequential matchmaking workbench. It uses disclosed information, respects both people's requirements, and shows how decisions turn into outcomes over time.”

Keep three ideas visible: **reciprocal eligibility, traceable decisions, and honest outcome measurement**.

## Five-minute presentation script

### 0:00–0:40 — The problem

“Matching is not just finding shared interests. Both people have requirements, profiles can be incomplete, availability changes, and feedback arrives later. Even when both people are interested, a late reply can change the measured outcome. Blackbox makes that whole process visible.”

### 0:40–1:20 — The product

“This is an operator workbench using synthetic members. We can create a reproducible session, advance it day by day, inspect members and candidate pairs, and review final outcomes. We also expose recorded research so you can inspect successful and zero-score runs.”

**Show:** Live matching → Matching pool. Mention the 24-member guided and 200-member generated pools.

### 1:20–2:20 — One decision

“First, we check hard requirements in both directions. Missing information stays unknown; permitted clarification has a daily budget. Among eligible pairs, we count agreement across seven soft attributes, rank the pairs, and greedily select a non-overlapping set.

“The explanation shows whether a pair failed a requirement, needs information, was selected, or lost an allocation conflict because another pair already uses one member.”

**Show:** A pair explanation with a hard check, soft agreement, and selection reason. Say explicitly: **not selected does not mean incompatible**.

### 2:20–3:15 — Time and outcomes

“Each step advances the world by one day. The server computes decisions and saves state. The browser sees only what is observable now. Days 0–59 permit introductions; days 60–99 collect follow-up.

“Success has a precise definition: a first date within 30 days of introduction, then Yes from both people within three days of the date. Late mutual interest is separate. Missing feedback is not rejection.”

**Show:** Activity feed → Results → one reply timeline. A live run may have no timely successes; use a historical success case to illustrate a qualifying result.

### 3:15–4:10 — Engineering

“The frontend is plain HTML, CSS, and JavaScript. API handlers load private session state from SQLite or libSQL, run the matching engine and simulator, and return an observed snapshot. Owner-scoped sessions isolate visitors. Request IDs handle retries, and revision checks prevent conflicting updates from two tabs.”

**Show:** Architecture. Name three files:

- `lib/engine.mjs`: matching policy and synthetic world.
- `lib/pair-explanation.mjs`: explanations using the policy's observed state and ranking.
- `lib/session-store.ts`: validation, persistence, ownership, and concurrency.

### 4:10–5:00 — Evidence and limits

“The original confirmation contains 480 runs: two policies on 240 paired synthetic worlds. There were 242 runs with at least one qualifying couple, and 342 qualifying couples overall. We expose all 238 zero-score runs too.

“The live JavaScript simulator is separate from the Python research benchmark. The active policy is conservative; learned models are not driving the app. Our application contribution is the interactive workspace, saved sessions, explanations, results, and inspectable evidence around that policy.”

**Close:** “You can inspect what was known, why a pair was chosen, and how its outcome was counted.”

## Demo preparation

1. Run `npm ci`, `npm test`, and `npm run dev` in the application directory. Open `http://localhost:3000`.
2. Create a **Guided pool**, **Development** session with seed **2026**. This gives a small reproducible example, not a guaranteed success.
3. Step a few days, pause, and inspect one member and one pair.
4. Show the pair's agreement score and why the allocation includes or excludes it.
5. Use **Fast** playback or restore a completed saved session. Show Results and a reply timeline.
6. Open a recorded Success case and Failure case.
7. Finish with Architecture and the separation between live simulation and research evidence.

Prepare a completed session in the same browser before the talk and preserve its cookies. Use the local app for the demo; the standalone remote session adapter currently has an unresolved module-resolution issue.

## Likely questions

| Question | Answer |
| --- | --- |
| **Is the live policy machine learning?** | No. It is deterministic and rule based. The separate research work evaluates candidates, but learned models are not serving live decisions. |
| **What is sequential about it?** | Decisions affect later availability and feedback. The system repeatedly acts from a changing current state. |
| **What does a score of 5 mean?** | Five exact agreements among seven soft attributes, not a 5/7 probability of success. |
| **Why not introduce every eligible pair?** | A member can participate in only one pair in the current allocation; previously introduced pairs are also excluded. |
| **Is greedy matching optimal?** | It does not guarantee global optimality. It takes the highest-ranked available edge next. |
| **How is missing data handled?** | Missing hard fields require clarification; declined fields remain unknown. Missing soft values add no agreement points. |
| **Can it see the future?** | The policy sees disclosed profiles and observed feedback. Private simulator traits and future events stay server-side. |
| **Are explanations predictions?** | They explain actual checks, scores, ranking, and allocation conflicts. They do not predict an unseen counterfactual outcome. |
| **Why can mutual interest fail the success metric?** | A date must qualify and both Yes replies must arrive within three days of the date. Late interest is tracked separately. |
| **Is 242/480 a dating success rate?** | It counts synthetic research runs with at least one qualifying couple, across policies sharing worlds. It is not a per-pair or real-world success rate. |
| **What if two tabs step at once?** | A conditional update checks the expected revision. One update wins; the other must reload the latest state. |
| **Is there account authentication?** | The standalone adapter provides visitor-cookie isolation, not a full account-login system. |
| **How does it scale?** | Candidate construction examines active-member pairs, so that part grows quadratically. Larger-scale performance beyond the demonstrated pools is not established. |
| **What was adapted?** | The starter kit supplies conservative policy semantics and simulation formulas. The application adds the workspace, saved sessions, explanations, result views, and inspectable casebook. |

## Wording to keep accurate

| Prefer | Avoid |
| --- | --- |
| “Synthetic matching simulation” | “Proven real-world dating platform” |
| “Agreement score” | “Predicted success probability” |
| “Greedy baseline” | “Globally optimal matching algorithm” |
| “Recorded synthetic research” | “Live users achieved these outcomes” |
| “242 successful runs; 342 qualifying couples” | “242 couples” |
| “Missing feedback” | “Rejected” without an explicit No |
| “Candidate advantage was not established” | “Our learned model beats the baseline” |

For the full architecture and code map, see [README.md](README.md).
