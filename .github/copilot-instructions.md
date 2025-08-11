# Bookmarks Application - AI Coding Instructions

## Architecture Overview

This is a **SvelteKit-based bookmark manager** with a **local-first architecture** using browser localStorage and File System Access API for persistence. The app is deployed as a static site to GitHub Pages at `/bookmarks` path.

### Key Components & Patterns

**Component Architecture**: Uses a strict **Logic/View/index.ts** pattern:
```
src/lib/component/ComponentName/
├── Logic.ts      # Business logic & pure functions
├── View.svelte   # UI components with minimal logic  
├── index.ts      # Exports (export { default as ComponentName } from './View.svelte')
```

**Data Flow**: 
- `src/lib/bookmarks.ts` - Core `Bookmark` interface and data structures
- `src/lib/cache-store.ts` - File system sync with auto-save/conflict detection
- Local storage as primary persistence, with optional file sync using File System Access API

## Core Concepts

### Bookmark Data Structure
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
}
```

### Configuration & Deployment
- **Static adapter**: Uses `@sveltejs/adapter-static` with base path `/bookmarks`
- **URLs**: Configured in `src/lib/config.ts` with `getBaseUrl()` for bookmarklet generation
- **GitHub Pages**: Auto-deploys from master branch via `.github/workflows/github-pages.yml`

### Local-First Data Management
- **Primary storage**: Browser localStorage with versioned `BookmarkStore` format
- **File sync**: Optional file system integration via `cache-store.ts` with:
  - Auto-save on changes
  - File modification detection
  - Conflict resolution prompts
  - Hash-based change detection

## Development Workflows

### Running the Application
```bash
npm run dev              # Development server
npm run build           # Production build (static)
npm run preview         # Preview production build
```

### Code Quality
```bash
npm run check           # TypeScript + Svelte checks
npm run lint            # ESLint + Prettier checks
npm run format          # Auto-format code
```

## Project-Specific Conventions

### URL Parameter Handling
- Uses `getUrlParameter()` from `src/lib/url.ts` for bookmarklet integration
- Query params: `h` (href), `t` (title), `d` (description) populate bookmark forms

### Component State Management
- **Event-driven**: Components use `createEventDispatcher()` for parent communication
- **No global state**: Each component manages its own state, data flows via props/events
- **Pagination**: Built into `BookmarkManager` with `PaginationUtils.ts`

### File Structure Patterns
- `src/lib/component/` - Reusable components with Logic/View separation
- `src/routes/` - Page-level Svelte components (layout follows SvelteKit conventions)
- `v2/` - Legacy HTML bookmark viewer (separate from main app)

### Bookmarklet Integration
- Self-contained JavaScript generated in `Bookmarklet/Logic.ts`
- Embeds configuration directly to avoid external dependencies
- Opens current page details in bookmark form via URL parameters

## Key Files for Context

- `src/lib/bookmarks.ts` - Core data types
- `src/lib/cache-store.ts` - File system & storage logic
- `src/lib/component/BookmarkManager/` - Main application component
- `src/lib/config.ts` - URL configuration for deployment
- `svelte.config.js` - Static adapter with `/bookmarks` base path

## Integration Points

- **File System Access API**: For local file sync (modern browsers only)
- **GitHub Pages**: Static deployment with custom domain support
- **Feather Icons**: Via `static/feather-sprite.svg` sprite sheet
- **Bootstrap Icons**: NPM dependency for additional iconography

When modifying components, maintain the Logic/View separation and ensure proper TypeScript interfaces. Test file import/export functionality and bookmarklet generation after changes to core data structures.
