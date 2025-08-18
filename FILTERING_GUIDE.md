# Advanced Bookmark Filtering Guide

This document describes the enhanced filtering capabilities available in the bookmark manager. You can now filter bookmarks based on usage patterns, device/system information, and date criteria using special filter keywords.

## Filter Syntax Overview

### Basic Search Operators

- **Words without prefixes**: OR search (default)
  - `github javascript` → bookmarks containing "github" OR "javascript"
- **`+term`**: AND operator (must contain)
  - `+github +javascript` → bookmarks containing both "github" AND "javascript"
- **`-term`**: NOT operator (exclude)
  - `github -readme` → bookmarks containing "github" but NOT "readme"
- **`"exact phrase"`**: Exact phrase matching
  - `"react hooks"` → bookmarks containing the exact phrase "react hooks"

## Special Filters

### Usage-Based Filters

#### Never Visited Bookmarks

```
never-clicked
unvisited
```

Find bookmarks that have never been clicked (clicked count = 0).

**Example**: `never-clicked` → Show all bookmarks you've saved but never visited.

#### Old Unvisited Bookmarks

```
old-unvisited:<days>d
```

Find bookmarks added more than X days ago that have never been clicked.

**Examples**:

- `old-unvisited:30d` → Bookmarks added 30+ days ago with 0 clicks
- `old-unvisited:90d` → Bookmarks added 90+ days ago with 0 clicks

#### Stale Bookmarks

```
stale:<days>d
```

Find bookmarks that haven't been clicked in X days (excludes never-clicked bookmarks).

**Examples**:

- `stale:90d` → Bookmarks not clicked in 90+ days
- `stale:30d` → Bookmarks not clicked in 30+ days

### Device & System Filters

#### Device Type

```
device:mobile
device:desktop
device:tablet
```

Filter bookmarks by the device type they were saved from.

**Examples**:

- `device:mobile` → Bookmarks saved from mobile devices
- `device:desktop` → Bookmarks saved from desktop computers

#### Operating System

```
os:windows
os:macos
os:android
os:ios
os:linux
```

Filter bookmarks by the operating system they were saved from.

**Examples**:

- `os:windows` → Bookmarks saved from Windows
- `os:android` → Bookmarks saved from Android devices

#### Browser

```
browser:chrome
browser:firefox
browser:safari
browser:edge
browser:opera
```

Filter bookmarks by the browser they were saved from.

**Examples**:

- `browser:chrome` → Bookmarks saved using Chrome
- `browser:firefox` → Bookmarks saved using Firefox

### Date-Based Filters

#### Added Date Filters

```
added:>30d    # Added more than 30 days ago
added:<7d     # Added in the last 7 days
added:>=60d   # Added 60+ days ago
added:<=14d   # Added within 14 days
```

#### Last Clicked Filters

```
clicked:>90d   # Last clicked more than 90 days ago
clicked:<30d   # Last clicked within 30 days
clicked:>=180d # Last clicked 180+ days ago
```

## Practical Examples

### Finding Unused Bookmarks

**Find all bookmarks never visited**:

```
never-clicked
```

**Find old bookmarks that were never used**:

```
old-unvisited:60d
```

**Find bookmarks that haven't been used in a long time**:

```
stale:120d
```

### Device-Specific Cleanup

**Find unused mobile bookmarks**:

```
never-clicked device:mobile
```

**Find old unused Chrome bookmarks**:

```
old-unvisited:90d browser:chrome
```

**Find Android bookmarks not used recently**:

```
device:mobile os:android stale:60d
```

### Cross-Device Analysis

**Compare mobile vs desktop bookmark usage**:

```
# Mobile bookmarks
device:mobile

# Desktop bookmarks
device:desktop

# Mobile bookmarks never used
device:mobile never-clicked
```

**Find bookmarks saved on different systems**:

```
# Windows bookmarks
os:windows

# Mac bookmarks
os:macos

# Mobile bookmarks (Android/iOS)
os:android os:ios
```

### Advanced Combinations

**Important but unused bookmarks**:

```
+important never-clicked
```

**Old work-related bookmarks**:

```
+work old-unvisited:30d
```

**GitHub repositories saved but never visited**:

```
github never-clicked
```

**Documentation bookmarks that are stale**:

```
+docs stale:90d
```

**Exclude certain types while filtering**:

```
never-clicked -readme -documentation
```

**Mobile bookmarks from Chrome that are old and unused**:

```
device:mobile browser:chrome old-unvisited:45d
```

## Tips for Effective Filtering

### 1. Regular Cleanup Workflows

- **Weekly**: `never-clicked` → Review and clean unused bookmarks
- **Monthly**: `old-unvisited:30d` → Remove old unused bookmarks
- **Quarterly**: `stale:90d` → Review infrequently used bookmarks

### 2. Device-Specific Organization

- Use `device:mobile` to find bookmarks saved while mobile browsing
- Use `os:android device:mobile` for Android-specific bookmarks
- Cross-reference with usage: `device:mobile never-clicked`

### 3. Browser Migration

- When switching browsers, use `browser:chrome` to find Chrome bookmarks
- Combine with usage data: `browser:chrome stale:60d`

### 4. Time-Based Analysis

- Find recent additions: `added:<7d`
- Find old additions: `added:>180d`
- Find recently used: `clicked:<14d`

### 5. Combining Filters

- Mix special filters with regular search: `github never-clicked`
- Use exclusions: `device:mobile -android` (mobile but not Android)
- Chain multiple conditions: `old-unvisited:60d device:desktop browser:chrome`

## Performance Notes

- Special filters are applied before text search for optimal performance
- Date calculations are performed in real-time
- Combining multiple special filters is efficient
- Large bookmark collections (1000+) may have slight delays with complex queries

## Troubleshooting

### No Results Found

- Check spelling of filter keywords
- Verify date format (use `30d` not `30 days`)
- Some bookmarks may not have device/browser information if saved before the feature was added

### Unexpected Results

- Remember that text search terms are OR by default
- Use `+` prefix for AND requirements
- Use quotes for exact phrases: `"react hooks"`

### Filter Not Working

- Ensure proper syntax: `device:mobile` not `device: mobile`
- Check that the bookmark has the relevant metadata (device, browser, etc.)
- Some older bookmarks may not have complete metadata

This filtering system is designed to help you maintain a clean, organized bookmark collection by identifying unused, redundant, or outdated bookmarks based on your actual usage patterns and the context in which they were saved.
