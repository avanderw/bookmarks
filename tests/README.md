# Test Setup

This project now uses [Vitest](https://vitest.dev/) for testing. The test files have been organized into a proper structure.

## Test Structure

```
tests/
├── fixtures/           # Test data files (JSON)
├── mocks/              # Mock modules for testing
├── setup.ts            # Test setup and global mocks
└── unit/               # Unit test files
```

## Available Test Scripts

- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:coverage` - Run tests with coverage report

## Test Files

### Unit Tests

- `advanced-filtering.test.ts` - Tests for bookmark filtering functionality
- `clean-urls.test.ts` - Tests for URL validation and cleanup
- `improved-tag-filtering.test.ts` - Tests for enhanced tag filtering
- `relevance-utils.test.ts` - Tests for bookmark relevance scoring algorithm
- `tag-filtering.test.ts` - Tests for tag exclusion logic
- `url-validation.test.ts` - Tests for URL validation functions
- `user-agent.test.ts` - Tests for user agent parsing

### Fixtures

- `test-bookmarks.json` - Sample bookmark data
- `test-bookmarks-with-tags.json` - Bookmark data with tags
- `test-duplicates.json` - Test data for duplicate detection
- `test-import*.json` - Test data for import functionality

## Configuration

The project uses:

- **Vitest** as the test runner
- **jsdom** for DOM simulation
- **TypeScript** support
- **SvelteKit** path aliases (`$lib`)
- Global test utilities (describe, it, expect)

## Mocks

The test setup includes mocks for:

- `$app/environment` - SvelteKit environment module
- `localStorage` - Browser storage API
- File System Access API
- Crypto API
- Blob constructor

## Running Tests

To run all tests:

```bash
npm test
```

To run specific test files:

```bash
npm test advanced-filtering
```

To run tests with UI:

```bash
npm run test:ui
```

## Migration Summary

The following test files were migrated from the root directory:

- `test-advanced-filtering.js` → `tests/unit/advanced-filtering.test.ts`
- `test-clean-urls.js` → `tests/unit/clean-urls.test.ts`
- `test-improved-tag-filtering.js` → `tests/unit/improved-tag-filtering.test.ts`
- `test-tag-issue.js` → `tests/unit/tag-filtering.test.ts`
- `test-url-validation.js` → `tests/unit/url-validation.test.ts`
- `test-user-agent.js` → `tests/unit/user-agent.test.ts`

All test JSON fixture files were moved to `tests/fixtures/`.

The tests were converted from various formats (some using Vitest already, some using Node.js console logging) to a consistent Vitest format with proper TypeScript support.
