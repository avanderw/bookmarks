import { describe, it, expect } from 'vitest';
import { validateBookmark } from '../../src/lib/component/BookmarkForm/Logic';
import type { Bookmark } from '../../src/lib/bookmarks';

describe('Duplicate Validation', () => {
	const existingBookmarks: Bookmark[] = [
		{
			url: 'https://example.com',
			title: 'Example Site',
			description: null,
			tags: [],
			notes: null,
			added: new Date('2023-01-01'),
			clicked: 0,
			last: null
		},
		{
			url: 'https://github.com',
			title: 'GitHub',
			description: null,
			tags: [],
			notes: null,
			added: new Date('2023-01-02'),
			clicked: 5,
			last: new Date('2023-01-03')
		}
	];

	describe('Adding new bookmarks', () => {
		it('should allow adding a bookmark with a new URL', () => {
			const newBookmark: Bookmark = {
				url: 'https://newsite.com',
				title: 'New Site',
				description: null,
				tags: [],
				notes: null,
				added: new Date(),
				clicked: 0,
				last: null
			};

			const validation = validateBookmark(newBookmark, existingBookmarks, false);
			expect(validation.urlError).toBe(false);
			expect(validation.urlErrorMessage).toBe('');
		});

		it('should prevent adding a bookmark with a duplicate URL', () => {
			const duplicateBookmark: Bookmark = {
				url: 'https://example.com',
				title: 'Another Example',
				description: null,
				tags: [],
				notes: null,
				added: new Date(),
				clicked: 0,
				last: null
			};

			const validation = validateBookmark(duplicateBookmark, existingBookmarks, false);
			expect(validation.urlError).toBe(true);
			expect(validation.urlErrorMessage).toBe('URL already exists in your bookmarks');
		});

		it('should require a URL', () => {
			const emptyBookmark: Bookmark = {
				url: '',
				title: 'Empty URL',
				description: null,
				tags: [],
				notes: null,
				added: new Date(),
				clicked: 0,
				last: null
			};

			const validation = validateBookmark(emptyBookmark, existingBookmarks, false);
			expect(validation.urlError).toBe(true);
			expect(validation.urlErrorMessage).toBe('URL is required');
		});

		it('should require a valid URL', () => {
			const invalidBookmark: Bookmark = {
				url: 'not-a-valid-url',
				title: 'Invalid URL',
				description: null,
				tags: [],
				notes: null,
				added: new Date(),
				clicked: 0,
				last: null
			};

			const validation = validateBookmark(invalidBookmark, existingBookmarks, false);
			expect(validation.urlError).toBe(true);
			expect(validation.urlErrorMessage).toBe('Please enter a valid URL (must start with http:// or https://)');
		});
	});

	describe('Editing existing bookmarks', () => {
		it('should allow editing a bookmark without changing the URL', () => {
			const editedBookmark: Bookmark = {
				url: 'https://example.com', // Same URL as existing
				title: 'Updated Example Site',
				description: 'Updated description',
				tags: ['updated'],
				notes: 'Updated notes',
				added: new Date('2023-01-01'),
				clicked: 0,
				last: null
			};

			const validation = validateBookmark(editedBookmark, existingBookmarks, true, 'https://example.com');
			expect(validation.urlError).toBe(false);
			expect(validation.urlErrorMessage).toBe('');
		});

		it('should prevent editing to a URL that already exists on another bookmark', () => {
			const editedBookmark: Bookmark = {
				url: 'https://github.com', // Exists on another bookmark
				title: 'Updated Example Site',
				description: 'Updated description',
				tags: [],
				notes: null,
				added: new Date('2023-01-01'),
				clicked: 0,
				last: null
			};

			// Original URL was https://example.com, now trying to change to https://github.com (which exists)
			const validation = validateBookmark(editedBookmark, existingBookmarks, true, 'https://example.com');
			expect(validation.urlError).toBe(true);
			expect(validation.urlErrorMessage).toBe('URL already exists in your bookmarks');
		});

		it('should work without existing bookmarks array', () => {
			const newBookmark: Bookmark = {
				url: 'https://newsite.com',
				title: 'New Site',
				description: null,
				tags: [],
				notes: null,
				added: new Date(),
				clicked: 0,
				last: null
			};

			// Test without existing bookmarks (undefined)
			const validation = validateBookmark(newBookmark);
			expect(validation.urlError).toBe(false);
			expect(validation.urlErrorMessage).toBe('');
		});
	});
});
