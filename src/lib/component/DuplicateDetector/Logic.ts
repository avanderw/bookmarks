// src/lib/component/DuplicateDetector/Logic.ts
import type { Bookmark } from '$lib/bookmarks';

export interface DuplicateGroup {
	id: string;
	type: 'exact_url' | 'similar_url' | 'similar_title' | 'same_domain';
	reason: string;
	bookmarks: Bookmark[];
	confidence: number; // 0-1 score
}

export interface DuplicateAnalysis {
	totalBookmarks: number;
	duplicateGroups: DuplicateGroup[];
	duplicateCount: number;
	uniqueCount: number;
}

/**
 * Normalize URL for comparison (remove protocol, www, trailing slashes, etc.)
 */
function normalizeUrl(url: string): string {
	try {
		const urlObj = new URL(url);
		const normalized = urlObj.hostname.replace(/^www\./, '') + urlObj.pathname + urlObj.search;
		return normalized.replace(/\/$/, ''); // Remove trailing slash
	} catch {
		return url
			.toLowerCase()
			.replace(/^https?:\/\/(www\.)?/, '')
			.replace(/\/$/, '');
	}
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string | null): string {
	if (!title) return '';
	return title
		.toLowerCase()
		.replace(/[^\w\s]/g, ' ') // Replace non-alphanumeric with spaces
		.replace(/\s+/g, ' ') // Collapse multiple spaces
		.trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
	const matrix = Array(str2.length + 1)
		.fill(null)
		.map(() => Array(str1.length + 1).fill(null));

	for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
	for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

	for (let j = 1; j <= str2.length; j++) {
		for (let i = 1; i <= str1.length; i++) {
			const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
			matrix[j][i] = Math.min(
				matrix[j][i - 1] + 1, // deletion
				matrix[j - 1][i] + 1, // insertion
				matrix[j - 1][i - 1] + indicator // substitution
			);
		}
	}

	return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two titles (0-1)
 */
function titleSimilarity(title1: string | null, title2: string | null): number {
	const norm1 = normalizeTitle(title1);
	const norm2 = normalizeTitle(title2);

	if (!norm1 || !norm2) return 0;
	if (norm1 === norm2) return 1;

	const maxLength = Math.max(norm1.length, norm2.length);
	if (maxLength === 0) return 0;

	const distance = levenshteinDistance(norm1, norm2);
	return 1 - distance / maxLength;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url.replace(/^https?:\/\/(www\.)?([^\/]+).*$/, '$2');
	}
}

/**
 * Find exact URL duplicates
 */
function findExactUrlDuplicates(bookmarks: Bookmark[]): DuplicateGroup[] {
	const urlMap = new Map<string, Bookmark[]>();

	bookmarks.forEach((bookmark) => {
		const normalizedUrl = normalizeUrl(bookmark.url);
		if (!urlMap.has(normalizedUrl)) {
			urlMap.set(normalizedUrl, []);
		}
		urlMap.get(normalizedUrl)!.push(bookmark);
	});

	return Array.from(urlMap.entries())
		.filter(([_, bookmarks]) => bookmarks.length > 1)
		.map(([url, bookmarks], index) => ({
			id: `exact_url_${index}`,
			type: 'exact_url' as const,
			reason: `Same URL (${url})`,
			bookmarks: bookmarks.sort(
				(a, b) => new Date(a.added).getTime() - new Date(b.added).getTime()
			),
			confidence: 1.0
		}));
}

/**
 * Find similar URLs (same domain, slight variations)
 */
function findSimilarUrls(bookmarks: Bookmark[]): DuplicateGroup[] {
	const domainMap = new Map<string, Bookmark[]>();

	// Group by domain first
	bookmarks.forEach((bookmark) => {
		const domain = extractDomain(bookmark.url);
		if (!domainMap.has(domain)) {
			domainMap.set(domain, []);
		}
		domainMap.get(domain)!.push(bookmark);
	});

	const groups: DuplicateGroup[] = [];

	// Within each domain, find similar URLs
	domainMap.forEach((domainBookmarks, domain) => {
		if (domainBookmarks.length < 2) return;

		const checked = new Set<string>();

		domainBookmarks.forEach((bookmark1, i) => {
			if (checked.has(bookmark1.url)) return;

			const similarBookmarks = [bookmark1];
			const norm1 = normalizeUrl(bookmark1.url);

			domainBookmarks.forEach((bookmark2, j) => {
				if (i >= j || checked.has(bookmark2.url)) return;

				const norm2 = normalizeUrl(bookmark2.url);

				// Check if URLs are similar but not identical
				if (norm1 !== norm2) {
					const similarity = titleSimilarity(norm1, norm2);
					if (similarity > 0.8) {
						// 80% similarity threshold
						similarBookmarks.push(bookmark2);
						checked.add(bookmark2.url);
					}
				}
			});

			if (similarBookmarks.length > 1) {
				checked.add(bookmark1.url);
				groups.push({
					id: `similar_url_${groups.length}`,
					type: 'similar_url',
					reason: `Similar URLs on ${domain}`,
					bookmarks: similarBookmarks.sort(
						(a, b) => new Date(a.added).getTime() - new Date(b.added).getTime()
					),
					confidence: 0.8
				});
			}
		});
	});

	return groups;
}

