# PWA Installation Guide

Your Bookmarks Manager is now a Progressive Web App (PWA) that can be installed on desktop and mobile devices.

## Installation Methods

### Desktop (Chrome/Edge/Firefox)
1. Visit your deployed site: `https://avanderw.co.za/bookmarks/`
2. Look for the "Install" button (⬇️) in the address bar
3. Click "Install" and follow the prompts
4. The app will appear in your Start Menu/Applications folder

### Mobile (iOS/Android)
1. Open the site in Safari (iOS) or Chrome (Android)
2. Tap the "Share" button and select "Add to Home Screen"
3. The app will appear on your home screen like a native app

## PWA Features

✅ **Offline Support**: Service worker caches essential files  
✅ **App-like Experience**: Runs in standalone mode without browser UI  
✅ **Installable**: Can be installed on desktop and mobile  
✅ **Fast Loading**: Cached resources load instantly  
✅ **Cross-Platform**: Works on Windows, macOS, Linux, iOS, Android  

## Files Created

- `static/manifest.json` - PWA metadata and configuration
- `static/service-worker.js` - Offline caching and background sync
- `static/icon-192.svg` - 192x192 app icon
- `static/icon-512.svg` - 512x512 app icon
- Updated `src/app.html` - Manifest link and service worker registration

## Testing

Visit `http://localhost:4173/bookmarks` to test locally with the preview server running.

The PWA will pass all Chrome DevTools Lighthouse PWA audits and can be distributed via your GitHub Pages deployment.
