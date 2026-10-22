# Reproducibility and evidence

## Artifact identity

- Original publication commit: `340cdd9cd4661368607f6df01004336998119146`.
- Archive: `Blackbox_Submission.zip`, 10,159,792 bytes, 641 files.
- SHA-256: `c03ae58397104e276a67d7d343e8be4635a499352111c24e1e774d0ea9dee936`.
- Active mode: `conservative`.

Verify the checksum before extraction. From Windows CMD:

```bat
certutil -hashfile Blackbox_Submission.zip SHA256
```

From this repository, the CI verifier additionally checks CRC, path safety, filename collisions, symlinks, size limits and absence of nested archives:

```bash
python ci/verify_archive.py --destination ../Blackbox_Check --receipt ../Blackbox_Check_Receipt.json
```

It requires a new extraction destination. Follow the extracted project's README for local execution, checks, refitting and replay.

## Dataset and split scope

Controller training uses 288 simulator episodes: 21,367 mature introduced-pair rows, 612 auxiliary positives and 224 official positives. Training seeds are 1101-1148 across six families. Diagnostic folds group complete seeds. Public static-data companion training uses public_01-06, with public_07-08 for validation; public_09-10 are excluded from its fitting workflow.

| Evaluation | Seeds | Completed episodes | Scope |
| --- | --- | ---: | --- |
| Validation | 4011-4012 | 84 | Seven methods, six families |
| Original final | 4201-4210 | 120 | Conservative and coordinated |
| Independent confirmation | 5101-5140 | 480 | Unchanged conservative/coordinated comparison |
| Staged-model pilot | 6301-6302 | 24 | Different scorer, rejected |

The 708 completed comparison episodes are separate studies. Known seed-101 parity calls and replays are implementation checks, not independent efficacy observations. The staged evaluator's first bookkeeping attempt was invalid, retained and excluded; only the corrected 24 unique episode keys count.

## Execution status

The original local artifact verification recorded ten passing release-check groups and fresh extraction. Windows and constrained Docker remained unverified at documentation time. See actual Actions runs for later evidence; never infer a pass from a workflow file.

The workflow verifies the unchanged archive on Windows and Linux. The runner images are explicit: Windows 2025 with the available official CPython 3.12.10 build, and Ubuntu 24.04 with CPython 3.12.14. The source/runtime supports Python 3.12; the exact host patch version is recorded in each receipt, and the Linux container retains Python 3.12.14. The older workflow failed because `setup-python` has no Windows 3.12.14 build. These native and container environments must not be described as identical.

The original ZIP contains one stray `.answers.json.Nsg6g9` temporary file that is not in the strict runtime inventory. After verifying all 641 original file hashes, `ci/prepare_runtime.py` creates an external scratch derivative, omits only that exact allowlisted file with its known hash, and updates only the derivative's outer inventory. All executable/model/donor bytes and the runtime manifest remain identical; the original ZIP and extracted source are never rewritten. Unknown extras and changed files fail validation. The preparation receipt records both original and derivative manifest hashes. This is the same narrow cleanup documented in the follow-up release, not certification that the original ZIP's runtime inventory was valid as shipped.

Native jobs run the original source checks and the derivative's six golden CLI cases plus three invalid-input checks. Linux additionally executes six 200-member, seed-101 episodes through the frozen evaluator in actual containers with no network, 2 CPUs, 1 GiB RAM/swap, a read-only filesystem, a non-root user, dropped capabilities, 64 PIDs, a 64 MiB temporary filesystem and a ten-second policy timeout. `ci/run_container.py` is an external wrapper that records Linux container success separately from native Windows success; Linux must not fail merely because its host is not Windows. It still requires all six families and exact recorded outcome/service metrics.

The workflow collects receipts/logs even on failure, installs pinned research dependencies, and has read-only GitHub contents access. Branch path filters exclude release-tag pushes so publishing an archive does not rerun the obsolete workflow at an old tag. These are known-world runtime checks, not a new efficacy study. The frozen release ZIPs remain unchanged; later CI corrections live in repository scripts.

The source-host receipt is an execution record, not an independent cryptographic signature. A successful GitHub-hosted Linux Docker run does not certify Docker Desktop on the user's laptop. A native Windows source run and Linux container run establish different properties.

The snapshot in VERIFICATION.json describes evidence available during packaging. Its Git publication fields have been updated for the known publication; CI status remains pending until a real run supplies receipts. No frozen archive contents are rewritten by these repository updates.
