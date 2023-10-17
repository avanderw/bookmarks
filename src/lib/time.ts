/**
 * Return a friendly date string.
 * The string will mention how many days, hours, minutes, or seconds ago the date was.
 */
export function friendly(date:Date|null) {
    if (!date) return "never";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        if (days > 1) {
            return `${days} days ago`;
        }
        return `${days} day ago`;
    }
    if (hours > 1) {
        return `${hours} hours ago`;
    }
    if (hours === 1) {
        return `${hours} hour ago`;
    }
    if (minutes > 1) {
        return `${minutes} minutes ago`;
    }
    if (seconds > 1) {
        return `${seconds} seconds ago`;
    }
    return "just now";
}