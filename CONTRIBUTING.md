# Contributing

Open a focused issue or pull request describing the observed problem, proposed change and validation. Include the Python version, operating system, command and relevant logs. Use synthetic examples; remove credentials and personal data.

## Frozen submission

Do not edit the published ZIP or checksum as part of a documentation or CI change. Its immutable identity is recorded in README.md. Develop changes in a separate extracted working copy and publish a new explicitly named research artifact only after review. Do not add old-version ZIPs inside the current submission.

## Research changes

- Register seeds, comparison methods, budget and decision criteria before evaluating new worlds.
- Keep point-in-time features and mature labels; do not invent counterfactual outcomes.
- Compare complete policies against the incumbent and relevant component controls.
- Report failures, family regressions, served waits and unserved counts.
- Separate repeated executions from independent worlds and prediction diagnostics from game outcomes.
- Do not promote an experimental policy without performance and exact-mode runtime evidence.

## Repository checks

With CPython 3.12, run the archive verifier from this repository:

```bash
python ci/verify_archive.py --destination ../Blackbox_Check --receipt ../Blackbox_Check_Receipt.json
```

Use a fresh destination. Install the extracted project's pinned research requirements before running its release checks. The CI workflow collects Windows, Linux and Docker results separately. The archive's own README documents refitting and reproduction entrypoints.

Keep updates small, preserve third-party notices, and state which checks actually ran. A green source check is not proof of a Docker pass or improved MSMI.
