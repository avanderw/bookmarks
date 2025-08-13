# Bookmarks Application - AI Coding Instructions

## Architecture Overview

This is a **SvelteKit-based bookmark manager** with a **local-first architecture** using optimized localStorage and File System Access API for persistence. The app is deployed as a static site to GitHub Pages at `/bookmarks` path.

### Key Components & Patterns

**Component Architecture**: Uses strict **Logic/View/index.ts** separation:
```
src/lib/component/ComponentName/
├── Logic.ts      # Pure functions & business logic (performance-optimized)
├── View.svelte   # UI components with minimal logic  
├── index.ts      # Exports (export { default as ComponentName } from './View.svelte')
```

**Data Flow**: 
- `src/lib/bookmarks.ts` - Core `Bookmark` interface with user agent tracking
- `src/lib/storage.ts` - Optimized localStorage with size monitoring & migration
- `src/lib/cache-store.ts` - File system sync with conflict detection
- **Performance-first**: Cached search text, debounced operations, smart change detection

## Core Concepts

### Enhanced Bookmark Data Structure
```typescript
interface Bookmark {
    url: string;
    title: string | null;
    description: string | null; 
    tags: string[];
    notes: string | null;
    added: Date;
    clicked: number;
    last: Date | null;
    userAgent?: string;    // New: Browser tracking
    browser?: string;      // New: Browser type
    os?: string;          // New: Operating system  
    device?: string;      // New: Device type
}
```

### Design System Migration
- **Pico CSS**: Migrated from custom CSS to Pico framework with `data-theme="auto"`
- **Modern HTML**: Uses semantic `<dialog>`, `<article>`, proper form structures
- **Theme Support**: Automatic light/dark mode with manual toggle

### Advanced Filtering System
- **Complex Queries**: `+term` (AND), `-term` (NOT), `"exact phrase"`, special filters
- **Usage Filters**: `never-clicked`, `old-unvisited`, `stale` for bookmark management
- **Device Filters**: `device:mobile`, `browser:chrome`, `os:windows` for cross-device tracking
- **Performance**: Cached search text, 500ms debounce, early exits

### Storage Architecture
- **Optimized localStorage**: Size monitoring with 4MB warning, 8MB critical thresholds
- **Migration Support**: Handles legacy array format, version updates automatically  
- **Export/Import**: JSON backup with invalid URL filtering during import
- **File Sync**: Optional File System Access API with hash-based change detection

## Development Workflows

### Running & Building
```bash
npm run dev              # Development server
npm run build           # Production build (static)
npm run preview         # Preview production build
```

### Quality & Testing
```bash
npm run check           # TypeScript + Svelte checks
npm run lint            # ESLint + Prettier checks
npm run format          # Auto-format code
```

**Testing Approach**: Node.js test files (`test-*.js`) in root directory testing core Logic modules
- `test-advanced-filtering.js` - Complex filter scenarios
- `test-*.json` - Test data fixtures for various scenarios

## Performance Patterns

### Critical Optimizations (see PERFORMANCE_OPTIMIZATIONS.md)
- **Search Caching**: `item._searchText` cached per bookmark to avoid JSON.stringify()
- **Smart Reactivity**: Data change detection via hash comparison prevents unnecessary searches
- **Conditional Processing**: Only create searchable text when filters require it
- **Early Exits**: Multiple bailout conditions before expensive operations

### Performance Debugging
```typescript
import { PerformanceMonitor } from '$lib/utils/PerformanceMonitor';
PerformanceMonitor.enable(); // For debugging only
```

## Project-Specific Conventions

### URL & Configuration
- `src/lib/config.ts` - Deployment URLs (`avanderw.co.za/bookmarks/`)
- `src/lib/url.ts` - Bookmarklet integration via query params: `h`, `t`, `d`
- User agent parsing in `src/lib/utils/UserAgentUtils.ts`

### Component Communication
- **Event-driven**: `createEventDispatcher()` for parent communication, no global state
- **Pagination**: `PaginationUtils.ts` with smart recalculation detection
- **File Management**: `FileUtils.ts` handles import/export with storage monitoring

### Critical Files
- `src/lib/storage.ts` - Core persistence with migration & size monitoring
- `src/lib/component/SearchQueryFilter/Logic.ts` - Performance-optimized filtering
- `src/lib/component/BookmarkManager/` - Main app component with pagination
- `src/lib/component/DuplicateDetector/` - URL normalization & duplicate detection

## Integration Points

- **Pico CSS**: `@picocss/pico` with automatic theming, semantic HTML structures
- **File System Access API**: Modern browser file sync (fallback gracefully)
- **User Agent Detection**: Cross-platform bookmark tracking with device/browser info
- **GitHub Pages**: Static deployment with `/bookmarks` base path

## Key Constraints

- **Performance-First**: Always consider 140+ bookmark datasets, cache expensive operations
- **Local-First**: Browser storage is primary, file sync is enhancement  
- **Migration-Safe**: Support legacy data formats, handle storage size limits gracefully
- **Accessible**: Use Pico's semantic HTML, proper ARIA attributes

When adding features: cache expensive computations, use typed interfaces, test with large datasets, maintain Logic/View separation.
