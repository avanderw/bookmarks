import { describe, it, expect, vi } from 'vitest';
import { cleanInvalidUrls } from '$lib/storage';
import type { Bookmark } from '$lib/bookmarks';

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

describe('Clean Invalid URLs', () => {
  const testBookmarks: Bookmark[] = [
    {
      url: 'https://example.com',
      title: 'Valid HTTPS URL',
      description: null,
      tags: [],
      notes: null,
      added: new Date('2023-01-01'),
      clicked: 0,
      last: null
    },
    {
      url: 'http://test.org',
      title: 'Valid HTTP URL',
      description: null,
      tags: [],
      notes: null,
      added: new Date('2023-01-02'),
      clicked: 5,
      last: new Date('2023-01-10')
    },
    {
      url: '',
      title: 'Empty URL',
      description: null,
      tags: [],
      notes: null,
      added: new Date('2023-01-03'),
      clicked: 0,
      last: null
    },
    {
      url: 'invalid url with spaces',
      title: 'URL with spaces',
      description: null,
      tags: [],
      notes: null,
      added: new Date('2023-01-04'),
      clicked: 0,
      last: null
    },
    {
      url: 'ftp://files.example.com',
      title: 'FTP URL (invalid protocol)',
      description: null,
      tags: [],
      notes: null,
      added: new Date('2023-01-05'),
      clicked: 0,
      last: null
    },
    {
      url: 'https://valid-domain.co.uk/path?param=value',
      title: 'Complex valid URL',
      description: 'A complex URL with path and parameters',
      tags: ['test', 'complex'],
      notes: 'This should pass validation',
      added: new Date('2023-01-06'),
      clicked: 10,
      last: new Date('2023-01-15')
    },
    {
      url: '..invalid',
      title: 'Malformed URL with dots',
      description: null,
      tags: [],
      notes: null,
      added: new Date('2023-01-07'),
      clicked: 0,
      last: null
    }
  ];

  // Add a bookmark with null URL
  const testBookmarksWithNull = [
    ...testBookmarks,
    {
      url: null as any,
      title: 'Null URL',
      description: null,
      tags: [],
      notes: null,
      added: new Date('2023-01-08'),
      clicked: 0,
      last: null
    }
  ];

  it('should correctly identify and remove invalid URLs', () => {
    const result = cleanInvalidUrls(testBookmarks, false);

    expect(result.cleanedBookmarks).toHaveLength(3);
    expect(result.removedCount).toBe(4);
    expect(result.removedBookmarks).toHaveLength(4);

    // Check that valid URLs are preserved
    const validUrls = result.cleanedBookmarks.map(b => b.url);
    expect(validUrls).toContain('https://example.com');
    expect(validUrls).toContain('http://test.org');
    expect(validUrls).toContain('https://valid-domain.co.uk/path?param=value');

    // Check that invalid URLs are removed
    const removedUrls = result.removedBookmarks.map(b => b.url);
    expect(removedUrls).toContain('');
    expect(removedUrls).toContain('invalid url with spaces');
    expect(removedUrls).toContain('ftp://files.example.com');
    expect(removedUrls).toContain('..invalid');
  });

  it('should handle bookmarks with null URLs', () => {
    const result = cleanInvalidUrls(testBookmarksWithNull, false);

    expect(result.cleanedBookmarks).toHaveLength(3);
    expect(result.removedCount).toBe(5);
    expect(result.removedBookmarks).toHaveLength(5);

    // Check that the null URL bookmark is in removed bookmarks
    const removedTitles = result.removedBookmarks.map(b => b.title);
    expect(removedTitles).toContain('Null URL');
  });

  it('should preserve bookmark metadata for valid URLs', () => {
    const result = cleanInvalidUrls(testBookmarks, false);

    const complexBookmark = result.cleanedBookmarks.find(
      b => b.url === 'https://valid-domain.co.uk/path?param=value'
    );

    expect(complexBookmark).toBeDefined();
    expect(complexBookmark?.title).toBe('Complex valid URL');
    expect(complexBookmark?.description).toBe('A complex URL with path and parameters');
    expect(complexBookmark?.tags).toEqual(['test', 'complex']);
    expect(complexBookmark?.notes).toBe('This should pass validation');
    expect(complexBookmark?.clicked).toBe(10);
  });

  it('should handle empty input gracefully', () => {
    const result = cleanInvalidUrls([], false);

    expect(result.cleanedBookmarks).toHaveLength(0);
    expect(result.removedCount).toBe(0);
    expect(result.removedBookmarks).toHaveLength(0);
  });

  it('should handle all valid bookmarks', () => {
    const validBookmarks = testBookmarks.filter(b => 
      b.url === 'https://example.com' || 
      b.url === 'http://test.org' || 
      b.url === 'https://valid-domain.co.uk/path?param=value'
    );

    const result = cleanInvalidUrls(validBookmarks, false);

    expect(result.cleanedBookmarks).toHaveLength(3);
    expect(result.removedCount).toBe(0);
    expect(result.removedBookmarks).toHaveLength(0);
  });

  it('should handle all invalid bookmarks', () => {
    const invalidBookmarks = testBookmarks.filter(b => 
      b.url === '' || 
      b.url === 'invalid url with spaces' || 
      b.url === 'ftp://files.example.com' || 
      b.url === '..invalid'
    );

    const result = cleanInvalidUrls(invalidBookmarks, false);

    expect(result.cleanedBookmarks).toHaveLength(0);
    expect(result.removedCount).toBe(4);
    expect(result.removedBookmarks).toHaveLength(4);
  });
});
