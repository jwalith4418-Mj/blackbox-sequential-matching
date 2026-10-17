# Architecture

## Official path

The root Dockerfile in the archive launches the standard-library conservative policy. The evaluator supplies pre-answer observations, receives a budget-valid ask response, refreshes observations, and calls matching. Each invocation returns one bounded JSON response and explicit memory.

Reciprocal hard feasibility is a prerequisite. Unknown required hard data blocks introductions. A real matching batch cannot reuse endpoints, repeat introduced pairs, or use sampled answers as observed disclosures.

## Experimental coordinated controller

The candidate uses a compact learned success estimate and a hold-duration proxy. It values introductions together with remaining availability, so question batches, matching and waiting share an objective. A training-only timeliness factor maps an auxiliary recorded mutual-Yes estimate to an official-success proxy.

Question search uses empirical answer scenarios and complementary endpoint bundles. Actual disclosures replace every sampled answer before allocation. A deterministic greedy incumbent and bounded improving exchanges handle competing endpoints. Remaining-horizon availability charges model opportunity cost; they do not forecast hidden departures or future arrivals.

These approximations can miss good plans. Historical selection bias, inaccurate answer distributions and irreversible introductions remain. A coherent objective is an implementation property, not proof of a game-performance improvement.

## Reproducibility boundary

The ZIP freezes source, assets, training inputs, plans and results. Repository-side CI extracts that exact ZIP, checks its checksum and paths, runs source checks, and collects constrained Docker evidence separately. It does not mutate or automatically promote the candidate. See the technical report for measured outcomes and failed gates.
