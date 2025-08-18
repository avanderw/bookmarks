import type { Bookmark, BookmarkStore } from '$lib/bookmarks';
import { importBookmarks, cleanInvalidUrls } from '$lib/storage';
import {
	sortBookmarksByRelevance,
	DEFAULT_RELEVANCE_CONFIG,
	type RelevanceConfig
} from '$lib/utils/RelevanceUtils';

export interface BookmarkDisplayProps {
	bookmarks: Bookmark[];
	onBookmarkClick: (bookmark: Bookmark) => void;
}

export async function handleFileImport(file: File): Promise<BookmarkStore> {
	try {
		const result = await importBookmarks(file);
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

export function sortBookmarks(
	bookmarks: Bookmark[],
	sortBy: string,
	relevanceConfig?: RelevanceConfig
): Bookmark[] {
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
			case 'usage':
				// Smart usage-based sorting with time decay
				return sortBookmarksByRelevance([a, b], relevanceConfig || DEFAULT_RELEVANCE_CONFIG)[0] ===
					a
					? -1
					: 1;
			default:
				return 0;
		}
	});
}

// For performance, provide a dedicated function for full relevance sorting
export function sortBookmarksByUsageRelevance(
	bookmarks: Bookmark[],
	relevanceConfig?: RelevanceConfig
): Bookmark[] {
	return sortBookmarksByRelevance(bookmarks, relevanceConfig || DEFAULT_RELEVANCE_CONFIG);
}

export function cleanExistingBookmarks(
	bookmarks: Bookmark[],
	showAlerts: boolean = true
): { cleanedBookmarks: Bookmark[]; removedCount: number; removedBookmarks: Bookmark[] } {
	return cleanInvalidUrls(bookmarks, showAlerts);
}
