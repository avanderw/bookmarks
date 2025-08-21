/**
 * Optimized localStorage wrapper with size monitoring and warnings
 */
import { browser } from '$app/environment';
import type { BookmarkStore, Bookmark } from './bookmarks';
import { isValidUrl } from './url';
import { getCurrentUserAgent } from './utils/UserAgentUtils';

// Storage configuration
const STORAGE_KEY = 'bookmarks/cache-store';
const WARNING_THRESHOLD = 4 * 1024 * 1024; // 4MB warning threshold (localStorage is typically 5-10MB)
const CRITICAL_THRESHOLD = 8 * 1024 * 1024; // 8MB critical threshold

/**
 * Calculate the approximate size of an object when JSON stringified
 */
function calculateStorageSize(data: any): number {
	try {
		return new Blob([JSON.stringify(data)]).size;
	} catch {
		// Fallback method
		return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
	}
}

/**
 * Get the total localStorage usage across all keys
 */
function getTotalLocalStorageSize(): number {
	if (!browser) return 0;

	let total = 0;
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key) {
			const value = localStorage.getItem(key);
			if (value) {
				total += new Blob([key + value]).size;
			}
		}
	}
	return total;
}

/**
 * Check storage size and show warnings if needed
 */
function checkStorageSize(dataSize: number, totalSize: number): void {
	if (!browser) return;

	const bookmarkCount =
		JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"bookmarks":[]}').bookmarks?.length || 0;

	if (totalSize > CRITICAL_THRESHOLD) {
		console.warn('🚨 localStorage Critical Warning:', {
			totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
			bookmarkDataSize: `${(dataSize / 1024 / 1024).toFixed(2)}MB`,
			bookmarkCount,
			recommendation: 'Consider migrating to IndexedDB'
		});

		// Show user warning
		if (
			window.confirm(
				`localStorage is critically full (${(totalSize / 1024 / 1024).toFixed(1)}MB used)!\n\n` +
					`Your ${bookmarkCount} bookmarks are using ${(dataSize / 1024 / 1024).toFixed(
						1
					)}MB.\n\n` +
					`Would you like to:\n` +
					`• Export your bookmarks as backup\n` +
					`• Consider cleaning up old data\n\n` +
					`Click OK to export bookmarks now, Cancel to continue.`
			)
		) {
			// Trigger export
			const event = new CustomEvent('storage-full-export', {
				detail: { dataSize, totalSize, bookmarkCount }
			});
			window.dispatchEvent(event);
		}
	} else if (totalSize > WARNING_THRESHOLD) {
		console.warn('⚠️ localStorage Warning:', {
			totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
			bookmarkDataSize: `${(dataSize / 1024 / 1024).toFixed(2)}MB`,
			bookmarkCount,
			thresholdReached: `${((totalSize / WARNING_THRESHOLD) * 100).toFixed(1)}%`
		});
	}
}

/**
 * Save data to localStorage with size monitoring
 */
export function saveToLocalStorage(data: BookmarkStore): boolean {
	if (!browser) return false;

	try {
		const dataSize = calculateStorageSize(data);
		const totalSize = getTotalLocalStorageSize();

		// Check size before saving
		checkStorageSize(dataSize, totalSize);

		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

		return true;
	} catch (error) {
		console.error('❌ Failed to save to localStorage:', error);

		if (error instanceof DOMException && error.name === 'QuotaExceededError') {
			alert(
				'Storage quota exceeded! Your bookmarks could not be saved.\n\n' +
					'Please export your bookmarks and consider:\n' +
					'• Removing old bookmarks\n' +
					'• Clearing browser data\n' +
					'• Migrating to a different storage solution'
			);
		}

		return false;
	}
}

/**
 * Load data from localStorage with migration support
 */
export function loadFromLocalStorage(): BookmarkStore {
	const version = '2025-08-13'; // Updated for storage optimization

	if (!browser) {
		return { version, bookmarks: [] };
	}

	try {
		let stored = localStorage.getItem(STORAGE_KEY);

		// Migration: Check for data in the old 'bookmarks' key
		if (!stored) {
			const oldData = localStorage.getItem('bookmarks');
			if (oldData) {
				console.log('🔄 Migrating from old storage key "bookmarks" to "bookmarks/cache-store"...');
				stored = oldData;
				
				// Save to new location and remove from old location
				localStorage.setItem(STORAGE_KEY, oldData);
				localStorage.removeItem('bookmarks');
				console.log('✅ Migration completed: moved data from "bookmarks" to "bookmarks/cache-store"');
			}
		}

		if (!stored) {
			console.log('📁 No bookmark data found in localStorage');
			return { version, bookmarks: [] };
		}

		const data = JSON.parse(stored);

		// Handle legacy array format
		if (Array.isArray(data)) {
			console.log('🔄 Migrating legacy bookmark format...');
			const migratedData: BookmarkStore = {
				version,
				bookmarks: data.map((bookmark) => ({
					...bookmark,
					url: bookmark.href || bookmark.url,
					userAgent: undefined,
					browser: undefined,
					os: undefined,
					device: undefined
				}))
			};

			// Save migrated data
			saveToLocalStorage(migratedData);
			return migratedData;
		}

		// Handle version updates
		if (data.version !== version) {
			console.log(`🔄 Updating bookmark store from ${data.version} to ${version}`);
			data.version = version;
			saveToLocalStorage(data);
		}

		console.log('📖 Loaded bookmarks from localStorage:', {
			version: data.version,
			bookmarkCount: data.bookmarks?.length || 0
		});

		return data;
	} catch (error) {
		console.error('Failed to load from localStorage:', error);
		console.log('🆕 Starting with fresh bookmark store');
		return { version, bookmarks: [] };
	}
}

