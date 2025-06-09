import type { Bookmark } from '$lib/bookmarks';
import { getUrlParameter } from '$lib/url';

/**
 * Creates a new empty bookmark object with default values
 */
export function createEmptyBookmark(): Bookmark {
    return {
        url: getUrlParameter('h') || '',
        title: getUrlParameter('t') || '',
        description: getUrlParameter('d') || '',
        tags: [],
        notes: '',
        added: new Date(),
        clicked: 0,
        last: null
    };
}

/**
 * Validates a bookmark before saving
 * @param bookmark The bookmark to validate
 * @param existingBookmarks Optional array of existing bookmarks to check for duplicates
 * @returns An object containing validation errors
 */
export function validateBookmark(bookmark: Bookmark, existingBookmarks?: Bookmark[]): { 
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

    // Check for duplicate URLs in edit mode
    if (existingBookmarks) {
        const duplicate = existingBookmarks.find(
            (b) => b.url === bookmark.url && b !== bookmark
        );
        
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
 * @returns The prepared bookmark
 */
export function prepareBookmarkForSave(bookmark: Bookmark, tagsString: string): Bookmark {
    // Create a copy of the bookmark to avoid modifying the original
    const prepared = { ...bookmark };
    
    // If title is empty, use URL as title
    if (!prepared.title || prepared.title.trim() === '') {
        prepared.title = prepared.url;
    }
    
    // Convert tags string to array
    prepared.tags = tagsString
        .split(' ')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
    
    // Ensure added date is set
    if (!prepared.added) {
        prepared.added = new Date();
    }
    
    return prepared;
}