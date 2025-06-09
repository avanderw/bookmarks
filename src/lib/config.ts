// Configuration file for application URLs and endpoints

/**
 * URL configuration for the bookmarks application
 * - Used by both the application and the bookmarklet
 * - Change these values when the application domain or paths change
 */
export const config = {
    // The primary host where the application is deployed
    primaryHost: 'avanderw.co.za',
    
    // The base path where the application is served from
    basePath: '/bookmarks/',
    
    // Protocol to use (https is recommended for production)
    protocol: 'https'
};

/**
 * Returns the fully qualified base URL for the application
 */
export function getBaseUrl(): string {
    return `${config.protocol}://${config.primaryHost}${config.basePath}`;
}