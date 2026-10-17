> Report reproduced from the frozen submission. Paths below refer to the extracted `Blackbox_Round2_Submission` directory. Runtime status reflects the recorded evidence, not a claim that repository CI has passed.

# Coordinated policy — measured architecture and outcome report

The latest build adds one controller whose question values, pair selection and deferral use a common success-plus-availability objective. It uses a trained 32-feature reward head and a learned hold proxy directly. The default remains **conservative**, because the experimental candidate must pass the frozen full-game and runtime gates. Executable research source and inherited serving assets remain unchanged. Superseded historical archives were replaced by verified flat training inputs.

## What changed

The controller estimates official-success probability as a clean auxiliary success model times an empirical training-only timeliness factor, and subtracts the remaining-horizon cost of making two people busy. It compares complete matching plans and question batches using that same value. After questions it discards every sampled answer and replans from actual disclosures. General-graph exchanges account for displaced endpoints. The top-level interface offers conservative or coordinated; two evaluation-only controls test continuation value and learned estimates.

This is a bounded receding-horizon approximation, not an exact 60-day optimizer. It does not forecast unseen arrivals. The response model uses observed ask completions and disclosed historical donor bundles. Selection bias, coarse response estimates, optimistic continuation rates and irreversible introductions remain. See COORDINATED_DESIGN.md for the objective and each issue’s disposition.

## Training and model checks

Verified historical collection: 21367 mature introduced-pair rows; 612 auxiliary positives and 224 official positives. No new collection. All 32 reward coefficients are nonzero. Reward L2=100 and hold L2=1000 were fixed before new outcomes, with six whole-seed folds used for diagnostics. Noise soft fields are excluded from these heads.

Out-of-fold official-scaled log loss: 0.058024, constant 0.058230. Auxiliary log loss: 0.129124, constant 0.130035. These small improvements concern selected historical introductions. They are not policy-win evidence or population calibration.

## Frozen validation and component ablations

Fresh validation seeds 4011–4012 × six families × seven methods: 84 complete episodes. All methods have the same 200-member worlds, 60 decision days, 40 follow-up days and public 12-unit daily question budget. Realized question costs can differ. Three answer draws, a 12-bundle work shortlist and two matching-exchange passes are fixed. No validation-based refit or candidate switching occurred.

| Method | Official MSMI | Dates | Coverage | Ask cost | Unserved instances |
| --- | ---: | ---: | ---: | ---: | ---: |
| baseline_greedy | 3 | 97 | 0.3479 | 2313 | 1565 |
| baseline_no_asks | 0 | 24 | 0.1175 | 0 | 2118 |
| baseline_random | 5 | 93 | 0.3417 | 2313 | 1580 |
| conservative | 3 | 76 | 0.3479 | 2301 | 1565 |
| coordinated | 8 | 116 | 0.3467 | 2100 | 1568 |
| coordinated_myopic | 3 | 126 | 0.3542 | 2139 | 1550 |
| coordinated_constant | 11 | 90 | 0.3567 | 2169 | 1544 |

coordinated_myopic removes continuation charges; coordinated_constant replaces both learned reward and hold estimates with training means. Both retain the same planning code and work limits. These are component controls, not candidates chosen for the final. The constant-model control outperformed the learned candidate in this validation (11 versus 8); therefore these results do not establish that learning improves the unified controller. It was not selected or substituted after outcomes.

## Separate frozen final

Final seeds 4201–4210 × six families × conservative/coordinated: 120 complete episodes. Candidate, coefficients and implementation were frozen before these outcomes.

| Family | Conservative MSMI | Coordinated MSMI | Conservative coverage | Coordinated coverage |
| --- | ---: | ---: | ---: | ---: |
| development | 6 | 11 | 0.3595 | 0.3610 |
| sparse | 2 | 2 | 0.1615 | 0.1590 |
| cold_start | 4 | 4 | 0.3155 | 0.3155 |
| delayed | 10 | 10 | 0.3580 | 0.3590 |
| shift | 7 | 10 | 0.3605 | 0.3625 |
| drift | 6 | 11 | 0.3595 | 0.3610 |

Final totals: conservative **35**, coordinated **48** official MSMI. Paired difference is 0.108333 MSMI per 100 arrivals; descriptive seed-block 95% interval **[-0.116667, 0.358333]**, using ten seed blocks. There are 0/60 identical action traces. Changing actions is not itself an improvement.

| Mode | Served instances | Unserved instances | Mean served wait | P95 served wait | Ask cost | Missing feedback |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| conservative | 3829 | 8171 | 7.208 | 24.000 | 12057 | 2272 |
| coordinated | 3836 | 8164 | 5.888 | 21.000 | 11415 | 2234 |

Raw first-introduction waits and information-level service slices are in results/coordinated/waiting_times.json. Means and percentiles describe served members only; unserved members are reported separately as right-censored. Coverage is not a substitute for successful matches.

