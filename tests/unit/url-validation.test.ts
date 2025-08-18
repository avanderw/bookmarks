import { describe, it, expect } from 'vitest';

function isValidUrl(url: string): boolean {
	if (!url || typeof url !== 'string' || url.trim() === '') {
		return false;
	}

	try {
		const urlObj = new URL(url.trim());
		// Check if it has a valid protocol (http or https)
		return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
	} catch {
		return false;
	}
}

describe('URL Validation', () => {
	describe('Valid URLs', () => {
		const validUrls = [
			'https://example.com',
			'http://example.com',
			'https://sub.example.com/path',
			'https://example.com:8080/path?query=1'
		];

		validUrls.forEach((url) => {
			it(`should validate "${url}" as valid`, () => {
				expect(isValidUrl(url)).toBe(true);
			});
		});
	});

	describe('Invalid URLs', () => {
		const invalidUrls = [
			{ url: '', description: 'empty string' },
			{ url: 'not-a-url', description: 'plain text' },
			{ url: 'ftp://example.com', description: 'FTP protocol' },
			{ url: '//example.com', description: 'protocol-relative URL' },
			{ url: 'javascript:alert("xss")', description: 'JavaScript protocol' },
			{ url: 'file:///path/to/file', description: 'file protocol' },
			{ url: '   ', description: 'whitespace only' }
		];

		invalidUrls.forEach(({ url, description }) => {
			it(`should validate "${url}" (${description}) as invalid`, () => {
				expect(isValidUrl(url)).toBe(false);
			});
		});
	});

	describe('Edge cases', () => {
		it('should handle null and undefined', () => {
			expect(isValidUrl(null as any)).toBe(false);
			expect(isValidUrl(undefined as any)).toBe(false);
		});

		it('should handle non-string inputs', () => {
			expect(isValidUrl(123 as any)).toBe(false);
			expect(isValidUrl({} as any)).toBe(false);
			expect(isValidUrl([] as any)).toBe(false);
		});

		it('should trim whitespace before validation', () => {
			expect(isValidUrl('  https://example.com  ')).toBe(true);
			expect(isValidUrl('\n\thttps://example.com\n\t')).toBe(true);
		});
	});
});
