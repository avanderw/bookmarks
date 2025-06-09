/**
 * Utilities for file handling operations in BookmarkManager
 */
import type { Bookmark } from '$lib/bookmarks';
import { handleFileImport as importBookmarks } from './Logic';

export const FileUtils = {
  /**
   * Handle file import from drag-and-drop or file input
   * @param file The file to import
   * @returns Promise with imported bookmarks or error
   */
  async importFile(file: File): Promise<{ bookmarks: Bookmark[] }> {
    try {
      return await importBookmarks(file);
    } catch (error) {
      console.error('Error importing file:', error);
      throw new Error('Failed to import file. Please check the file format.');
    }
  },

  /**
   * Create a file event wrapper for consistency
   * @param file The file to wrap in a CustomEvent
   * @returns CustomEvent with file as detail
   */
  createFileEvent(file: File): CustomEvent<File> {
    return new CustomEvent('fileImported', { detail: file });
  }
};