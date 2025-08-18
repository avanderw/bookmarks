import { PerformanceMonitor } from '$lib/utils/PerformanceMonitor';

export interface FilterOptions {
	and: string[];
	or: string[];
	not: string[];
	special: SpecialFilter[];
	notSpecial: SpecialFilter[]; // New: for negated special filters
}

export interface SpecialFilter {
	type: 'device' | 'os' | 'browser' | 'added' | 'clicked' | 'tag';
	value?: string;
	operator?: '>' | '<' | '=' | '>=' | '<=';
	duration?: number; // in days
}

export interface FilterResult<T = any> {
	data: T[];
	options: FilterOptions;
	query: string;
	scores: Map<T, number>;
}

/**
 * Creates a searchable text string for a bookmark item (cached for performance)
 * @private Internal helper function
 */
function createSearchableText(item: any): string {
	// Check if we already have cached searchable text
	if (item._searchText) {
		return item._searchText;
	}

	// For bookmark objects, create optimized searchable text
	if (item.url !== undefined) {
		const bookmark = item;
		const parts = [
			bookmark.url || '',
			bookmark.title || '',
			bookmark.description || '',
			bookmark.notes || ''
		];

		// Add tags in a searchable format
		if (bookmark.tags && Array.isArray(bookmark.tags)) {
			parts.push(bookmark.tags.join(' '));
			parts.push('#' + bookmark.tags.join(' #'));
		}

		// Cache the result for future searches
		item._searchText = parts.join(' ').toLowerCase();
		return item._searchText;
	}

	// Fallback for non-bookmark items
	return JSON.stringify(item).toLowerCase();
}

/**
 * Applies a special filter to an item
 *
 * @private Internal helper function
 */
function applySpecialFilter<T>(item: T, filter: SpecialFilter): boolean {
	// Type assertion to access bookmark properties
	const bookmark = item as any;

	switch (filter.type) {
		case 'device':
			if (!bookmark.device || !filter.value) return false;
			return bookmark.device.toLowerCase().includes(filter.value.toLowerCase());

		case 'os':
			if (!bookmark.os || !filter.value) return false;
			return bookmark.os.toLowerCase().includes(filter.value.toLowerCase());

		case 'browser':
			if (!bookmark.browser || !filter.value) return false;
			return bookmark.browser.toLowerCase().includes(filter.value.toLowerCase());

		case 'tag':
			if (!bookmark.tags || bookmark.tags.length === 0 || !filter.value) return false;
			return bookmark.tags.some((tag: string) =>
				tag.toLowerCase().includes(filter.value!.toLowerCase())
			);

		case 'added':
			if (!filter.duration || !filter.operator || !bookmark.added) return true;
			const addedTime = new Date(bookmark.added);
			const daysFromAdded = (Date.now() - addedTime.getTime()) / (1000 * 60 * 60 * 24);
			return compareDate(daysFromAdded, filter.operator, filter.duration);

		case 'clicked':
			if (filter.operator === '=' && filter.duration === 0) {
				return bookmark.clicked === 0; // clicked:=0 for never-clicked
			}
			if (!filter.duration || !filter.operator) return true;
			if (bookmark.clicked === 0) {
				// For never-clicked bookmarks, only match if we're explicitly looking for 0
				return filter.operator === '=' && filter.duration === 0;
			}
			const clickedTime = bookmark.last ? new Date(bookmark.last) : new Date(bookmark.added);
			const daysFromClicked = (Date.now() - clickedTime.getTime()) / (1000 * 60 * 60 * 24);
			return compareDate(daysFromClicked, filter.operator, filter.duration);

		default:
			return true;
	}
}

/**
 * Compares dates based on operator
 *
 * @private Internal helper function
 */
function compareDate(actualDays: number, operator: string, targetDays: number): boolean {
	switch (operator) {
		case '>':
			return actualDays > targetDays;
		case '<':
			return actualDays < targetDays;
		case '>=':
			return actualDays >= targetDays;
		case '<=':
			return actualDays <= targetDays;
		case '=':
			return Math.abs(actualDays - targetDays) < 1; // Within a day
		default:
			return true;
	}
}

/**
 * Parses special filter keywords and adds them to filter options
 * Supports both tag: and # syntax for tags
 *
 * @private Internal helper function
 */
