import { describe, it, expect } from 'vitest';
import { applyFilter } from '$lib/component/SearchQueryFilter/Logic';

describe('Tag Filtering Issue', () => {
	const testData = [
		{
			url: 'https://capitec1.com',
			title: 'Capitec Bank',
			description: null,
			tags: ['capitec', 'bank', 'finance'],
			notes: null,
			added: new Date(),
			clicked: 0,
			last: null
		},
		{
			url: 'https://capitec2.com',
			title: 'Capitec with NPR',
			description: null,
			tags: ['capitec', 'npr', 'finance'],
			notes: null,
			added: new Date(),
			clicked: 0,
			last: null
		},
		{
			url: 'https://npr1.com',
			title: 'NPR News',
			description: null,
			tags: ['npr', 'news'],
			notes: null,
			added: new Date(),
			clicked: 0,
			last: null
		},
		{
			url: 'https://capitec3.com',
			title: 'Pure Capitec',
			description: null,
			tags: ['capitec'],
			notes: null,
			added: new Date(),
			clicked: 0,
			last: null
		}
	];

	it('should filter items with capitec tag but NOT npr tag', () => {
		const result = applyFilter(testData, 'tag:capitec -tag:npr');

		// Should return items with capitec tag but NOT npr tag
		expect(result.data).toHaveLength(2);

		const urls = result.data.map((item) => item.url);
		expect(urls).toContain('https://capitec1.com');
		expect(urls).toContain('https://capitec3.com');
		expect(urls).not.toContain('https://capitec2.com'); // This has both capitec AND npr
		expect(urls).not.toContain('https://npr1.com'); // This only has npr
	});

	it('should not include items that have both required and excluded tags', () => {
		const result = applyFilter(testData, 'tag:capitec -tag:npr');

		// Verify that no result has both capitec and npr tags
		const hasCapitecWithNpr = result.data.some(
			(item) => item.tags.includes('capitec') && item.tags.includes('npr')
		);

		expect(hasCapitecWithNpr).toBe(false);
	});

	it('should handle multiple tag exclusions', () => {
		const testDataWithMoreTags = [
			...testData,
			{
				url: 'https://test.com',
				title: 'Test with multiple tags',
				description: null,
				tags: ['capitec', 'test', 'multiple'],
				notes: null,
				added: new Date(),
				clicked: 0,
				last: null
			}
		];

		const result = applyFilter(testDataWithMoreTags, 'tag:capitec -tag:npr -tag:test');

		expect(result.data).toHaveLength(2);
		const urls = result.data.map((item) => item.url);
		expect(urls).toContain('https://capitec1.com');
		expect(urls).toContain('https://capitec3.com');
		expect(urls).not.toContain('https://capitec2.com'); // has npr
		expect(urls).not.toContain('https://test.com'); // has test
	});

	it('should handle tag inclusion with other filters', () => {
		const result = applyFilter(testData, 'tag:capitec bank');

		// Should find items with capitec tag AND containing "bank" in searchable text
		expect(result.data).toHaveLength(1);
		expect(result.data[0].url).toBe('https://capitec1.com');
	});
});
