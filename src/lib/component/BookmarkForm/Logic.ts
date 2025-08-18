import type { Bookmark } from '$lib/bookmarks';
import { getUrlParameter, isValidUrl } from '$lib/url';
import { getCurrentUserAgent } from '$lib/utils/UserAgentUtils';

/**
 * Creates a new empty bookmark object with default values
 */
export function createEmptyBookmark(): Bookmark {
	const userAgentInfo = getCurrentUserAgent();

	return {
		url: getUrlParameter('h') || '',
		title: getUrlParameter('t') || '',
		description: getUrlParameter('d') || '',
		tags: [],
		notes: '',
		added: new Date(),
		clicked: 0,
		last: null,
		userAgent: userAgentInfo?.userAgent,
		browser: userAgentInfo?.browser,
		os: userAgentInfo?.os,
		device: userAgentInfo?.device
	};
}

/**
 * Validates a bookmark before saving
 * @param bookmark The bookmark to validate
 * @param existingBookmarks Optional array of existing bookmarks to check for duplicates
 * @param isEdit Whether this is an edit operation (excludes the current bookmark from duplicate check)
 * @param originalUrl The original URL when editing (to identify which bookmark is being edited)
 * @returns An object containing validation errors
 */
export function validateBookmark(
	bookmark: Bookmark,
	existingBookmarks?: Bookmark[],
	isEdit: boolean = false,
	originalUrl?: string
): {
	urlError: boolean;
	urlErrorMessage: string;
} {
	const errors = {
		urlError: false,
		urlErrorMessage: ''
	};

	// Check if URL is empty
	if (!bookmark.url || bookmark.url.trim() === '') {
		errors.urlError = true;
		errors.urlErrorMessage = 'URL is required';
		return errors;
	}

	// Check if URL is valid
	if (!isValidUrl(bookmark.url)) {
		errors.urlError = true;
		errors.urlErrorMessage = 'Please enter a valid URL (must start with http:// or https://)';
		return errors;
	}

	// Check for duplicate URLs 
	if (existingBookmarks) {
		const duplicate = existingBookmarks.find((b) => {
			// If editing and this is the original bookmark, don't consider it a duplicate
			if (isEdit && originalUrl && b.url === originalUrl) {
				return false;
			}
			return b.url === bookmark.url;
		});

		if (duplicate) {
			errors.urlError = true;
			errors.urlErrorMessage = 'URL already exists in your bookmarks';
		}
	}

	return errors;
}

/**
 * Prepares a bookmark for saving
 * @param bookmark The bookmark to prepare
 * @param tagsString Space-separated tags string
 * @param isEdit Whether this is an edit operation (preserves original user agent info)
 * @returns The prepared bookmark
 */
export function prepareBookmarkForSave(
	bookmark: Bookmark,
	tagsString: string,
	isEdit: boolean = false
): Bookmark {
	// Create a copy of the bookmark to avoid modifying the original
	const prepared = { ...bookmark };

	// If title is empty, use URL as title
	if (!prepared.title || prepared.title.trim() === '') {
		prepared.title = prepared.url;
	}

	// Convert tags string to array
	prepared.tags = tagsString
		.split(' ')
		.map((tag) => tag.trim())
		.filter((tag) => tag !== '');

	// Ensure added date is set
	if (!prepared.added) {
		prepared.added = new Date();
	}

	// For new bookmarks, capture user agent info if not already present
	if (!isEdit && !prepared.userAgent) {
		const userAgentInfo = getCurrentUserAgent();
		if (userAgentInfo) {
			prepared.userAgent = userAgentInfo.userAgent;
			prepared.browser = userAgentInfo.browser;
			prepared.os = userAgentInfo.os;
			prepared.device = userAgentInfo.device;
		}
	}

	return prepared;
}
