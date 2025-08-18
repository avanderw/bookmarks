/**
 * Storage Monitor Logic - handles storage statistics and warnings
 */
import { getStorageStats } from '$lib/storage';
import { browser } from '$app/environment';

export interface StorageStats {
	dataSize: number;
	totalSize: number;
	warningThreshold: number;
	criticalThreshold: number;
	percentUsed: number;
	bookmarkCount: number;
}

export function getStorageInfo(): StorageStats | null {
	if (!browser) return null;
	return getStorageStats();
}

export function formatBytes(bytes: number): string {
	if (bytes === 0) return '0 B';

	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getStorageStatusColor(percentUsed: number): string {
	if (percentUsed >= 80) return 'var(--pico-del-color)'; // Critical (red)
	if (percentUsed >= 60) return 'var(--pico-ins-color)'; // Warning (orange/yellow)
	return 'var(--pico-primary)'; // Normal (blue/green)
}

export function getStorageStatusText(percentUsed: number): string {
	if (percentUsed >= 80) return 'Critical';
	if (percentUsed >= 60) return 'Warning';
	return 'Normal';
}

export function generateCleanupSuggestions(stats: StorageStats): string[] {
	const suggestions = [];

	if (stats.bookmarkCount > 1000) {
		suggestions.push('Consider removing old or unused bookmarks');
	}

	if (stats.percentUsed > 60) {
		suggestions.push('Export bookmarks and consider migrating to IndexedDB');
		suggestions.push('Clear browser cache and data for other sites');
	}

	if (stats.percentUsed > 80) {
		suggestions.push('Immediate cleanup required - export bookmarks now');
		suggestions.push('Delete duplicate bookmarks');
	}

	return suggestions;
}