## Release and limitations

Promotion checks: `{"actual_exact_mode_docker": false, "all_comparison_episodes_valid": true, "cold_transport": true, "minimum_seed_blocks": true, "no_family_mean_regression": true, "positive_paired_lower_bound": false, "service_guardrail": true, "training_oof_probability_logloss": true}`. Failed checks: `["positive_paired_lower_bound", "actual_exact_mode_docker"]`. No automatic promotion; the root submission Dockerfile remains conservative. Dockerfile.coordinated is the explicit experimental recipe.

All 204 declared comparison episodes are retained. Ten new behavioral checks passed, covering displacement, legal endpoints, deferral, horizon behavior, information value, source/model validity and separation of hypothetical answers from observed state. Cold restart-per-call checks cover six known seed-101 worlds and compare actual CLI actions with in-process results. They establish functional parity in those worlds, not new efficacy evidence. Actual Windows, constrained Docker execution, trusted external signing and private-world performance remain unverified.

All 118 foundation tests were rerun successfully in the clean package: 96 research tests and 22 organizer starter tests. One historical unchanged-label test uses the same AST assertion against a verified flat source fixture rather than reading a nested ZIP; no test is skipped. Selected historical evidence is retained; superseded snapshots were removed. The new policy does not import the simulator at inference, use hidden labels, read private worlds, tune on final results or replace the official timely-feedback outcome with the auxiliary target. No claim that every early error or long-horizon effect is solved is supported.

## Independent registered confirmation

After the first final showed an uncertain point advantage, a separate confirmation was registered before its outcomes: seeds 5101–5140 × six families × two methods, 240 fresh worlds / 480 complete episodes. The candidate source, models, hyperparameters and work bounds were unchanged. The sample size was fixed at 40 seed blocks, with no significance-based early stopping. It used the same retained two-hour build budget. The original final remains a separate failed statistical gate; its results are not pooled into this interval.

| Family | Conservative MSMI | Coordinated MSMI | Conservative coverage | Coordinated coverage |
| --- | ---: | ---: | ---: | ---: |
| development | 36 | 38 | 0.3796 | 0.3817 |
| sparse | 7 | 7 | 0.1751 | 0.1726 |
| cold_start | 34 | 32 | 0.3271 | 0.3264 |
| delayed | 30 | 35 | 0.3790 | 0.3796 |
| shift | 31 | 27 | 0.3802 | 0.3821 |
| drift | 32 | 33 | 0.3799 | 0.3819 |

Independent confirmation totals: conservative **170**, coordinated **172**. Difference **0.004167 MSMI per 100 arrivals**, descriptive paired seed-block 95% interval **[-0.083333, 0.087500]** over 40 registered seed blocks. This interval concerns the public simulator distribution, not private-world or production guarantees.

| Mode | Dates | Served instances | Unserved instances | Mean served wait | P95 served wait | Ask cost |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| conservative | 2022 | 16168 | 31832 | 6.718 | 22.000 | 47490 |
| coordinated | 1978 | 16195 | 31805 | 5.768 | 21.000 | 45000 |

### Service by initial information level

| Mode | Initial information | Member-world instances | Served | Unserved | Coverage |
| --- | --- | ---: | ---: | ---: | ---: |
| conservative | low | 29176 | 7131 | 22045 | 0.2444 |
| conservative | partial | 3006 | 914 | 2092 | 0.3041 |
| conservative | complete | 15818 | 8123 | 7695 | 0.5135 |
| coordinated | low | 29176 | 7215 | 21961 | 0.2473 |
| coordinated | partial | 3006 | 918 | 2088 | 0.3054 |
| coordinated | complete | 15818 | 8062 | 7756 | 0.5097 |

Initial groups use the unchanged harness definition: low means at most two hard fields observed on arrival, partial means more than two but incomplete, complete means all hard fields observed. The release service guard is aggregate coverage; it is not a guarantee of equal service in every information group. Full per-episode slices and unserved exposure remain in the machine-readable records.

Confirmation checks: `{"actual_exact_mode_docker": false, "cold_transport": true, "fixed_480_episodes_complete_and_valid": true, "forty_registered_seed_blocks": true, "no_family_mean_regression": false, "positive_paired_lower_bound": false, "same_original_candidate_and_models": true, "service_guardrail": true, "training_oof_probability_logloss": true}`. Failed checks: `["positive_paired_lower_bound", "no_family_mean_regression", "actual_exact_mode_docker"]`. The active policy remains conservative; an external exact-mode Docker receipt is required and no automatic activation occurs.

