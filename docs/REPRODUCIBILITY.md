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

The workflow verifies the unchanged archive on Windows and Linux. Linux additionally executes the conservative image with the project's constrained Docker validator. It collects receipts/logs even on failure, installs pinned research dependencies, and has read-only GitHub contents access. It runs known-world runtime checks, not a new efficacy study.

The source-host receipt is an execution record, not an independent cryptographic signature. A successful GitHub-hosted Linux Docker run does not certify Docker Desktop on the user's laptop. A native Windows source run and Linux container run establish different properties.

The snapshot in VERIFICATION.json describes evidence available during packaging. Its Git publication fields have been updated for the known publication; CI status remains pending until a real run supplies receipts. No frozen archive contents are rewritten by these repository updates.
