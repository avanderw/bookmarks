import type { Bookmark, BookmarkStore } from '$lib/bookmarks';
import { readFile as importFile } from '$lib/cache-store';

export interface BookmarkDisplayProps {
  bookmarks: Bookmark[];
  onBookmarkClick: (bookmark: Bookmark) => void;
}

export async function handleFileImport(file: File): Promise<BookmarkStore> {
  try {
    const result = await importFile(file);
    return result;
  } catch (error) {
    console.error('Error importing file:', error);
    throw error;
  }
}

export function updateBookmarkClickCount(bookmark: Bookmark): Bookmark {
  return {
    ...bookmark,
    clicked: bookmark.clicked + 1,
    last: new Date()
  };
}

export function sortBookmarks(bookmarks: Bookmark[], sortBy: string): Bookmark[] {
  return [...bookmarks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      case 'url':
        return a.url.localeCompare(b.url);
      case 'date':
        return new Date(b.added).getTime() - new Date(a.added).getTime();
      case 'clicks':
        return b.clicked - a.clicked;
      default:
        return 0;
    }
  });
}