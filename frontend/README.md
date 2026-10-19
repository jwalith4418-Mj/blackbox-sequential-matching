# Blackbox — Live Matching Workspace

The current frontend, server-side conservative matching engine, pair explanations and original confirmation casebook. The frozen Python submission in the repository root remains unchanged.

## What is included

- Live matching, saved sessions, profile search and manual pair review.
- Wrapped Results cards with outcome reasons and attribute/reply timelines.
- All 242 successful and 238 zero-score historical runs, with pair-level evidence for every run: 35,837 introductions and 342 official qualifying couples.
- Shared, differing, unknown and declined attributes are separate. Missing feedback is not a rejection.
- Original historical action hashes and outcome counts are verified. Reconstructed observations are reproducibility evidence, not new independent evaluation or training data.

## Run locally

Use Node.js 24 and Python 3 for the full checks:

```bash
npm ci
npm run build
npm test
npm run dev
```

Open http://localhost:3000. Local development uses a SQLite file under `.runtime/`; production requires a remote libSQL database. Cookies are HttpOnly, Secure and SameSite=Strict; modern browsers treat localhost as a secure context.

## Vercel deployment

1. Import `jwalith4418-Mj/blackbox-sequential-matching` into the intended Vercel workspace and set **Root Directory** to `frontend`.
2. Keep **Deployment Protection → Vercel Authentication** enabled for all deployments. The existing prototype is private; do not turn off protection as an access-error workaround.
3. Provision a Turso/libSQL database (free tier where available) and connect it to this project. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel's protected environment settings, never in Git. The first API request initializes the isolated session table with `CREATE TABLE IF NOT EXISTS`.
4. Use the committed `vercel.json`: `npm ci`, `npm run build`, output `dist`, Node.js 24. The api/ functions remain server-side.
5. After deployment, require `/api/health` to return `ok: true`. Test create → step → restore, cross-browser ownership isolation, stale revision rejection, live attributes and a historical successful pair before promoting.

The current connected Vercel account returned HTTP 403 for the intended workspace (`jwalith4418-2769s-projects`). This is a workspace permission blocker; no Vercel deployment or remote-database verification is claimed by this source upload.

## Backend boundary

The standalone Vercel target uses Node.js Functions and a small libSQL adapter around the existing store's SQL. It keeps atomic revision compare-and-swap, request-ID idempotency, reciprocal eligibility and the original conservative decisions. A server-issued 256-bit HttpOnly cookie isolates each browser's saved sessions; forged Sites identity headers are discarded. This is browser isolation, not account login. Vercel Authentication must protect the whole private deployment.

The original Sites deployment continues to use Sites identity and Cloudflare D1. Its saved sessions are not copied or exposed by this separate deployment. Historical benchmark records are shared read-only static evidence. No temporary function filesystem or in-memory map is used for production persistence. The private diagnostic write endpoint from Sites is excluded.

## Evidence packaging

The 480 large pair-detail JSON files are stored as deterministic gzip data encoded in base64 text files under public/data/confirmation-details/. `npm run build` restores their exact bytes and verifies each SHA-256 against manifest.json, then emits the static site. This avoids committing 130 MiB of repeated JSON while preserving all records. The output contains ordinary JSON files; the browser needs no decompression code. These are compressed data encoded for transport, not nested submission ZIPs.

Training, model promotion and benchmark claims remain separate from live synthetic simulation. The deployed policy remains conservative. Simulator private truth and future events stay on the server; pair explanations use disclosed observations only. The full submission architecture image describes the separate Python research release.

## Verification scope

`npm test` exercises 12 deterministic sessions, 1,200 days, pair explanations, Results/UI flows, all 480 historical records, and real Vercel handlers with a disposable SQLite file through the actual libSQL driver. Handler checks cover secure visitor cookies, forged-header stripping, cross-owner access, same-origin writes, oversized requests, idempotency, competing updates and hidden-data exclusion. Local tests are not a claim of remote Vercel or Turso verification.

The UI tests use a Node VM and mocked transport; browser visual QA remains unverified. See THIRD_PARTY_NOTICES.md and licenses/public-kit.LICENSE for upstream attribution. No blanket license is added to the previously frozen research archive.