/**
 * Find bookmarks with similar titles
 */
function findSimilarTitles(bookmarks: Bookmark[]): DuplicateGroup[] {
	const groups: DuplicateGroup[] = [];
	const checked = new Set<string>();

	bookmarks.forEach((bookmark1, i) => {
		if (checked.has(bookmark1.url) || !bookmark1.title) return;

		const similarBookmarks = [bookmark1];
		const norm1 = normalizeTitle(bookmark1.title);

		bookmarks.forEach((bookmark2, j) => {
			if (i >= j || checked.has(bookmark2.url) || !bookmark2.title) return;

			const similarity = titleSimilarity(bookmark1.title, bookmark2.title);
			if (similarity > 0.85) {
				// 85% similarity threshold for titles
				similarBookmarks.push(bookmark2);
				checked.add(bookmark2.url);
			}
		});

		if (similarBookmarks.length > 1) {
			checked.add(bookmark1.url);
			groups.push({
				id: `similar_title_${groups.length}`,
				type: 'similar_title',
				reason: `Similar titles: "${bookmark1.title}"`,
				bookmarks: similarBookmarks.sort(
					(a, b) => new Date(a.added).getTime() - new Date(b.added).getTime()
				),
				confidence: 0.75
			});
		}
	});

	return groups;
}

/**
 * Find bookmarks from the same domain (potential duplicates)
 */
function findSameDomainBookmarks(bookmarks: Bookmark[], minCount: number = 3): DuplicateGroup[] {
	const domainMap = new Map<string, Bookmark[]>();

	bookmarks.forEach((bookmark) => {
		const domain = extractDomain(bookmark.url);
		if (!domainMap.has(domain)) {
			domainMap.set(domain, []);
		}
		domainMap.get(domain)!.push(bookmark);
	});

	return Array.from(domainMap.entries())
		.filter(([_, bookmarks]) => bookmarks.length >= minCount)
		.map(([domain, bookmarks], index) => ({
			id: `same_domain_${index}`,
			type: 'same_domain' as const,
			reason: `Multiple bookmarks from ${domain} (${bookmarks.length} total)`,
			bookmarks: bookmarks.sort(
				(a, b) => new Date(a.added).getTime() - new Date(b.added).getTime()
			),
			confidence: 0.6
		}));
}

/**
 * Analyze bookmarks for duplicates and similarities
 */
export function analyzeDuplicates(bookmarks: Bookmark[]): DuplicateAnalysis {
	const groups: DuplicateGroup[] = [];

	// Find different types of duplicates
	groups.push(...findExactUrlDuplicates(bookmarks));
	groups.push(...findSimilarUrls(bookmarks));
	groups.push(...findSimilarTitles(bookmarks));
	groups.push(...findSameDomainBookmarks(bookmarks));

	// Sort by confidence (highest first)
	groups.sort((a, b) => b.confidence - a.confidence);

	// Calculate statistics
	const duplicateBookmarks = new Set<string>();
	groups.forEach((group) => {
		group.bookmarks.forEach((bookmark) => {
			duplicateBookmarks.add(bookmark.url);
		});
	});

	return {
		totalBookmarks: bookmarks.length,
		duplicateGroups: groups,
		duplicateCount: duplicateBookmarks.size,
		uniqueCount: bookmarks.length - duplicateBookmarks.size
	};
}

/**
 * Get suggested action for a duplicate group
 */
export function getSuggestedAction(group: DuplicateGroup): string {
	switch (group.type) {
		case 'exact_url':
			return 'Keep the most recent bookmark and remove others';
		case 'similar_url':
			return 'Review URLs and merge if they point to the same content';
		case 'similar_title':
			return 'Check if these are the same resource with different URLs';
		case 'same_domain':
			return 'Review for potential organization into categories';
		default:
			return 'Review and decide which bookmarks to keep';
	}
}

/**
 * Get confidence color for UI display
 */
export function getConfidenceColor(confidence: number): string {
	if (confidence >= 0.9) return 'var(--pico-color-red-500)';
	if (confidence >= 0.75) return 'var(--pico-color-amber-500)';
	return 'var(--pico-color-blue-500)';
}

/**
 * Get type label for display
 */
export function getTypeLabel(type: DuplicateGroup['type']): string {
	switch (type) {
		case 'exact_url':
			return 'Exact Duplicate';
		case 'similar_url':
			return 'Similar URL';
		case 'similar_title':
			return 'Similar Title';
		case 'same_domain':
			return 'Same Domain';
		default:
			return 'Unknown';
	}
}
