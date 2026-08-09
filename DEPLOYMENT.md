# Deployment

Production hosting is the dryl fleet on the Pi — **not** GitHub Pages.

| | |
|---|---|
| **Live URL** | https://plates.dryl.io |
| **Site id** | `plates` |
| **Deploy** | `npm run deploy:dryl` from repo root (requires Directory `:3905` + `PI_SSH_PASS` in `directory/data/local.env`) |

## Ship

```bash
# from dryl-repos/kennzeichen (clean main, pushed)
npm run deploy:dryl
```

That runs `directory/scripts/run-full-deploy.mjs plates` (build → verify:dist → Pi upload → console/visual verify).

Do **not** use Surge, Firebase Hosting, or GitHub Pages for this app.

## Local development

```bash
cd kennzeichen-app
npm install
npm start
```

App runs at http://localhost:4200 (or the port Angular prints).

## Local production build

```bash
# from repo root
npm run build
```

Or from `kennzeichen-app` with the app’s own build script. Dist is under `kennzeichen-app/dist/...` and is what `deploy:dryl` uploads after stamp/verify.

## PWA

Service worker and manifest ship with the static dist to plates.dryl.io. See `kennzeichen-app/PWA_SETUP.md`.
