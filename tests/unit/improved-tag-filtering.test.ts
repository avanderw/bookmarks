import { describe, it, expect } from 'vitest';
import { applyFilter } from '$lib/component/SearchQueryFilter/Logic';

describe('Improved Tag Filtering', () => {
	const testBookmarks = [
		{
			url: 'https://capitec1.com',
			title: 'Capitec Bank',
			description: null,
			tags: ['capitec', 'bank', 'finance'],
			notes: null,
			added: new Date('2024-01-01'),
			clicked: 0,
			last: null
		},
		{
			url: 'https://capitec2.com',
			title: 'Capitec with NPR content',
			description: null,
			tags: ['capitec', 'npr', 'finance'], // Has BOTH capitec AND npr
			notes: null,
			added: new Date('2024-01-01'),
			clicked: 0,
			last: null
		},
		{
			url: 'https://npr1.com',
			title: 'NPR News',
			description: null,
			tags: ['npr', 'news'],
			notes: null,
			added: new Date('2024-01-01'),
			clicked: 0,
			last: null
		},
		{
			url: 'https://capitec3.com',
			title: 'Pure Capitec',
			description: null,
			tags: ['capitec'], // Only capitec, no npr
			notes: null,
			added: new Date('2024-01-01'),
			clicked: 0,
			last: null
		}
	];

	describe('Tag negation with tag: syntax', () => {
		it('should find items with capitec tag but exclude items with npr tag', () => {
			const result = applyFilter(testBookmarks, 'tag:capitec -tag:npr');

			// Should find capitec1.com and capitec3.com, but NOT capitec2.com
			expect(result.data).toHaveLength(2);

			const urls = result.data.map((item) => item.url);
			expect(urls).toContain('https://capitec1.com');
			expect(urls).toContain('https://capitec3.com');
			expect(urls).not.toContain('https://capitec2.com'); // This had both capitec AND npr
			expect(urls).not.toContain('https://npr1.com');
		});
	});

	describe('Tag negation with # syntax', () => {
		it('should support # syntax for tags', () => {
			const result = applyFilter(testBookmarks, '#capitec -#npr');

			// Should behave identically to tag: syntax
			expect(result.data).toHaveLength(2);

			const urls = result.data.map((item) => item.url);
			expect(urls).toContain('https://capitec1.com');
			expect(urls).toContain('https://capitec3.com');
			expect(urls).not.toContain('https://capitec2.com');
		});

		it('should support mixed # and tag: syntax', () => {
			const result = applyFilter(testBookmarks, '#capitec -tag:npr');

			expect(result.data).toHaveLength(2);
			const urls = result.data.map((item) => item.url);
			expect(urls).toContain('https://capitec1.com');
			expect(urls).toContain('https://capitec3.com');
			expect(urls).not.toContain('https://capitec2.com');
		});
	});

	describe('Complex tag combinations', () => {
		it('should handle multiple positive tags', () => {
			const result = applyFilter(testBookmarks, 'tag:capitec tag:finance');

			// Should find items that have BOTH capitec AND finance tags
			expect(result.data).toHaveLength(2);
			const urls = result.data.map((item) => item.url);
			expect(urls).toContain('https://capitec1.com');
			expect(urls).toContain('https://capitec2.com');
		});

		it('should handle multiple negative tags', () => {
			const result = applyFilter(testBookmarks, '-tag:npr -tag:news');

			// Should exclude items with npr OR news tags
			expect(result.data).toHaveLength(2);
			const urls = result.data.map((item) => item.url);
			expect(urls).toContain('https://capitec1.com');
			expect(urls).toContain('https://capitec3.com');
		});
	});

	describe('Parsed filter options', () => {
		it('should correctly parse positive and negative special filters', () => {
			const result = applyFilter(testBookmarks, 'tag:capitec -tag:npr');

			expect(result.options.special).toHaveLength(1);
			expect(result.options.special[0]).toEqual({ type: 'tag', value: 'capitec' });

			expect(result.options.notSpecial).toHaveLength(1);
			expect(result.options.notSpecial[0]).toEqual({ type: 'tag', value: 'npr' });

			// Text filters should be empty since these are special filters
			expect(result.options.not).toHaveLength(0);
		});

		it('should correctly parse # syntax', () => {
			const result = applyFilter(testBookmarks, '#react -#archived');

			expect(result.options.special).toHaveLength(1);
			expect(result.options.special[0]).toEqual({ type: 'tag', value: 'react' });

			expect(result.options.notSpecial).toHaveLength(1);
			expect(result.options.notSpecial[0]).toEqual({ type: 'tag', value: 'archived' });
		});
	});
});
