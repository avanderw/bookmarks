import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { saveToLocalStorage, loadFromLocalStorage as loadOptimized, markAsUnsaved } from './storage';

export interface Bookmark {
	url: string;
	title: string | null;
	description: string | null;
	tags: string[];
	notes: string | null;
	added: Date;
	clicked: number;
	last: Date | null;
	userAgent?: string;
	browser?: string;
	os?: string;
	device?: string;
}

export interface BookmarkStore {
	version: string;
	bookmarks: Bookmark[];
	hasUnsavedChanges: boolean;
}

// Create the main bookmark store
export const appData = writable(loadOptimized());

// Export a utility function to mark data as unsaved when modifications occur
export function markDataAsUnsaved(data: BookmarkStore): BookmarkStore {
	return markAsUnsaved(data);
}

// Subscribe to save changes with optimized storage
appData.subscribe((value) => {
	if (browser && value) {
		saveToLocalStorage(value);
	}
});

// Debug logging
appData.subscribe((value) => {
	console.debug('Bookmark store updated:', {
		version: value.version,
		count: value.bookmarks.length,
		hasUnsavedChanges: value.hasUnsavedChanges,
		hasUnsavedChangesType: typeof value.hasUnsavedChanges
	});
});

// Legacy function - now uses optimized storage
export function loadFromLocalStorage(): BookmarkStore {
	return loadOptimized();
}
