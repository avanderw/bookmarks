/**
 * DateUtils - Utility functions for formatting dates in a user-friendly way
 */

/**
 * Format a date as a relative time string (e.g., "2 days ago", "just now")
 * @param date The date to format (Date object or timestamp)
 * @returns A human-friendly relative time string
 */
export function formatRelativeTime(date: Date | number | string): string {
  const now = new Date();
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Calculate the difference in milliseconds
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  // Format based on the difference
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  } else if (diffHour < 24) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  } else if (diffDay < 7) {
    return diffDay === 1 ? 'yesterday' : `${diffDay} days ago`;
  } else if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffDay / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}

/**
 * Format a date in a friendly format (e.g., "Jan 15, 2023")
 * @param date The date to format (Date object or timestamp)
 * @returns A human-friendly date string
 */
export function formatFriendlyDate(date: Date | number | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return dateObj.toLocaleDateString(undefined, options);
}

/**
 * Get both relative and absolute date strings
 * @param date The date to format
 * @returns An object with both relative and absolute formatted dates
 */
export function getFormattedDate(date: Date | number | string): { relative: string; absolute: string } {
  return {
    relative: formatRelativeTime(date),
    absolute: formatFriendlyDate(date)
  };
}