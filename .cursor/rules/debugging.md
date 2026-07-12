# Debugging notes — kennzeichen

Agents: read this **before** retrying fixes. Append **Failed experiments** when something did not work so the next session does not repeat it.

Daryl maintains this solo — avoid burning cycles on approaches already ruled out.

## Failed experiments (do not repeat)

<!-- Add dated bullets when a fix attempt fails, e.g.:
- **2026-06-02** — Do not … (symptom: …)
-->

_(none yet — add entries when something fails in production or deploy.)_

## Current working approach

<!-- How deploy, auth, and the happy path work in this repo. -->

## Quick checks

| Symptom | Likely cause | Command / fix |
|--------|----------------|---------------|
| Deploy log `[ok]` but app broken in browser | HTTP smoke only hit login redirect | `node ../directory/scripts/verify-dryl-app.mjs https://<host> <site-id>` |
| `custom-token` 503 / CORS | dryl-auth down or sites.json stale | Redeploy `dryl-auth`; see directory deploy-verify rule |

## Deploy timing (auto)

Production deploy duration telemetry for **kennzeichen** (successful deploys only; outliers trimmed after 5+ samples).

| Metric | Value |
|--------|-------|
| Typical (median) | 63s |
| p75 | 85s |
| p90 | 85s |
| Last deploy | 58s |
| Samples | 3 |

- **Agent shell wait:** use `block_until_ms` **108139** (~108s) — poll every 15s; do not pad to 15+ min upfront.
- **Fast read:** `.dryl-deploy-timing.json` in repo root mirrors this table.
- **Outliers:** stalls above ~2.5× median (or 10 min) are excluded from typical/p75 after enough samples.

Updated: 2026-07-11T20:48:10Z · source: `directory/data/deploy-timing.json`

<!-- end deploy-timing -->

---

## Deploy & verify

- **Deploy:** _(fill in, e.g. `npm run deploy:dryl`)_
- **Post-deploy verify:** `node ../directory/scripts/verify-dryl-app.mjs https://…` _(if `drylApi` in dryl-static-sites.json)_