function parseSpecialFilter(term: string, options: FilterOptions): boolean {
	const lower = term.toLowerCase();

	// Device filter: device:mobile, device:desktop, device:tablet
	const deviceMatch = lower.match(/^device:(.+)$/);
	if (deviceMatch) {
		options.special.push({ type: 'device', value: deviceMatch[1] });
		return true;
	}

	// OS filter: os:windows, os:macos, etc.
	const osMatch = lower.match(/^os:(.+)$/);
	if (osMatch) {
		options.special.push({ type: 'os', value: osMatch[1] });
		return true;
	}

	// Browser filter: browser:chrome, browser:firefox, etc.
	const browserMatch = lower.match(/^browser:(.+)$/);
	if (browserMatch) {
		options.special.push({ type: 'browser', value: browserMatch[1] });
		return true;
	}

	// Tag filter: tag:javascript, tag:react, #javascript, #react, etc.
	const tagMatch = lower.match(/^(?:tag:(.+)|#(.+))$/);
	if (tagMatch) {
		const tagValue = tagMatch[1] || tagMatch[2];
		options.special.push({ type: 'tag', value: tagValue });
		return true;
	}

	// Date filters: added:>30d, added:<7d, clicked:>90d, clicked:=0
	const dateMatch = lower.match(/^(added|clicked):([<>=]+)(\d+)d?$/);
	if (dateMatch) {
		const [, type, operator, days] = dateMatch;
		options.special.push({
			type: type as 'added' | 'clicked',
			operator: operator as '>' | '<' | '=' | '>=' | '<=',
			duration: parseInt(days)
		});
		return true;
	}

	return false;
}

/**
 * Parses a search query string into filter options
 *
 * @private Internal helper function
 */
function parseFilterQuery(query: string): FilterOptions {
	if (!query || query.trim() === '') {
		return { and: [], or: [], not: [], special: [], notSpecial: [] };
	}

	const options: FilterOptions = {
		and: [],
		or: [],
		not: [],
		special: [],
		notSpecial: []
	};

	// Split by spaces, but preserve quoted phrases
	const terms: string[] = [];
	let currentTerm = '';
	let inQuotes = false;

	for (let i = 0; i < query.length; i++) {
		const char = query[i];
		if (char === '"') {
			inQuotes = !inQuotes;
			currentTerm += char;
		} else if (char === ' ' && !inQuotes) {
			if (currentTerm.trim()) {
				terms.push(currentTerm.trim());
			}
			currentTerm = '';
		} else {
			currentTerm += char;
		}
	}

	if (currentTerm.trim()) {
		terms.push(currentTerm.trim());
	}

	// Process terms based on prefixes
	terms.forEach((term) => {
		// Remove quotes for processing but preserve the term
		const cleanTerm = term.replace(/^["']|["']$/g, '');

		// Handle NOT prefix for special filters
		if (term.startsWith('-')) {
			const negatedTerm = cleanTerm.substring(1);

			// Create a temporary FilterOptions to see if this is a special filter
			const tempOptions: FilterOptions = { and: [], or: [], not: [], special: [], notSpecial: [] };
			if (parseSpecialFilter(negatedTerm, tempOptions)) {
				// It's a special filter, add it to notSpecial instead
				options.notSpecial.push(...tempOptions.special);
				return;
			} else {
				// Regular text filter
				options.not.push(negatedTerm);
				return;
			}
		}

		// Check for special filter keywords first
		if (parseSpecialFilter(cleanTerm, options)) {
			return; // Special filter was parsed, continue to next term
		}

		if (term.startsWith('+')) {
			options.and.push(cleanTerm.substring(1));
		} else if (term.startsWith('|')) {
			options.or.push(cleanTerm.substring(1));
		} else {
			// Words without prefixes are OR terms
			options.or.push(cleanTerm);
		}
	});

	return options;
}

/**
 * Filters data based on a search query string with relevance ranking
 *
 * Syntax:
 * - Words without special characters are treated as OR terms (default behavior)
 * - Words prefixed with '+' are explicitly AND terms (e.g., '+term')
 * - Words prefixed with '|' are explicitly OR terms (e.g., '|term')
 * - Words prefixed with '-' are NOT terms/exclusions (e.g., '-term')
 * - Quoted phrases like "exact match" are treated as a single term
 *
 * Special Filters (Raw Data):
 * Click data:
 * - 'clicked:=0' → bookmarks never clicked
 * - 'clicked:>90' → bookmarks not clicked in 90+ days
 * - 'clicked:<7' → bookmarks clicked in last 7 days
 *
 * Device/System context:
 * - 'device:mobile', 'device:desktop', 'device:tablet'
 * - 'os:windows', 'os:macos', 'os:android', 'os:ios'
 * - 'browser:chrome', 'browser:firefox', 'browser:safari'
 *
 * Tag filtering (supports both syntaxes):
 * - 'tag:javascript', 'tag:react', 'tag:tutorial'
 * - '#javascript', '#react', '#tutorial' (new hash syntax)
 * - '-tag:deprecated', '-#deprecated' → exclude tags
 * - 'tag:react -tag:archived' → items with react tag but not archived tag
 *
 * Date-based cleanup:
 * - 'added:>365' → bookmarks older than 1 year
 * - 'added:<7' → bookmarks added in last week
 *
 * Relevance Sorting:
 * When text-based filtering is used, results are automatically sorted by relevance:
 * - AND terms (+) get higher weight (score: 2 per match)
 * - OR terms get base weight (score: 1 per match)
 * - Higher scores appear first in results
 * - Items with no text matches maintain original order
 *
 * Actionable Search Examples:
 * Cleanup candidates:
 * - 'clicked:=0 added:>90' → old bookmarks never used
 * - 'clicked:=0 device:mobile' → mobile bookmarks to review
 * - '-tag:important clicked:>365' → old unimportant bookmarks
 *
 * Current device relevance:
 * - 'device:mobile +tutorial' → mobile-saved tutorials
 * - 'browser:chrome os:windows' → bookmarks from current setup
 *
 * Tag management:
 * - 'tag:javascript +tutorial' → JS learning resources
 * - '#react -#archived' → React resources excluding archived
 * - '-tag:archived' → exclude archived bookmarks
 *
 * @param data The array of objects to filter
 * @param query The search query string
 * @returns FilterResult containing filtered data, options, and relevance scores
 */
export function applyFilter<T>(data: T[], query: string): FilterResult<T> {
	PerformanceMonitor.start('applyFilter');

	// Early exit for empty query
	if (!query || query.trim() === '') {
		PerformanceMonitor.end('applyFilter');
		return {
			data,
			options: { and: [], or: [], not: [], special: [], notSpecial: [] },
			query,
			scores: new Map<T, number>()
		};
	}

	// Early exit for empty data
	if (!data || !data.length) {
		PerformanceMonitor.end('applyFilter');
		return {
			data: [],
			options: { and: [], or: [], not: [], special: [], notSpecial: [] },
			query,
			scores: new Map<T, number>()
		};
	}

	PerformanceMonitor.start('parseQuery');
	// Parse the query into filter options
	const options = parseFilterQuery(query);
	PerformanceMonitor.end('parseQuery');

	// Early exit if no valid filters were parsed
	if (
		!options.and.length &&
		!options.or.length &&
		!options.not.length &&
		!options.special.length &&
		!options.notSpecial.length
	) {
		PerformanceMonitor.end('applyFilter');
		return {
			data,
			options,
			query,
			scores: new Map<T, number>()
		};
	}

	PerformanceMonitor.start('filterData');
	// Store scores for ranking
	const scores = new Map<T, number>();

	// Filter the data
	const filteredData = data.filter((item) => {
		// Apply positive special filters first (these are usually faster)
		for (const specialFilter of options.special) {
			if (!applySpecialFilter(item, specialFilter)) {
				return false;
			}
		}

		// Apply negative special filters
		for (const specialFilter of options.notSpecial) {
			if (applySpecialFilter(item, specialFilter)) {
				return false; // If the negated filter matches, exclude this item
			}
		}

		// Only create searchable text if we have text-based filters
		let searchText = '';
		let score = 0;

		if (options.and.length > 0 || options.or.length > 0 || options.not.length > 0) {
			searchText = createSearchableText(item);

			// Handle NOT conditions first (exclusions) - fastest to eliminate items
			for (const term of options.not) {
				if (searchText.includes(term.toLowerCase())) {
					return false; // Exclude this item
				}
			}

			// Check AND terms - all must match
			for (const term of options.and) {
				if (!searchText.includes(term.toLowerCase())) {
					return false; // Require all AND terms
				}
				score += 2; // AND terms get higher weight
			}

			// Check OR terms - at least one must match if we have no AND terms
			let orMatches = 0;
			for (const term of options.or) {
				if (searchText.includes(term.toLowerCase())) {
					orMatches++;
					score += 1; // OR terms get base weight
				}
			}

			// If we have OR terms but no AND terms, require at least one OR match
			if (options.or.length > 0 && options.and.length === 0 && orMatches === 0) {
				return false;
			}
		}

		// Store the score for this item
		scores.set(item, score);

		return true;
	});
	PerformanceMonitor.end('filterData');

	// Only sort if we have scores (i.e., text-based filtering occurred)
	if (scores.size > 0) {
		PerformanceMonitor.start('sortResults');
		// Sort results by score (highest first)
		filteredData.sort((a, b) => {
			const scoreA = scores.get(a) || 0;
			const scoreB = scores.get(b) || 0;
			return scoreB - scoreA;
		});
		PerformanceMonitor.end('sortResults');
	}

	PerformanceMonitor.end('applyFilter');
	return {
		data: filteredData,
		options,
		query,
		scores
	};
}

/**
 * Helper function to calculate what percentage of search terms matched
 * Used for more advanced UI features like showing match strength
 */
export function calculateMatchPercentage<T>(item: T, result: FilterResult<T>): number {
	if (!result.scores.has(item)) return 0;

	const options = result.options;
	const totalTerms = options.and.length + options.or.length;

	if (totalTerms === 0) return 100;

	// Get score and calculate percentage based on maximum possible score
	const score = result.scores.get(item) || 0;
	const maxPossibleScore = options.and.length * 2 + options.or.length;

	return Math.round((score / maxPossibleScore) * 100);
}
