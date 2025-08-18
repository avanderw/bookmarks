import { describe, it, expect } from 'vitest';
import { applyFilter } from '$lib/component/SearchQueryFilter/Logic';

describe('Advanced Bookmark Filtering', () => {
	const testBookmarks = [
		{
			url: 'https://github.com/test/repo',
			title: 'Test Repository',
			description: 'A test repository',
			tags: ['development', 'github'],
			notes: 'Important project',
			added: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), // 50 days ago
			clicked: 0,
			last: null,
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
			browser: 'Chrome',
			os: 'Windows 10/11',
			device: 'Desktop'
		},
		{
			url: 'https://docs.react.dev',
			title: 'React Documentation',
			description: 'Official React docs',
			tags: ['react', 'documentation'],
			notes: null,
			added: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
			clicked: 5,
			last: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // clicked 20 days ago
			userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
			browser: 'Safari',
			os: 'iOS 17.0',
			device: 'Mobile'
		},
		{
			url: 'https://stackoverflow.com/questions/12345',
			title: 'How to use React hooks',
			description: 'Stack Overflow question',
			tags: ['react', 'hooks'],
			notes: null,
			added: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000), // 400 days ago
			clicked: 10,
			last: new Date(Date.now() - 350 * 24 * 60 * 60 * 1000), // clicked 350 days ago
			userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
			browser: 'Firefox',
			os: 'macOS 10.15.7',
			device: 'Desktop'
		}
	];

	describe('Usage-based filters', () => {
		it('should filter never-clicked bookmarks', () => {
			const result = applyFilter(testBookmarks, 'clicked:=0');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].url).toBe('https://github.com/test/repo');
		});

		it('should filter old bookmarks', () => {
			// Filter bookmarks added more than 200 days ago
			const result = applyFilter(testBookmarks, 'added:>200');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].url).toBe('https://stackoverflow.com/questions/12345');
		});

		it('should filter recently clicked bookmarks', () => {
			// Filter bookmarks clicked in last 300 days
			const result = applyFilter(testBookmarks, 'clicked:<300');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].url).toBe('https://docs.react.dev');
		});
	});

	describe('Device and system filters', () => {
		it('should filter by device type', () => {
			const result = applyFilter(testBookmarks, 'device:mobile');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].url).toBe('https://docs.react.dev');
		});

		it('should filter by operating system', () => {
			const result = applyFilter(testBookmarks, 'os:windows');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].browser).toBe('Chrome');
		});

		it('should filter by browser', () => {
			const result = applyFilter(testBookmarks, 'browser:firefox');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].url).toBe('https://stackoverflow.com/questions/12345');
		});
	});

	describe('Date-based filters', () => {
		it('should filter by added date (recent)', () => {
			// Filter bookmarks added in last 150 days (should get first two)
			const result = applyFilter(testBookmarks, 'added:<150');
			expect(result.data).toHaveLength(2);
			const urls = result.data.map((item) => item.url);
			expect(urls).toContain('https://github.com/test/repo');
			expect(urls).toContain('https://docs.react.dev');
		});

		it('should filter by clicked date (old)', () => {
			// Filter bookmarks not clicked in 300+ days (old clicks)
			const result = applyFilter(testBookmarks, 'clicked:>300');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].url).toBe('https://stackoverflow.com/questions/12345');
		});
	});

	describe('Combined filters', () => {
		it('should combine special filters with text search', () => {
			const result = applyFilter(testBookmarks, 'github never-clicked');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].url).toBe('https://github.com/test/repo');
		});

		it('should combine multiple special filters', () => {
			const result = applyFilter(testBookmarks, 'device:mobile browser:safari');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].url).toBe('https://docs.react.dev');
		});

		it('should exclude with NOT operator', () => {
			const result = applyFilter(testBookmarks, 'device:desktop -github');
			expect(result.data).toHaveLength(1);
			expect(result.data[0].url).toBe('https://stackoverflow.com/questions/12345');
		});
	});

	describe('Edge cases', () => {
		it('should handle empty queries', () => {
			const result = applyFilter(testBookmarks, '');
			expect(result.data).toHaveLength(3);
		});

		it('should handle non-matching filters', () => {
			const result = applyFilter(testBookmarks, 'device:tablet');
			expect(result.data).toHaveLength(0);
		});

		it('should handle bookmarks without metadata gracefully', () => {
			const bookmarkWithoutMeta = {
				url: 'https://example.com',
				title: 'Example',
				description: null,
				tags: [],
				notes: null,
				added: new Date('2024-01-01'),
				clicked: 0,
				last: null
			};

			const result = applyFilter([bookmarkWithoutMeta], 'device:mobile');
			expect(result.data).toHaveLength(0);
		});
	});
});
