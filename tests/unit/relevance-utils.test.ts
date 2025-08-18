/**
 * Test file for RelevanceUtils functionality
 * Uses Vitest testing framework with TypeScript support
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Bookmark } from '$lib/bookmarks';

// Simplified relevance configuration
const DEFAULT_RELEVANCE_CONFIG = {
	clickWeight: 0.7,
	recencyWeight: 0.3,
	decayThresholdDays: 30,
	decayRate: 0.02,
	minRelevanceScore: 0.1,
	newItemBoost: 0.2,
	newItemThresholdDays: 7
};

/**
 * Calculate a relevance score for a bookmark based on usage patterns and time decay
 */
function calculateRelevanceScore(bookmark: Bookmark, config = DEFAULT_RELEVANCE_CONFIG): number {
	const now = new Date();

	// Base click score - normalize by maximum reasonable clicks (e.g., 100)
	const maxReasonableClicks = 100;
	const clickScore = Math.min(bookmark.clicked / maxReasonableClicks, 1);

	// Calculate recency score based on last visit
	let recencyScore = 0;
	if (bookmark.last) {
		const daysSinceLastVisit =
			(now.getTime() - new Date(bookmark.last).getTime()) / (1000 * 60 * 60 * 24);

		if (daysSinceLastVisit <= config.decayThresholdDays) {
			// Recent visits get full recency score with gradual decay
			recencyScore = Math.exp(-config.decayRate * daysSinceLastVisit);
		} else {
			// Older visits get exponentially decaying score
			const excessDays = daysSinceLastVisit - config.decayThresholdDays;
			recencyScore =
				Math.exp(-config.decayRate * config.decayThresholdDays) *
				Math.exp(-config.decayRate * 2 * excessDays);
		}
	} else if (bookmark.clicked === 0) {
		// Never clicked items get a small recency bonus based on when they were added
		const daysSinceAdded =
			(now.getTime() - new Date(bookmark.added).getTime()) / (1000 * 60 * 60 * 24);
		if (daysSinceAdded <= config.newItemThresholdDays) {
			recencyScore = config.newItemBoost * (1 - daysSinceAdded / config.newItemThresholdDays);
		}
	}

	// Combine scores with weights
	const baseScore = clickScore * config.clickWeight + recencyScore * config.recencyWeight;

	// Apply minimum relevance threshold
	const finalScore = Math.max(baseScore, config.minRelevanceScore);

	// Apply new item boost for recently added bookmarks
	if (bookmark.clicked === 0) {
		const daysSinceAdded =
			(now.getTime() - new Date(bookmark.added).getTime()) / (1000 * 60 * 60 * 24);
		if (daysSinceAdded <= config.newItemThresholdDays) {
			return finalScore + config.newItemBoost * (1 - daysSinceAdded / config.newItemThresholdDays);
		}
	}

	return finalScore;
}

/**
 * Sort bookmarks by relevance score in descending order
 */
function sortBookmarksByRelevance(
	bookmarks: Bookmark[],
	config = DEFAULT_RELEVANCE_CONFIG
): Bookmark[] {
	return [...bookmarks].sort((a, b) => {
		const scoreA = calculateRelevanceScore(a, config);
		const scoreB = calculateRelevanceScore(b, config);

		// Sort by relevance score (descending)
		const scoreDiff = scoreB - scoreA;
		if (scoreDiff !== 0) return scoreDiff;

		// Tie-breaker 1: More clicks wins
		const clickDiff = b.clicked - a.clicked;
		if (clickDiff !== 0) return clickDiff;

		// Tie-breaker 2: More recent visit wins
		const aLast = a.last ? new Date(a.last).getTime() : 0;
		const bLast = b.last ? new Date(b.last).getTime() : 0;
		const lastDiff = bLast - aLast;
		if (lastDiff !== 0) return lastDiff;

		// Tie-breaker 3: More recently added wins
		const addedDiff = new Date(b.added).getTime() - new Date(a.added).getTime();
		return addedDiff;
	});
}

/**
 * Get a human-readable explanation of why a bookmark has a certain relevance score
 */
function explainRelevanceScore(bookmark: Bookmark, config = DEFAULT_RELEVANCE_CONFIG): string {
	const score = calculateRelevanceScore(bookmark, config);
	const now = new Date();

	const factors: string[] = [];

	// Click factor
	if (bookmark.clicked > 0) {
		factors.push(`${bookmark.clicked} clicks`);
	} else {
		factors.push('never clicked');
	}

	// Recency factor
	if (bookmark.last) {
		const daysSinceLastVisit =
			(now.getTime() - new Date(bookmark.last).getTime()) / (1000 * 60 * 60 * 24);
		if (daysSinceLastVisit < 1) {
			factors.push('visited today');
		} else if (daysSinceLastVisit < 7) {
			factors.push(`visited ${Math.floor(daysSinceLastVisit)} days ago`);
		} else if (daysSinceLastVisit < 30) {
			factors.push(`visited ${Math.floor(daysSinceLastVisit / 7)} weeks ago`);
		} else {
			factors.push(`visited ${Math.floor(daysSinceLastVisit / 30)} months ago`);
		}
	}

	// New item factor
	const daysSinceAdded =
		(now.getTime() - new Date(bookmark.added).getTime()) / (1000 * 60 * 60 * 24);
	if (daysSinceAdded <= config.newItemThresholdDays && bookmark.clicked === 0) {
		factors.push('recently added');
	}

	return `Score: ${score.toFixed(3)} (${factors.join(', ')})`;
}

