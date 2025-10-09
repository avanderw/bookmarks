# PWA 404 Handling & Automatic Update Detection

## The Problem

When deploying new versions of a SvelteKit PWA to production:
- **Dynamic hashed filenames** change with each build (`_app/immutable/chunks/xyz123.js` → `_app/immutable/chunks/abc456.js`)
- **Service worker caches** old filenames that no longer exist
- Users see **404 errors** when cached pages try to load deleted assets
- App appears broken until manual cache clearing

## The Solution

A comprehensive multi-layer approach to detect and handle stale caches:

### 1. 404 Detection in Service Worker

**File**: `static/service-worker.js`

The service worker now actively monitors for 404 errors on `_app` resources:

```javascript
// When fetching _app files
if (response.status === 404) {
  console.warn('404 detected for _app resource:', event.request.url);
  CACHE_IS_STALE = true;
  
  // Clear the cache
  caches.delete(CACHE_NAME);
  
  // Notify all clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_STALE_DETECTED',
        reason: '404_error',
        url: event.request.url
      });
    });
  });
}
```

**Benefits**:
- Detects issues **immediately** when they occur
- Automatically clears stale cache
- Notifies all open tabs/windows

### 2. Proactive Message Listening

**File**: `src/lib/utils/CacheValidator.ts`

The client listens for service worker messages:

```typescript
private setupMessageListener(): void {
  this.messageListener = (event: MessageEvent) => {
    if (event.data && event.data.type === 'CACHE_STALE_DETECTED') {
      const status: CacheStatus = {
        isStale: true,
        currentVersion: this.lastStatus?.currentVersion || null,
        latestVersion: this.lastStatus?.latestVersion || null,
        lastCheck: new Date(),
        error: `Cache is stale (${event.data.reason}): ${event.data.url}`
      };
      
      this.updateStatus(status);
    }
  };

  navigator.serviceWorker.addEventListener('message', this.messageListener);
}
```

**Benefits**:
- Real-time notification when cache becomes stale
- No polling needed
- Works across all tabs

### 3. Enhanced UI Notification

**File**: `src/lib/component/CacheRefreshNotification/View.svelte`

The notification component now shows urgent warnings for 404 errors:

```svelte
{#if state.error?.includes('404') || state.error?.includes('stale')}
  <div class="cache-notification urgent">
    <h4>⚠️ App Update Required</h4>
    <p>
      The app has been updated and your cached version is no longer compatible. 
      <strong>Please refresh to continue using the app.</strong>
    </p>
  </div>
{/if}
```

**Benefits**:
- Clear, actionable message for users
- Visual urgency (red border, warning icon)
- Explains why refresh is needed

### 4. Version Checking Enhanced

The service worker tracks both version mismatches AND 404 detection:

```javascript
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_VERSION') {
    const isStale = CACHE_IS_STALE || (CURRENT_VERSION !== latestVersion);
    
    event.ports[0].postMessage({
      type: 'VERSION_CHECK_RESULT',
      isStale,
      reason: CACHE_IS_STALE ? '404_detected' : 'version_mismatch'
    });
  }
});
```

## How It Works: Complete Flow

### On Page Load

1. **CacheRefreshNotification** component mounts
2. Performs **single version check** (no continuous polling)
3. Service worker compares `CURRENT_VERSION` with `_app/version.json`
4. Shows notification if versions differ

### During Use (When 404 Occurs)

1. User navigates or app loads resource
2. Browser requests `_app/immutable/chunks/old-hash.js`
3. **Server returns 404** (file doesn't exist after deployment)
4. Service worker **detects 404 response**
5. Service worker:
   - Sets `CACHE_IS_STALE = true`
   - Clears cache in background
   - **Sends message to all clients**
6. **CacheValidator receives message**
7. Updates state to `isStale: true`
8. **Notification appears immediately**
9. User clicks "Refresh Now"
10. App clears all caches and reloads

### On Refresh

1. Service worker unregisters
2. All caches cleared
3. Page hard reloads
4. Fresh service worker installs with new cache name (`v4`)
5. New files cached with correct hashes

## Configuration

### Cache Name Versioning

Increment `CACHE_NAME` when making significant service worker changes:

```javascript
const CACHE_NAME = 'bookmarks-pwa-v4'; // ← Increment here
```

This forces all users to get the new service worker logic.

### Network-First Strategy

For `_app` files with dynamic hashes, we use **network-first**:

```javascript
if (event.request.url.includes('/_app/')) {
  // Try network first, fallback to cache
  fetch(event.request)
    .then(response => {
      if (response.status === 200) {
        cache.put(event.request, response.clone());
      }
      return response;
    })
    .catch(() => caches.match(event.request));
}
```

This ensures we always try to get fresh files but can work offline.

### Cache-First for Static Files

For files that **never change names** (icons, manifest):

```javascript
const urlsToCache = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/feather-sprite.svg`,
  `${BASE_PATH}/icon-192.png`,
  `${BASE_PATH}/icon-512.png`
];
```

These use **cache-first** for maximum performance.

## Testing the Solution

### Manual Testing

1. **Deploy a new version** to production
2. Open the app in a browser (loads version 1)
3. **Deploy another version** (creates version 2)
4. In the still-open browser, **navigate within the app**
5. App tries to load `_app` file from version 1
6. Server returns **404**
7. Service worker **detects 404**
8. **Notification appears immediately** with urgent warning
9. Click "Refresh Now"
10. App reloads with version 2 files

### Console Testing

```javascript
// Check if cache validator is working
console.log(window.cacheValidator);