/**
 * Clear bookmark data from localStorage
 */
export function clearLocalStorage(): void {
	if (!browser) return;

	localStorage.removeItem(STORAGE_KEY);
	console.log('🗑️ Cleared bookmark data from localStorage');
}

/**
 * Get storage usage statistics
 */
export function getStorageStats() {
	if (!browser) return null;

	const bookmarkData = localStorage.getItem(STORAGE_KEY);
	const dataSize = bookmarkData ? calculateStorageSize(JSON.parse(bookmarkData)) : 0;
	const totalSize = getTotalLocalStorageSize();

	return {
		dataSize,
		totalSize,
		warningThreshold: WARNING_THRESHOLD,
		criticalThreshold: CRITICAL_THRESHOLD,
		percentUsed: (totalSize / CRITICAL_THRESHOLD) * 100,
		bookmarkCount: bookmarkData ? JSON.parse(bookmarkData).bookmarks?.length || 0 : 0
	};
}

/**
 * Export bookmarks as a JSON file download
 */
export function exportBookmarks(data?: BookmarkStore): void {
	if (!browser) return;

	// Get data from localStorage if not provided
	const exportData = data || loadFromLocalStorage();

	// Get current user agent info for filename
	const userAgentInfo = getCurrentUserAgent();
	const dateStr = new Date().toISOString().split('T')[0];

	// Create filename with device, OS, and browser info
	let filename = `bookmarks-${dateStr}`;
	if (userAgentInfo) {
		const deviceStr = userAgentInfo.device.toLowerCase().replace(/\s+/g, '-');
		const osStr = userAgentInfo.os
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[\/\\]/g, '-');
		const browserStr = userAgentInfo.browser.toLowerCase().replace(/\s+/g, '-');
		filename = `bookmarks-${dateStr}-${deviceStr}-${osStr}-${browserStr}`;
	}

	// Create download link
	const jsonString = JSON.stringify(exportData, null, 2);
	const blob = new Blob([jsonString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = `${filename}.json`;
	a.style.display = 'none';

	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);

	// Clean up URL object
	URL.revokeObjectURL(url);

	console.log('📤 Exported bookmarks:', {
		bookmarkCount: exportData.bookmarks.length,
		fileSize: `${(blob.size / 1024).toFixed(1)}KB`,
		filename: `${filename}.json`
	});
}

/**
 * Remove duplicate bookmarks based on URL
 * @param bookmarks Array of bookmarks to deduplicate
 * @returns Object with deduplicatedBookmarks and duplicateCount
 */
function removeDuplicatesByUrl(bookmarks: Bookmark[]): { deduplicatedBookmarks: Bookmark[]; duplicateCount: number } {
	const seen = new Set<string>();
	const deduplicatedBookmarks: Bookmark[] = [];
	let duplicateCount = 0;

	for (const bookmark of bookmarks) {
		if (seen.has(bookmark.url)) {
			duplicateCount++;
			console.log(`🔍 Duplicate found during import: ${bookmark.title || 'Untitled'} (${bookmark.url})`);
		} else {
			seen.add(bookmark.url);
			deduplicatedBookmarks.push(bookmark);
		}
	}

	return { deduplicatedBookmarks, duplicateCount };
}

/**
 * Clean invalid URLs from existing bookmarks
 * @param bookmarks Array of bookmarks to clean
 * @param showAlerts Whether to show alert dialogs (default: false for silent operation)
 */
