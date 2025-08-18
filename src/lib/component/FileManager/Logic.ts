/**
 * FileManager Logic Module
 * Pure functions for file handling operations
 */

/**
 * Validates if the uploaded file is a JSON file
 */
export function validateFileType(file: File): boolean {
	return file.type === 'application/json' || file.name.endsWith('.json');
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Creates a filename for bookmark exports
 */
export function createExportFilename(): string {
	const now = new Date();
	const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
	return `bookmarks-${dateStr}.json`;
}