// Manually check status
await window.cacheValidator.checkCacheStatus();

// Simulate a stale cache (developer testing)
navigator.serviceWorker.controller.postMessage({
  type: 'CACHE_STALE_DETECTED',
  reason: 'test',
  url: 'test.js'
});
```

## Benefits of This Approach

### For Users
- **No more broken app** after deployments
- **Clear instructions** on what to do
- **Automatic detection** of issues
- **Works immediately** when problem occurs

### For Developers
- **Fewer support requests** about "app not working"
- **Automatic cache management**
- **Detailed logging** for debugging
- **Graceful degradation** if service worker unavailable

### Performance
- **Single check on load** (no continuous polling)
- **Event-driven updates** (no wasted network requests)
- **Efficient caching** (network-first for dynamic, cache-first for static)

## Troubleshooting

### Notification Doesn't Appear

**Check**:
- Browser console for errors
- Service worker is registered: `navigator.serviceWorker.controller`
- Version file accessible: `/bookmarks/_app/version.json`

**Debug**:
```javascript
// Enable detailed logging
localStorage.setItem('debug-cache', 'true');
```

### 404s Still Occurring

**Possible causes**:
- Service worker not updated yet (hard refresh needed)
- Cache name not incremented
- Message listener not set up

**Fix**:
1. Increment `CACHE_NAME` in service worker
2. Hard refresh browser (Ctrl+Shift+R)
3. Check service worker in DevTools → Application → Service Workers

### Refresh Button Doesn't Work

**Possible causes**:
- Browser restrictions on cache clearing
- Service worker unregister fails

**Workaround**:
Show manual instructions to users:
```svelte
<p>
  If automatic refresh fails, please:
  1. Close all tabs with this app
  2. Clear browser cache manually
  3. Reopen the app
</p>
```

## Future Enhancements

### Potential Improvements

1. **Background sync** - Queue updates for when network available
2. **Update scheduling** - Allow users to defer updates
3. **Partial cache invalidation** - Only clear specific cache entries
4. **Offline page** - Custom offline fallback page
5. **Update changelog** - Show what's new in the update

### Not Implemented (By Design)

- **Automatic refresh** - User consent is important
- **Continuous polling** - Wastes battery/data
- **Aggressive caching** - Risk of stale data

## Related Files

- `static/service-worker.js` - Service worker logic
- `src/lib/utils/CacheValidator.ts` - Client-side validation
- `src/lib/component/CacheRefreshNotification/` - UI component
- `PWA_CACHE_VALIDATION.md` - Original cache validation docs
- `PWA_INSTALLATION.md` - PWA installation guide

## SSR Compatibility

The `CacheValidator` is designed to work in both browser and server-side rendering contexts:

```typescript
// Lazy initialization to avoid SSR issues
export const cacheValidator = typeof window !== 'undefined' 
  ? getCacheValidator() 
  : (/* SSR stub */);
```

Key SSR guards:
- Constructor only sets up message listener in browser (`typeof window !== 'undefined'`)
- All methods check for `navigator` existence before accessing service worker APIs
- Stub implementation provided for SSR that returns safe defaults
- No singleton instantiation during module load in Node.js environment

## Summary

This solution provides **comprehensive 404 handling** through:
1. ✅ **Active 404 detection** in service worker
2. ✅ **Real-time messaging** to clients
3. ✅ **Automatic cache clearing**
4. ✅ **Urgent user notifications**
5. ✅ **One-click refresh**
6. ✅ **SSR compatible** - works in both browser and Node.js environments

Users will never see a broken app after deployment - they'll always get a clear notification with instructions to refresh.
