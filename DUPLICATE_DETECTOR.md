# Duplicate Detector Feature

The **Duplicate Detector** is a powerful tool for finding and managing duplicate or similar bookmarks in your collection. It helps you maintain a clean and organized bookmark library by identifying potential duplicates based on multiple criteria.

## Features

### Detection Types

1. **Exact Duplicates** (🔴 High Confidence - 100%)

   - Identical URLs (ignoring protocol differences like http/https and www)
   - These are definitely the same bookmark and can be safely merged

2. **Similar URLs** (🟡 Medium Confidence - 80%)

   - URLs from the same domain with similar paths
   - Different pages that might be related (e.g., /page vs /page/subpage)

3. **Similar Titles** (🟡 Medium Confidence - 75%)

   - Bookmarks with very similar titles that might refer to the same resource
   - Uses fuzzy matching to find titles that are 85% similar

4. **Same Domain** (🔵 Low Confidence - 60%)
   - Multiple bookmarks from the same website
   - Useful for organizing related bookmarks from the same source

### How to Use

1. **Open the Duplicate Detector**: Click the "Find Duplicates" button in the main toolbar
2. **Review Results**: The tool will analyze your bookmarks and group potential duplicates
3. **Filter Results**: Use the controls to filter by detection type and confidence level
4. **Take Action**: For each group, you can:
   - **Keep Newest**: Automatically keep the most recently added bookmark
   - **Keep Most Used**: Keep the bookmark with the highest click count
   - **Manual Review**: Edit or delete individual bookmarks as needed

### Understanding Confidence Scores

- **90-100%**: Almost certainly duplicates (red badge)
- **75-89%**: Likely related or similar (amber badge)
- **60-74%**: Potentially related (blue badge)

### Quick Actions

- **Expand All/Collapse All**: View all duplicate groups at once or hide details
- **Bulk Actions**: Apply the same action to all bookmarks in a group
- **Individual Actions**: Edit, delete, or click individual bookmarks

### Tips

- Start with high-confidence duplicates (exact URLs) for safe cleanup
- Review similar titles carefully as they might be different resources
- Use same-domain grouping to organize bookmarks by website
- Adjust the minimum confidence threshold to show more or fewer results

### Example Scenarios

**Exact Duplicates**:

- `https://github.com/user/repo` and `http://github.com/user/repo`
- `https://example.com` and `https://www.example.com`

**Similar URLs**:

- `https://news.ycombinator.com/` and `https://news.ycombinator.com/newest`
- `https://reddit.com/r/programming` and `https://www.reddit.com/r/programming/`

**Similar Titles**:

- "Stack Overflow" and "Stack Overflow Questions"
- "Hacker News" and "Hacker News - Newest"

The Duplicate Detector helps you maintain a clean bookmark collection without losing important links, making your bookmarks more organized and easier to navigate.