export function cleanInvalidUrls(
	bookmarks: Bookmark[],
	showAlerts: boolean = false
): { cleanedBookmarks: Bookmark[]; removedCount: number; removedBookmarks: Bookmark[] } {
	if (!browser) return { cleanedBookmarks: bookmarks, removedCount: 0, removedBookmarks: [] };

	const originalCount = bookmarks.length;
	const removedBookmarks: Bookmark[] = [];

	const cleanedBookmarks = bookmarks.filter((bookmark) => {
		if (!bookmark.url) {
			console.log('⚠️ Found bookmark with no URL:', bookmark.title);
			removedBookmarks.push(bookmark);
			return false;
		}
		const isValid = isValidUrl(bookmark.url);
		if (!isValid) {
			console.log('⚠️ Found bookmark with invalid URL:', bookmark.url, 'Title:', bookmark.title);
			removedBookmarks.push(bookmark);
		}
		return isValid;
	});

	const filteredCount = cleanedBookmarks.length;
	const removedCount = originalCount - filteredCount;

	if (removedCount > 0) {
		console.warn(`⚠️ Found ${removedCount} bookmark(s) with invalid URLs`);
		if (showAlerts) {
			const message = `Found ${removedCount} bookmark(s) with invalid URLs that were removed.\n\n${filteredCount} valid bookmarks remaining.`;
			alert(message);
		}
	} else {
		console.log(`✅ All ${filteredCount} bookmarks have valid URLs`);
		if (showAlerts) {
			alert(`All ${filteredCount} bookmarks have valid URLs. No cleanup needed.`);
		}
	}

	return {
		cleanedBookmarks,
		removedCount,
		removedBookmarks
	};
}

/**
 * Import bookmarks from a JSON file
 */
export async function importBookmarks(file: File): Promise<BookmarkStore> {
	if (!browser) throw new Error('Import is only available in browser');

	try {
		console.log('📥 Importing file:', file.name, 'Size:', file.size, 'bytes');
		const text = await file.text();
		console.log('📄 File content length:', text.length);
		const data = JSON.parse(text);
		console.log('📊 Parsed data:', data);

		// Validate and normalize the data
		let bookmarkStore: BookmarkStore;

		if (Array.isArray(data)) {
			// Handle legacy array format
			console.log('🔄 Importing legacy bookmark format...');
			bookmarkStore = {
				version: '2025-08-13',
				bookmarks: data.map((item) => ({
					url: item.href || item.url,
					title: item.title,
					description: item.description || null,
					tags: item.tags || [],
					notes: item.notes || null,
					added: new Date(item.added || Date.now()),
					clicked: item.clicked || 0,
					last: item.last ? new Date(item.last) : null,
					userAgent: item.userAgent,
					browser: item.browser,
					os: item.os,
					device: item.device
				}))
			};
		} else if (data.bookmarks && Array.isArray(data.bookmarks)) {
			// Handle BookmarkStore format
			bookmarkStore = {
				version: data.version || '2025-08-13',
				bookmarks: data.bookmarks.map((bookmark: any) => ({
					url: bookmark.url,
					title: bookmark.title,
					description: bookmark.description || null,
					tags: bookmark.tags || [],
					notes: bookmark.notes || null,
					added: new Date(bookmark.added),
					clicked: bookmark.clicked || 0,
					last: bookmark.last ? new Date(bookmark.last) : null,
					userAgent: bookmark.userAgent,
					browser: bookmark.browser,
					os: bookmark.os,
					device: bookmark.device
				}))
			};
		} else {
			throw new Error('Invalid file format: Expected array of bookmarks or BookmarkStore object');
		}

		// Filter out invalid URLs using the same logic as cleanInvalidUrls (silent mode)
		const cleanupResult = cleanInvalidUrls(bookmarkStore.bookmarks, false);
		bookmarkStore.bookmarks = cleanupResult.cleanedBookmarks;

		// Remove duplicate URLs
		const duplicateResult = removeDuplicatesByUrl(bookmarkStore.bookmarks);
		bookmarkStore.bookmarks = duplicateResult.deduplicatedBookmarks;

		// Report cleanup results
		let message = '';
		let hasIssues = false;

		if (cleanupResult.removedCount > 0) {
			console.warn(
				`⚠️ Filtered out ${cleanupResult.removedCount} bookmark(s) with invalid URLs during import`
			);
			message += `${cleanupResult.removedCount} bookmark(s) with invalid URLs were removed.`;
			hasIssues = true;
		}

		if (duplicateResult.duplicateCount > 0) {
			console.warn(
				`⚠️ Removed ${duplicateResult.duplicateCount} duplicate bookmark(s) during import`
			);
			if (hasIssues) message += '\n';
			message += `${duplicateResult.duplicateCount} duplicate bookmark(s) were removed.`;
			hasIssues = true;
		}

		if (hasIssues) {
			// Show import-specific alert for issues
			const finalMessage = `Import complete!\n\n${bookmarkStore.bookmarks.length} unique bookmarks imported successfully.\n\n${message}`;
			alert(finalMessage);
		} else {
			console.log(
				`✅ All ${bookmarkStore.bookmarks.length} bookmarks imported successfully - no issues found`
			);
		}

		console.log('📥 Imported bookmarks:', {
			bookmarkCount: bookmarkStore.bookmarks.length,
			invalidUrlsRemoved: cleanupResult.removedCount,
			duplicatesRemoved: duplicateResult.duplicateCount,
			fileSize: `${(file.size / 1024).toFixed(1)}KB`
		});

		return bookmarkStore;
	} catch (error) {
		console.error('Failed to import bookmarks:', error);
		throw new Error(
			`Failed to import bookmarks: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
