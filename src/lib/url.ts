import { browser } from "$app/environment";

export function getUrlParameter(name: string) {
    if (!browser) return null;
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

/**
 * Validates if a URL string is a valid URL
 * @param url The URL string to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return false;
    }

    const trimmedUrl = url.trim();
    
    // Check for spaces in the URL (invalid in URLs)
    if (trimmedUrl.includes(' ')) {
        return false;
    }
    
    // Check for obviously malformed URLs
    if (trimmedUrl.includes('..') || trimmedUrl.startsWith('.') || trimmedUrl.endsWith('.')) {
        return false;
    }
    
    // Check if it looks like a URL without protocol - try to add https://
    let urlToTest = trimmedUrl;
    if (!trimmedUrl.includes('://')) {
        // If it looks like a domain (contains a dot), try adding https://
        if (trimmedUrl.includes('.') && !trimmedUrl.startsWith('/')) {
            urlToTest = `https://${trimmedUrl}`;
        } else {
            return false;
        }
    }

    try {
        const urlObj = new URL(urlToTest);
        // Check if it has a valid protocol (http or https)
        const isValidProtocol = urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        
        // Additional validation: check if hostname exists and is not empty
        const hasValidHostname = Boolean(urlObj.hostname && urlObj.hostname.length > 0);
        
        return isValidProtocol && hasValidHostname;
    } catch {
        return false;
    }
}