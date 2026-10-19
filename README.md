# Blackbox | Sequential Matching

A reproducible research submission for **The Sequential Matching Problem**, Round 2, by Team Blackbox.

Blackbox asks clarification questions and selects reciprocal introductions under incomplete information, delayed outcomes and limited availability. The official objective is **Mutual Second-Meeting Intention (MSMI)**: a date within 30 days of introduction and a recorded Yes from both participants within three days of that date.

**Submitted policy: `conservative`.** Learned controllers remain research candidates because the measured evidence does not establish reliable superiority. All records are synthetic; the results do not establish real-world relationship prediction.

## Submission artifact

- [Download the final ZIP](https://github.com/jwalith4418-Mj/blackbox-sequential-matching/raw/340cdd9cd4661368607f6df01004336998119146/Blackbox_Submission.zip)
- [Published checksum](Blackbox_Submission.zip.sha256)
- [Technical report](TECHNICAL_REPORT.md)
- [Reproducibility and verification](docs/REPRODUCIBILITY.md)
- [Architecture](docs/ARCHITECTURE.md)

```text
SHA-256: c03ae58397104e276a67d7d343e8be4635a499352111c24e1e774d0ea9dee936
Size:    10,159,792 bytes
Files:   641
```

The ZIP contains full source, training inputs, inference assets, baselines, ablations, registered plans and machine-readable results. It has no nested ZIPs or priority experiment. Repository documentation and automation are maintained outside this frozen artifact.

## Quick start

Extract `Blackbox_Submission.zip` and enter `Blackbox_Round2_Submission`. Use **CPython 3.12**; the reference version is **3.12.14**. Serving requires only the Python standard library.

```bash
python3.12 -S -B policy.py --mode conservative < runtime/examples/refreshed_match_request.json
```

Windows CMD equivalent:

```bat
py -3.12 -S -B policy.py --mode conservative < runtime\examples\refreshed_match_request.json
```

The interface returns one JSON response per invocation. Carry policy memory between the official ask and match calls, and use actual refreshed observations after questions. Do not reuse sampled answers as disclosures.

## Verify and reproduce

From the extracted project directory:

```bash
python3.12 -m pip install -r research/requirements-train.txt
python3.12 -B tools/check_release.py
python3.12 -B tools/train_model.py --verify-data
python3.12 -B tools/reproduce_coordinated.py --output ../Blackbox_Replay
```

Training dependencies are pinned to NumPy 2.3.5 and SciPy 1.17.0. Reproduction creates a separate working copy and uses a new two-hour execution budget. Replaying recorded worlds provides reproducibility evidence, not new independent observations. Completion depends on available compute.

For an external refit, use `python3.12 -B tools/train_model.py --output ../Blackbox_Refit`. Never overwrite the frozen release to improve reported outcomes.

## Measured outcomes

Counts below are **qualifying couples**, not numbers of valid or successful episodes.

| Study | Paired worlds | Conservative | Experimental candidate | Interpretation |
| --- | ---: | ---: | ---: | --- |
| Original final: coordinated | 60 | 35 | 48 | 95% seed-block interval includes zero |
| Independent confirmation: coordinated | 240 | 170 | 172 | No reliable superiority; family regressions remain |
| Fresh staged-model pilot | 12 | 21 | 9 | Rejected for deployment |

The confirmation difference is **+0.004167 MSMI per 100 arrivals**, with a descriptive paired seed-block 95% interval of **[-0.083333, +0.087500]**. All 480 confirmation episodes were valid; 242 had at least one official success. The remaining 238 were zero-score games, not application crashes. These combined counts must not be presented as the success rate of one policy.

The 84-episode validation includes supplied greedy, no-clarification and random-feasible baselines, the incumbent, the coordinated candidate, and two component ablations. The constant-estimate control scored 11 couples versus the learned controller's 8, so learning's additional contribution is unproven. Studies and candidates are reported separately rather than pooled.

## Architecture and safeguards

The experimental controller uses one success-plus-availability objective for asking, matching and waiting. Compact learned success and hold-duration estimates feed bounded question search and general-graph matching exchanges. It replans after real answers and enforces reciprocal hard feasibility before every introduction. This is a bounded approximation, without an exact 60-day optimality or unseen-arrival forecasting claim.

The active Dockerfile serves `conservative`; experimental entrypoints require an explicit choice. Hypothetical answers never override refusals or missing required hard fields. Models do not use member IDs or hidden simulator state at inference.

## Runtime evidence

Ten local release-check groups and fresh extraction passed during artifact preparation. **Native Windows and constrained Docker verification were pending when this documentation was authored.** The [verification workflow](.github/workflows/verify-submission.yml) tests the exact ZIP on Windows and Linux and runs constrained baseline Docker checks on Linux. Workflow presence is not a pass: inspect the [actual Actions runs](https://github.com/jwalith4418-Mj/blackbox-sequential-matching/actions) and their receipts.

The workflow uses read-only repository permissions, pinned action commits, single-thread numeric libraries and external receipts. It does not refit, promote models or rewrite the submitted ZIP.

## Project contents after extraction

| Path | Contents |
| --- | --- |
| `policy.py`, `runtime/` | Official interface, incumbent and serving assets |
| `coordinated/`, `funnel/` | Experimental controller and staged scorer |
| `research/` | Training source, public organiser kit/data and retained evidence |
| `results/coordinated/` | Validation, final, confirmation, service and transport records |
| `results/funnel/` | Staged pilot, rejection and evaluation correction records |
| `tools/` | Verification, replay, refit, packaging and runtime validation |
| `SUBMISSION_MANIFEST.json` | Frozen file inventory |

## Data, attribution and limitations

The [organiser's public kit](https://github.com/RomeoJulietLove/The-Sequential-Matching-Problem) supplies synthetic data and the reference simulator. Training uses point-in-time observable records; pending labels and unchosen-pair outcomes are not invented. Whole-pool or whole-seed splits separate related records. Selection bias, rare outcomes, coarse answer models and irreversible actions remain limitations.

ChatGPT/Codex assisted implementation, tooling and documentation; Gemini and Antigravity supplied additional reviews. Human/AI effort percentages are self-reported estimates, not audited measurements. The team is responsible for the reported claims. Inference does not call an external LLM.

See [licensing scope](LICENSING.md), [third-party notices](NOTICE), [contribution guidance](CONTRIBUTING.md) and [citation metadata](CITATION.cff). Repository documentation/tools have an MIT license. The archived submission and upstream assets retain their existing terms; this repository does not automatically relicense the team archive.

Publishing a repository does not itself complete the organiser's submission process. Pin the exact artifact checksum and commit in the required submission channel.

## Live application source

The latest frontend and its standalone Vercel target are in [`frontend/`](frontend/). This includes the wrapped Results layout, pair-selection explanations, mutual/differing/unknown attributes, and all 480 historical case details (242 positive-score runs / 238 zero-score runs). The frozen research ZIP above is unchanged.

See [`frontend/README.md`](frontend/README.md) for local commands, database configuration, privacy boundaries and Vercel import settings. Set the Vercel Root Directory to `frontend` and retain Vercel Authentication for all deployments. The Vercel adapter passed local checks; remote publishing was blocked by HTTP 403 for the connected workspace, so a Vercel URL is not yet claimed.

