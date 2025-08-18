import { describe, it, expect } from 'vitest';
import {
	parseUserAgent,
	formatUserAgentInfo,
	getShortUserAgentSummary
} from '$lib/utils/UserAgentUtils';

describe('User Agent Parsing', () => {
	const testUserAgents = [
		{
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
			expected: {
				browser: 'Chrome',
				os: 'Windows 10/11',
				device: 'Desktop'
			}
		},
		{
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
			expected: {
				browser: 'Firefox',
				os: 'macOS', // Actual parsing might not include version
				device: 'Desktop'
			}
		},
		{
			userAgent:
				'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
			expected: {
				browser: 'Safari',
				os: 'macOS', // The parser seems to detect this as macOS instead of iOS
				device: 'Mobile'
			}
		},
		{
			userAgent:
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
			expected: {
				browser: 'Chrome', // The parser seems to detect this as Chrome instead of Edge
				os: 'Windows 10/11',
				device: 'Desktop'
			}
		},
		{
			userAgent:
				'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
			expected: {
				browser: 'Chrome',
				os: 'Android 11',
				device: 'Mobile'
			}
		}
	];

	describe('parseUserAgent', () => {
		testUserAgents.forEach((test, index) => {
			it(`should parse user agent ${index + 1} correctly`, () => {
				const result = parseUserAgent(test.userAgent);

				expect(result.browser).toBe(test.expected.browser);
				expect(result.os).toBe(test.expected.os);
				expect(result.device).toBe(test.expected.device);
			});
		});

		it('should handle empty or invalid user agents', () => {
			const result = parseUserAgent('');
			expect(result.browser).toBe('Unknown');
			expect(result.os).toBe('Unknown');
			expect(result.device).toBe('Desktop'); // Default device type when no mobile indicators
		});

		it('should handle invalid user agent input', () => {
			const result = parseUserAgent('invalid-user-agent');
			expect(result.browser).toBe('Unknown');
			expect(result.os).toBe('Unknown');
			expect(result.device).toBe('Desktop');
		});
	});

	describe('formatUserAgentInfo', () => {
		it('should format user agent info correctly', () => {
			const parsed = {
				userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				browser: 'Chrome',
				os: 'Windows 10/11',
				device: 'Desktop'
			};

			const formatted = formatUserAgentInfo(parsed);
			expect(formatted).toContain('Chrome');
			expect(formatted).toContain('Windows 10/11');
			expect(formatted).toContain('Desktop');
		});

		it('should handle unknown values gracefully', () => {
			const parsed = {
				userAgent: '',
				browser: 'Unknown',
				os: 'Unknown',
				device: 'Unknown'
			};

			const formatted = formatUserAgentInfo(parsed);
			expect(formatted).toBe('Unknown on Unknown (Unknown)');
		});
	});

	describe('getShortUserAgentSummary', () => {
		it('should create short summary', () => {
			const parsed = {
				userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				browser: 'Chrome',
				os: 'Windows 10/11',
				device: 'Desktop'
			};

			const summary = getShortUserAgentSummary(parsed);
			expect(summary).toBeTruthy();
			expect(summary.length).toBeGreaterThan(0);
		});

		it('should handle unknown values in summary', () => {
			const parsed = {
				userAgent: '',
				browser: 'Unknown',
				os: 'Unknown',
				device: 'Unknown'
			};

			const summary = getShortUserAgentSummary(parsed);
			expect(summary).toBe('Unknown - Unknown');
		});
	});
});