All 684 declared comparison episodes are retained: 84 validation, 120 original final and 480 independent confirmation. These cover 312 distinct fresh experiment worlds. Known seed-101 parity replays are additional implementation checks, not extra efficacy observations. The validation constant-model control scored 11 versus the learned controller’s 8; this confirmation compares the frozen learned controller with conservative and does not isolate the causal contribution of learning.

## Clean delivery verification

No nested ZIP files are included. The supported commands are documented in the root README: run `policy.py`, check with `tools/check_release.py`, replay with `tools/reproduce_coordinated.py`, and refit in a separate directory with `tools/train_model.py`. The flat-input refit reproduced identical current model and release bytes. All 118 foundation tests, 13 planning checks and 14 current CLI checks passed. The original and confirmation promotion gates remain failed; conservative is still the submitted mode. See evidence/PACKAGE_CLEANUP.json for intentional removals.


# Staged outcome model: measured trial and decision

The feedback deadline cannot be removed without changing the official problem. The practical objective remains more completed dates with recorded timely mutual second-meeting intention, rather than changing the success definition or declaring valid execution a match.

## Implemented

One fixed staged scorer estimates observed mutual introduction acceptance and then auxiliary recorded mutual second-meeting Yes conditional on acceptance. The product is scaled by the training-only timeliness factor. The first head has 32 clean features; the second has 18 goal/post-date-history features. It uses only the 21,367 verified historical introduced pairs, including 3,269 observed mutually accepted introductions and 612 auxiliary positives. The fit uses fixed ridge L2=100 and whole-seed folds. Both predictions enter the unchanged shared asking/matching/availability planner; no priority policy was added.

Official-scaled held-out log loss: 0.05786152, compared with 0.05802407 for the earlier joint model. A repeated fit in a separate directory reproduced identical model bytes. These are selected-cohort diagnostics, not causal or game-win evidence.

## Fresh fixed pilot

New seeds 6301–6302, six families, conservative and staged scorer: 24 episodes, all valid. Both policies had at least one success in 8/12 games. Conservative produced **21 qualifying couples**, staged scorer **9**. The candidate is **rejected for deployment**. Two seed blocks cannot establish a reliable success-rate improvement; 450/480 is not achieved or established. The previous 480-episode confirmation concerns a different scorer and is reported separately.

Family official-couple totals:

| Family | Conservative | Staged scorer |
| --- | ---: | ---: |
| development | 5 | 2 |
| sparse | 0 | 0 |
| cold_start | 3 | 2 |
| delayed | 2 | 2 |
| shift | 6 | 1 |
| drift | 5 | 2 |

The initial evaluation driver counted two completed futures repeatedly. That run is invalid and excluded, not hundreds of independent games. Its raw record, plan and correction explanation are retained. The driver was corrected, and new seeds were registered before restarting; the fitted model and planner were unchanged. Verification now requires the exact 24 unique episode keys. No failed attempt is treated as positive efficacy evidence.

Only the main calibration field in staged pilot rows uses the actual new official-scaled predictions. Other inherited directional/auxiliary calibration fields are reference-harness diagnostics, not evidence for the staged scorer.

## What remains

The active policy stays conservative. The current evidence does not justify deploying either learned replacement. Further progress needs new on-policy training trajectories with point-in-time features and explicit date/response labels, followed by seed-separated whole-game validation. Do not invent outcomes for unchosen pairs or tune against the frozen final worlds. Compare the learned controller with the constant-score control to isolate whether learning helps, and retain waiting/unserved and information-level service slices. The continuation value is still an approximation; this experiment does not solve long-term planning or hidden preference uncertainty.

Native Windows and actual constrained Docker execution remain unavailable here. The existing validation tools must execute on the user's Docker Desktop laptop. Public immutable publication and official submission are separate outstanding actions. No claim that all issues or the desired success rate are solved is supported.

## Supported commands

- Run experimental source: `python3.12 -S -B tools/run_funnel.py < runtime/examples/refreshed_match_request.json`.
- Refit in a separate directory: `python3.12 -B tools/train_model.py --funnel --output ../Staged_Refit`.
- Replay recorded worlds, not independent evidence: `python3.12 -B tools/reproduce_funnel.py --output ../Staged_Replay`.
- Verify release: `python3.12 -B tools/check_release.py`.

The staged model remains research-only and is neither the Docker nor compiled submission entrypoint. No nested ZIPs or priority experiment are included.


## Gemini review audit

See GEMINI_REVIEW_AUDIT.md and results/review_audit.json. The observed 153/238 late-feedback game fraction is distinct from the simulator's theoretical 64% timing loss for a fixed qualifying mutual-Yes couple. Fewer dates does not identify over-deferral as the cause. Mean inference totals are 3.044/19.829 seconds; whole-episode wall times are 5.065/21.765 seconds. Qualifying dates may finish after day 60 in the follow-up period. No unvalidated days-20–50 waiting override was applied. CI templates are prepared but unexecuted; conservative remains active.
