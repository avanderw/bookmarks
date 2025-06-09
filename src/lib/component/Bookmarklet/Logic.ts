// src/lib/component/Bookmarklet/Logic.ts
import { config } from '$lib/config';

/**
 * Creates a bookmarklet function that doesn't rely on any external dependencies
 * @returns A stringified version of the bookmarklet code ready to be used in javascript: URL
 */
export function createBookmarkletCode(): string {
	// Create a self-contained bookmarklet function
	const bookmarklet = () => {
		try {
			// Use the configuration but have it embedded directly in the function
			// This way the bookmarklet is completely self-contained
			const baseUrl = `${config.protocol}://${config.primaryHost}${config.basePath}`;
			
			// Build the URL with page information parameters
			let url = baseUrl;
			url += '?h=' + encodeURIComponent(location.href);
			url += '&t=' + encodeURIComponent(document.title);
			
			// Try to extract the description from meta tags
			const meta = document.querySelector('meta[name="description"]');
			if (meta) {
				url += '&d=' + encodeURIComponent(meta.getAttribute('content') || '');
			}
			
			window.open(url);
		} catch (error) {
			// Provide graceful error handling
			console.error("Bookmarklet error:", error);
			alert("There was an issue with the bookmarklet. Please try again or report this problem.");
		}
	};
	
	// Create a stringified version of the function with embedded configuration
	const bookmarkletString = bookmarklet.toString()
		// Replace config references with actual values
		.replace('config.protocol', `"${config.protocol}"`)
		.replace('config.primaryHost', `"${config.primaryHost}"`)
		.replace('config.basePath', `"${config.basePath}"`);
	
	// Generate the final bookmarklet code
	return `(${bookmarkletString})()`;
}