import type { Bookmark } from '$lib/bookmarks';

export interface TagInfo {
  tag: string;
  count: number;
}

/**
 * Extract all unique tags from bookmarks with their usage counts
 */
export function extractTagSummary(bookmarks: Bookmark[]): TagInfo[] {
  const tagMap = new Map<string, number>();
  
  bookmarks.forEach(bookmark => {
    if (bookmark.tags && bookmark.tags.length > 0) {
      bookmark.tags.forEach(tag => {
        const normalizedTag = tag.trim().toLowerCase();
        if (normalizedTag) {
          tagMap.set(normalizedTag, (tagMap.get(normalizedTag) || 0) + 1);
        }
      });
    }
  });
  
  // Convert to array and sort by count (descending), then alphabetically
  return Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.tag.localeCompare(b.tag);
    });
}

/**
 * Filter tag summary based on search text
 */
export function filterTags(tagSummary: TagInfo[], searchText: string): TagInfo[] {
  if (!searchText.trim()) {
    return tagSummary;
  }
  
  const searchLower = searchText.toLowerCase();
  return tagSummary.filter(tagInfo => 
    tagInfo.tag.includes(searchLower)
  );
}

/**
 * Get bookmarks that have any of the specified tags
 */
export function getBookmarksByTags(bookmarks: Bookmark[], tags: string[]): Bookmark[] {
  if (!tags.length) {
    return bookmarks;
  }
  
  const normalizedTags = tags.map(tag => tag.toLowerCase());
  
  return bookmarks.filter(bookmark => {
    if (!bookmark.tags || bookmark.tags.length === 0) {
      return false;
    }
    
    return bookmark.tags.some(bookmarkTag => 
      normalizedTags.includes(bookmarkTag.toLowerCase())
    );
  });
}
