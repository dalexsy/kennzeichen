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

Median **80s** · wait `block_until_ms` **114521** chunks, total **114521** · details: `.dryl-deploy-timing.json`

Updated: 2026-08-16T16:54:36Z · source: `directory/data/deploy-timing.json`

<!-- end deploy-timing -->

---

## Deploy & verify

- **Deploy:** _(fill in, e.g. `npm run deploy:dryl`)_
- **Post-deploy verify:** `node ../directory/scripts/verify-dryl-app.mjs https://…` _(if `drylApi` in dryl-static-sites.json)_
