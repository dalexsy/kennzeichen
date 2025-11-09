# PWA Icon Setup

This app is now configured as a Progressive Web App (PWA). To complete the setup, you need to add icon files to the `public` folder.

## Required Icons

Create the following icon files and place them in `kennzeichen-app/public/`:

1. **icon-192.png** - 192x192px PNG icon
2. **icon-512.png** - 512x512px PNG icon
3. **icon-192-maskable.png** - 192x192px PNG icon with safe zone for maskable icons
4. **icon-512-maskable.png** - 512x512px PNG icon with safe zone for maskable icons

### Creating Icons

For maskable icons, ensure your logo/design is centered within a safe zone:

- Keep important content within the center 80% of the image
- Use a solid background color (the theme color: #f7a45f or background: #fffae4)
- The outer 10% on all sides may be cropped on some devices

### Tools

You can use these tools to generate PWA icons:

- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [Maskable.app](https://maskable.app/) - Test maskable icons
- [RealFaviconGenerator](https://realfavicongenerator.net/)

### Quick Setup with a Single Image

If you have a single logo/icon image, you can use this command with PWA Asset Generator:

```bash
npx pwa-asset-generator your-logo.png public --icon-only --background "#fffae4" --type png
```

Then rename the generated files to match the required names above.

## Testing PWA

1. Build the production version: `npm run build`
2. Serve the `dist` folder with a static server
3. Open in a mobile browser or Chrome DevTools Application tab
4. Check that the manifest loads and service worker registers
5. Try the "Install" prompt on supported browsers

## GitHub Pages Deployment

For GitHub Pages, make sure to:

1. Build with the correct base href: `ng build --base-href=/your-repo-name/`
2. Add a 404.html that redirects to index.html for client-side routing
3. The service worker and manifest will work automatically

## Service Worker

The service worker (`sw.js`) is configured to:

- Cache static assets on install
- Serve cached content when offline
- Update the cache with new content when online
- Clean up old caches on activation

The app will work offline after the first visit!
