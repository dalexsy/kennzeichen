# Deployment Setup

## How This Project is Hosted

This project is **automatically deployed to GitHub Pages** using GitHub Actions.

### Current Setup

- **Hosting**: GitHub Pages
- **URL**: https://dalexsy.github.io/kennzeichen/
- **Auto-deploy**: YES ✅
- **Branch**: `main` (only pushes to main trigger deployment)

### How It Works

1. **Push to main branch** - Any push or merge to `main` triggers deployment
2. **GitHub Actions runs** - See `.github/workflows/deploy.yml`
3. **Build process**:
   - Installs dependencies
   - Builds Angular app with `npm run build -- --base-href=/kennzeichen/`
   - Uploads build artifacts to GitHub Pages
4. **Site goes live** - Usually within 2-3 minutes

### Manual Deployment

You can also trigger deployment manually:

1. Go to: https://github.com/dalexsy/kennzeichen/actions
2. Click "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select `main` branch
5. Click "Run workflow"

## Local Development

```bash
cd kennzeichen-app
npm install
npm start
```

App runs at http://localhost:4200

## Local Build (Production)

```bash
cd kennzeichen-app
npm run build -- --base-href=/kennzeichen/
```

Output goes to `kennzeichen-app/dist/license-plate-app/browser/`

## Key Differences from Your Other Project

| Feature            | This Project (Kennzeichen) | Other Project |
| ------------------ | -------------------------- | ------------- |
| Backend            | ❌ None (static)           | ✅ Firebase   |
| Hosting            | GitHub Pages               | Surge.sh      |
| Push Notifications | ❌ No                      | ✅ Yes        |
| Auto Deploy        | GitHub Actions             | Manual?       |
| PWA                | ✅ Yes (newly added)       | ✅ Yes        |

## GitHub Pages Settings

To verify/modify GitHub Pages settings:

1. Go to: https://github.com/dalexsy/kennzeichen/settings/pages
2. Should show:
   - Source: GitHub Actions
   - Branch: (managed by Actions)
   - Custom domain: (none)

## Troubleshooting

**Site not updating after push?**

1. Check Actions tab: https://github.com/dalexsy/kennzeichen/actions
2. Look for failed workflows (red X)
3. Click into the workflow to see error logs

**Build failing?**

- Check that Node version matches (currently Node 20)
- Verify package-lock.json is committed
- Test build locally first

**404 errors on refresh?**
For GitHub Pages with Angular routing, you may need a 404.html that redirects to index.html. Currently this isn't set up, so direct links to routes won't work.

## Updating Deployment

The workflow file is at: `.github/workflows/deploy.yml`

To change base URL or build settings, edit that file.

## PWA Deployment Notes

With the new PWA setup:

- Service worker (`sw.js`) will be deployed automatically
- Manifest (`manifest.json`) is included in build
- Users can install app on mobile devices
- Works offline after first visit
- **Remember to add icon files** (see PWA_SETUP.md)
