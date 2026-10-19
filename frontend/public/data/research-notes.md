# Continued work: cardinality matching and the service-coverage limit

**The candidate did not lower the failure rate. Conservative remains active.** All 72 pilot runs completed validly. The candidate failed its predeclared advance rule, so no fresh 480-run confirmation was started. No ZIP or GitHub push was made.

## Measured pilot results

36 fresh worlds were evaluated once per policy: seeds 18101–18106, six scenario families, 200 arrivals per world, 60 decision days and 40 days of follow-up. The policies share worlds within this comparison. This is not a comparison against the different worlds used in previous 480-run studies.

| Metric | Conservative | Cardinality candidate |
| --- | ---: | ---: |
| Episodes | 36 | 36 |
| Games with official success | 18 | 18 |
| Zero-score games | 18 | 18 |
| Official successful couples | 26 | 25 |
| Introductions | 2663 | 2652 |
| Completed first dates | 256 | 252 |
| Eventual recorded mutual-Yes couples | 64 | 58 |
| Served member-world instances | 2382 | 2381 |
| Unserved member-world instances | 4818 | 4819 |
| Question cost | 6930 | 6930 |

Both policies succeeded in **18/36 games (50%)**. Combined, 36/72 episodes had at least one official success. This is a mixed-policy pilot total, not a 480-case result or a reliable population success-rate estimate.

Primary difference: **-0.01389 official couples per 100 arrivals**, descriptive 95% seed-block interval **[-0.1527777777777778, 0.1388888888888889]**. Secondary game-success difference: **0 percentage points**, interval **[-8.333333333333332, 8.333333333333332]**. Only six seed blocks were available; these intervals are descriptive and do not establish power or equivalence.

## What changed, and why it was rejected

The isolated standard-library solver starts from the exact conservative greedy matching, searches longer alternating paths and contracts odd cycles. It changes the allocation only when another current legal pair can be served. Existing soft scores order traversal; they are not globally optimized. If conservative already has maximum cardinality, its exact action order is preserved. Search is capped at 2,000,000 edge examinations and retains a legal incumbent if capped.

The independent audit confirmed **58 additional same-state pairs** over the candidate trajectories. All **2160 matching calls** completed the search without hitting the cap. Nevertheless, the full candidate games produced **11 fewer introductions, four fewer completed dates and one fewer official couple**. The 58 local additions are relative to conservative on the candidate's current states; they are not 58 extra introductions versus the separately evolving control games.

This directly separates a current-board optimization guarantee from the long-run matchmaking objective. Changed matches alter future availability and outcomes; the aggregate difference does not identify one causal mechanism. No model was retrained, no member priority classes were introduced, and the simulator, hard checks, question rule and three-day scoring rule remained fixed.

The advance rule required all runs valid, at least as many successful games and official couples as conservative, and a strict improvement in at least one. The candidate tied successful games and lost official couples, so it stopped without retuning or confirmation. The unchanged confirmation seeds 19101–19140 were not evaluated.

## New diagnostic: why most members remain unserved

After the pilot, a separate trusted offline diagnostic constructed an optimistic legal-partner graph in each world. It used synthetic hidden truths only for this diagnostic, never as policy inputs or training labels. It relaxed timing and question-budget limits, allowed every member to coexist forever, revealed every permitted hard field and ignored busy periods and repeated-pair restrictions. Hard-field declines were still respected because the kit never reveals those fields.

| Member-world category across 36 worlds | Count |
| --- | ---: |
| Total member-world entries | 7200 |
| At least one missing hard field was declined | 2499 |
| Additional entries with no compatible partner among legally revealable profiles | 2277 |
| Entries with any potential legal partner under the optimistic relaxation | **2424** |
| Served by conservative | **2382** |
| Served by candidate | 2381 |

Conservative served **98.27%** of this optimistic service limit. Even in that relaxed graph, at most **42 additional member entries** could have received a first introduction. The declines and absence of a compatible partner account for **4,776 of conservative's 4,818 unserved entries** in these worlds.

**This is a bound on distinct member service within these worlds, not a ceiling for successful games, dates, introductions or official couples.** A positive-degree member need not be schedulable in practice or agree to a date. Repeated opportunities among already served members may still matter. These post-hoc diagnostic results must not be presented as another policy evaluation or proof about real populations.

The result narrows the next useful research direction: reducing first-introduction nonservice has little remaining room in these kit worlds. A future candidate would need to improve official conversion or the timing of repeated opportunities among legally eligible members. More elaborate current-day matching alone has not demonstrated that improvement. Fixed random feedback delays remain outside the available action API; reminders cannot be credited with changing the simulator score.

## Zero-score accounting

| Category | Conservative | Candidate |
| --- | ---: | ---: |
| date_without_qualifying_recorded_mutual_yes | 6 | 7 |
| mutual_yes_but_late | 11 | 10 |
| no_completed_date | 1 | 1 |

The date-without-qualifying-recorded-mutual-Yes category includes incomplete feedback; it is not a count of explicit rejections. Official success still requires a qualifying date and both recorded Yes replies within three days. Late mutual Yes is a separate auxiliary outcome.

## Scenario official couples

| Family | Conservative | Candidate |
| --- | ---: | ---: |
| cold_start | 5 | 5 |
| delayed | 4 | 4 |
| development | 7 | 6 |
| drift | 7 | 6 |
| shift | 3 | 4 |
| sparse | 0 | 0 |

## Verification and reproducibility

Exhaustive unit checks passed all 32,768 six-vertex graphs against a brute-force cardinality oracle, plus 280 deterministic random graphs through fourteen vertices, a long augmenting path, invalid edges and the search-budget fallback. An initial random-test fixture used noncanonical string-ID edge ordering; that fixture was corrected before rerunning. No fresh-game results were used to change the candidate.

Known-seed mechanical checks covered 720 decisions across six families. Cold CLI output parity passed 120 calls in a known development world, maximum observed wall time 0.343 seconds. Malformed, oversized and invalid-schema requests were rejected. These known-world checks are not additional independent efficacy runs.

Independent audits reconciled all 72 unique keys, selected-pair feedback outcomes, official and eventual-interest scores, service counts, the journal and per-day solver diagnostics. All frozen experimental source and all 642 reference files remained unchanged. Pilot and conditional confirmation were assigned one 7200-second budget; historical study budgets were not reset.

These are native Linux CPU synthetic-kit measurements with two workers and one numerical thread each. They do not certify native Windows, constrained Docker or real-service performance. Some verification ran concurrently with the pilot; timing measurements are observed bounds under this run, not isolated hardware benchmarks.

Files: `Pilot_72_Episodes.csv`, `Pilot_72_Results.json`, `World_Coverage_Audit.csv`, `Verification.json`, `Experiment_Source.json` and `SHA256SUMS.json`. The source bundle contains relative paths and UTF-8 file contents and requires the unchanged reference project. No failed candidate was activated.

Plan SHA-256: `9989c782e45eef43e41dd39d6289d1ea0c4259fc61bc35b0988b912f7f5f357a`.
Release SHA-256: `9411e8dfff9acfaa02b9322aaa10273f76a495406519a475adddf89096855754`.
Results SHA-256: `1cff16468d63b6faec226945c7cfec7b9637dc64b13ce5dbfbb9bcc37780ced0`.