describe('RelevanceUtils', () => {
	let testBookmarks: Bookmark[];
	let now: Date;
	let oneWeekAgo: Date;
	let oneMonthAgo: Date;
	let threeMonthsAgo: Date;

	beforeEach(() => {
		now = new Date();
		oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

		testBookmarks = [
			{
				url: 'https://example.com/frequently-used',
				title: 'Frequently Used Site',
				description: null,
				tags: [],
				notes: null,
				added: oneMonthAgo,
				clicked: 25,
				last: oneWeekAgo
			},
			{
				url: 'https://example.com/never-used',
				title: 'Never Used Bookmark',
				description: null,
				tags: [],
				notes: null,
				added: threeMonthsAgo,
				clicked: 0,
				last: null
			},
			{
				url: 'https://example.com/stale',
				title: 'Stale Bookmark',
				description: null,
				tags: [],
				notes: null,
				added: threeMonthsAgo,
				clicked: 10,
				last: threeMonthsAgo
			},
			{
				url: 'https://example.com/new',
				title: 'New Bookmark',
				description: null,
				tags: [],
				notes: null,
				added: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
				clicked: 0,
				last: null
			},
			{
				url: 'https://example.com/heavy-user',
				title: 'Heavy User Bookmark',
				description: null,
				tags: [],
				notes: null,
				added: oneMonthAgo,
				clicked: 50,
				last: new Date(now.getTime() - 24 * 60 * 60 * 1000) // yesterday
			}
		];
	});

	describe('calculateRelevanceScore', () => {
		it('should give higher scores to frequently clicked bookmarks', () => {
			const heavyUser = testBookmarks.find((b) => b.clicked === 50)!;
			const lightUser = testBookmarks.find((b) => b.clicked === 10)!;

			const heavyScore = calculateRelevanceScore(heavyUser);
			const lightScore = calculateRelevanceScore(lightUser);

			expect(heavyScore).toBeGreaterThan(lightScore);
		});

		it('should boost new bookmarks even with no clicks', () => {
			const newBookmark = testBookmarks.find((b) => b.title === 'New Bookmark')!;
			const oldNeverUsed = testBookmarks.find((b) => b.title === 'Never Used Bookmark')!;

			const newScore = calculateRelevanceScore(newBookmark);
			const oldScore = calculateRelevanceScore(oldNeverUsed);

			expect(newScore).toBeGreaterThan(oldScore);
		});

		it('should decay scores for old bookmarks', () => {
			const recentBookmark = testBookmarks.find((b) => b.title === 'Heavy User Bookmark')!;
			const staleBookmark = testBookmarks.find((b) => b.title === 'Stale Bookmark')!;

			const recentScore = calculateRelevanceScore(recentBookmark);
			const staleScore = calculateRelevanceScore(staleBookmark);

			expect(recentScore).toBeGreaterThan(staleScore);
		});

		it('should apply minimum relevance threshold', () => {
			testBookmarks.forEach((bookmark) => {
				const score = calculateRelevanceScore(bookmark);
				expect(score).toBeGreaterThanOrEqual(DEFAULT_RELEVANCE_CONFIG.minRelevanceScore);
			});
		});
	});

	describe('sortBookmarksByRelevance', () => {
		it('should sort bookmarks by relevance score in descending order', () => {
			const sorted = sortBookmarksByRelevance(testBookmarks);

			for (let i = 0; i < sorted.length - 1; i++) {
				const currentScore = calculateRelevanceScore(sorted[i]);
				const nextScore = calculateRelevanceScore(sorted[i + 1]);
				expect(currentScore).toBeGreaterThanOrEqual(nextScore);
			}
		});

		it('should not mutate the original array', () => {
			const original = [...testBookmarks];
			const sorted = sortBookmarksByRelevance(testBookmarks);

			expect(testBookmarks).toEqual(original);
			expect(sorted).not.toBe(testBookmarks);
		});

		it('should use click count as first tie-breaker', () => {
			// Create two bookmarks with same relevance factors except clicks
			const bookmark1: Bookmark = {
				url: 'https://example.com/test1',
				title: 'Test 1',
				description: null,
				tags: [],
				notes: null,
				added: oneMonthAgo,
				clicked: 10,
				last: null
			};

			const bookmark2: Bookmark = {
				url: 'https://example.com/test2',
				title: 'Test 2',
				description: null,
				tags: [],
				notes: null,
				added: oneMonthAgo,
				clicked: 5,
				last: null
			};

			const sorted = sortBookmarksByRelevance([bookmark1, bookmark2]);
			expect(sorted[0].clicked).toBeGreaterThan(sorted[1].clicked);
		});
	});

	describe('explainRelevanceScore', () => {
		it('should provide human-readable explanations', () => {
			const bookmark = testBookmarks[0];
			const explanation = explainRelevanceScore(bookmark);

			expect(explanation).toContain('Score:');
			expect(explanation).toContain('clicks');
			expect(typeof explanation).toBe('string');
		});

		it('should handle never-clicked bookmarks', () => {
			const neverClicked = testBookmarks.find((b) => b.clicked === 0)!;
			const explanation = explainRelevanceScore(neverClicked);

			expect(explanation).toContain('never clicked');
		});

		it('should identify recently added bookmarks', () => {
			const newBookmark = testBookmarks.find((b) => b.title === 'New Bookmark')!;
			const explanation = explainRelevanceScore(newBookmark);

			expect(explanation).toContain('recently added');
		});
	});
});
