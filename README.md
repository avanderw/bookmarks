# Bookmarks Manager

A modern, local-first bookmark manager built with SvelteKit and Pico CSS. Manage, search, and organize your bookmarks with advanced filtering, duplicate detection, and file synchronization.

## ✨ Features

- **🔍 Advanced Search & Filtering** - Complex queries with AND/OR logic, exact phrases, and special filters
- **📊 Smart Duplicate Detection** - Find and manage duplicate bookmarks with confidence scoring
- **💾 Local-First Storage** - All data stored locally with optional file synchronization
- **🎨 Modern UI** - Clean, responsive design with automatic dark/light theme
- **📱 Cross-Device Tracking** - Browser and device information for bookmark organization
- **📈 Usage Analytics** - Relevance scoring based on click patterns and recency
- **🏷️ Tag Management** - Organize bookmarks with tags and smart tag suggestions
- **⚡ Performance Optimized** - Cached search, debounced operations, smart change detection

## 🚀 Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Format code
npm run format

# Lint code
npm run lint
```

### Building

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## 🏗️ Architecture

### Component Structure

All components follow a strict **Logic/View/index.ts** pattern:

- `Logic.ts` - Pure functions and business logic
- `View.svelte` - UI components with minimal logic
- `index.ts` - Component exports

### Key Technologies

- **SvelteKit** - Full-stack web framework
- **TypeScript** - Type safety and better DX
- **Pico CSS** - Modern, semantic CSS framework
- **Vitest** - Fast unit testing with TypeScript support
- **File System Access API** - Modern file handling

### Storage Architecture

- **Optimized localStorage** - Primary storage with size monitoring
- **File synchronization** - Optional sync with hash-based change detection
- **Migration support** - Handles legacy data formats automatically

## 🧪 Testing

- **Framework**: Vitest with TypeScript support and jsdom environment
- **Location**: All tests in `tests/unit/` directory as `.test.ts` files
- **Fixtures**: Test data in `tests/fixtures/` as JSON files
- **Coverage**: 66 tests across 7 test files

```bash
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
```

## 📁 Project Structure

```
src/
├── lib/
│   ├── component/          # Reusable components (Logic/View/index pattern)
│   ├── utils/              # Utility functions and helpers
│   ├── bookmarks.ts        # Core bookmark interfaces and store
│   ├── storage.ts          # Optimized localStorage management
│   └── cache-store.ts      # File system synchronization
├── routes/
│   ├── +layout.js          # App layout configuration
│   └── +page.svelte        # Main application page
tests/
├── fixtures/               # Test data files
├── unit/                   # Unit test files (.test.ts)
└── setup.ts                # Test configuration
```

## 🔧 Configuration

- **Base Path**: `/bookmarks` (for GitHub Pages deployment)
- **Storage Version**: Automatic migration for data format changes
- **Performance**: 500ms debounce, 4MB storage warning, 8MB critical threshold

## 🐛 Development Notes

### ESLint Status

- **Current Issues**: 65 problems (27 errors, 38 warnings)
- **Recent Cleanup**: Removed unused dependencies, duplicate interfaces, legacy files
- **Main Issues**: Type annotations, case declarations, explicit any types

### Recent Maintenance (2025-08-18)

- ✅ Removed unused dependencies (`bootstrap-icons`, `crypto-js`)
- ✅ Consolidated duplicate `Bookmark` interface definitions
- ✅ Removed legacy `stores.ts` file
- ✅ Added missing `FileManager/Logic.ts` implementation
- ✅ Cleaned up outdated documentation files
- ✅ Fixed import issues and unused variables
- ✅ All tests passing (66/66)

## 📄 License

This project is private and not licensed for public use.
