import { describe, it, expect } from 'vitest';
import { markAsUnsaved, markAsSaved, exportBookmarks } from '$lib/storage';
import type { BookmarkStore, Bookmark } from '$lib/bookmarks';

describe('Unsaved Changes Tracking', () => {
	const sampleBookmark: Bookmark = {
		url: 'https://example.com',
		title: 'Test Bookmark',
		description: 'A test bookmark',
		tags: ['test'],
		notes: null,
		added: new Date('2024-01-01'),
		clicked: 0,
		last: null,
		userAgent: 'Test User Agent',
		browser: 'Test Browser',
		os: 'Test OS',
		device: 'Test Device'
	};

	const sampleStore: BookmarkStore = {
		version: '2025-08-13',
		bookmarks: [sampleBookmark],
		hasUnsavedChanges: false
	};

	it('should mark bookmarks as having unsaved changes', () => {
		const result = markAsUnsaved(sampleStore);
		
		expect(result.hasUnsavedChanges).toBe(true);
		expect(result.version).toBe(sampleStore.version);
		expect(result.bookmarks).toEqual(sampleStore.bookmarks);
		
		// Original store should be unchanged
		expect(sampleStore.hasUnsavedChanges).toBe(false);
	});

	it('should mark bookmarks as saved (clear unsaved changes)', () => {
		const unsavedStore = { ...sampleStore, hasUnsavedChanges: true };
		const result = markAsSaved(unsavedStore);
		
		expect(result.hasUnsavedChanges).toBe(false);
		expect(result.version).toBe(unsavedStore.version);
		expect(result.bookmarks).toEqual(unsavedStore.bookmarks);
		
		// Original store should be unchanged
		expect(unsavedStore.hasUnsavedChanges).toBe(true);
	});

	it('should handle undefined hasUnsavedChanges field', () => {
		const storeWithoutFlag = {
			version: '2025-08-13',
			bookmarks: [sampleBookmark]
		} as BookmarkStore;
		
		const markedUnsaved = markAsUnsaved(storeWithoutFlag);
		expect(markedUnsaved.hasUnsavedChanges).toBe(true);
		
		const markedSaved = markAsSaved(storeWithoutFlag);
		expect(markedSaved.hasUnsavedChanges).toBe(false);
	});

	it('should preserve immutability when marking changes', () => {
		const result1 = markAsUnsaved(sampleStore);
		const result2 = markAsSaved(result1);
		
		// All objects should be different references
		expect(result1).not.toBe(sampleStore);
		expect(result2).not.toBe(result1);
		expect(result2).not.toBe(sampleStore);
		
		// But bookmarks arrays should be same reference (shallow copy)
		expect(result1.bookmarks).toBe(sampleStore.bookmarks);
		expect(result2.bookmarks).toBe(result1.bookmarks);
	});

	it('should maintain correct state after multiple operations', () => {
		let current = sampleStore;
		
		// Start with no unsaved changes
		expect(current.hasUnsavedChanges).toBe(false);
		
		// Mark as unsaved
		current = markAsUnsaved(current);
		expect(current.hasUnsavedChanges).toBe(true);
		
		// Mark as saved
		current = markAsSaved(current);
		expect(current.hasUnsavedChanges).toBe(false);
		
		// Mark as unsaved again
		current = markAsUnsaved(current);
		expect(current.hasUnsavedChanges).toBe(true);
	});
});
