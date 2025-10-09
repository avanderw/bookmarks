/**
 * PWA Cache Validator - Detects when cached assets are stale
 * and provides refresh mechanisms for service worker updates
 */

export interface CacheStatus {
	isStale: boolean;
	currentVersion: string | null;
	latestVersion: string | null;
	lastCheck: Date;
	error?: string;
}

export class CacheValidator {
	private static instance: CacheValidator;
	private checkInterval: number = 5 * 60 * 1000; // 5 minutes
	private intervalId: number | null = null;
	private lastStatus: CacheStatus | null = null;
	private listeners: ((status: CacheStatus) => void)[] = [];
	private messageListener: ((event: MessageEvent) => void) | null = null;

	private constructor() {
		// Only setup message listener in browser environment
		if (typeof window !== 'undefined') {
			this.setupMessageListener();
		}
	}

	static getInstance(): CacheValidator {
		if (!CacheValidator.instance) {
			CacheValidator.instance = new CacheValidator();
		}
		return CacheValidator.instance;
	}

	/**
	 * Start automatic cache validation checks
	 */
	startMonitoring(interval: number = this.checkInterval): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
		}

		this.checkInterval = interval;
		this.intervalId = window.setInterval(() => {
			this.checkCacheStatus();
		}, this.checkInterval);

		// Check immediately on start
		this.checkCacheStatus();
	}

	/**
	 * Stop automatic cache validation
	 */
	stopMonitoring(): void {
		if (this.intervalId) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	/**
	 * Manually check if cache is stale
	 */
	async checkCacheStatus(): Promise<CacheStatus> {
		if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
			const status: CacheStatus = {
				isStale: false,
				currentVersion: null,
				latestVersion: null,
				lastCheck: new Date(),
				error: 'Service worker not available'
			};
			this.updateStatus(status);
			return status;
		}

		try {
			const messageChannel = new MessageChannel();
			
			const response = await new Promise<any>((resolve, reject) => {
				messageChannel.port1.onmessage = (event) => {
					resolve(event.data);
				};

				setTimeout(() => {
					reject(new Error('Timeout checking cache version'));
				}, 10000); // 10 second timeout

				navigator.serviceWorker.controller!.postMessage(
					{ type: 'CHECK_VERSION' },
					[messageChannel.port2]
				);
			});

			if (response.type === 'VERSION_CHECK_ERROR') {
				throw new Error(response.error);
			}

			const status: CacheStatus = {
				isStale: response.isStale || response.cacheExpired,
				currentVersion: response.currentVersion,
				latestVersion: response.latestVersion,
				lastCheck: new Date()
			};

			this.updateStatus(status);
			return status;

		} catch (error) {
			console.warn('Cache version check failed, performing direct check:', error);
			
			// Fallback: directly check version file
			try {
				const versionResponse = await fetch('/bookmarks/_app/version.json');
				const versionData = await versionResponse.json();
				
				const status: CacheStatus = {
					isStale: false, // Can't determine staleness without SW comparison
					currentVersion: null,
					latestVersion: versionData.version,
					lastCheck: new Date(),
					error: 'Service worker unavailable, showing latest version only'
				};
				
				this.updateStatus(status);
				return status;
			} catch (fetchError) {
				const status: CacheStatus = {
					isStale: false,
					currentVersion: null,
					latestVersion: null,
					lastCheck: new Date(),
					error: error instanceof Error ? error.message : 'Unknown error'
				};
				this.updateStatus(status);
				return status;
			}
		}
	}

	/**
	 * Force refresh the PWA by clearing cache and reloading
	 */
	async forceRefresh(): Promise<void> {
		try {
			// Clear all caches
			if ('caches' in window) {
				const cacheNames = await caches.keys();
				await Promise.all(
					cacheNames.map(name => caches.delete(name))
				);
			}

			// Unregister service worker
			if ('serviceWorker' in navigator) {
				const registrations = await navigator.serviceWorker.getRegistrations();
				await Promise.all(
					registrations.map(registration => registration.unregister())
				);
			}

			// Hard reload the page
			window.location.reload();
		} catch (error) {
			console.error('Error during force refresh:', error);
			// Fallback to simple reload
			window.location.reload();
		}
	}

	/**
	 * Add listener for cache status changes
	 */
	onStatusChange(callback: (status: CacheStatus) => void): () => void {
		this.listeners.push(callback);
		
		// Send current status if available
		if (this.lastStatus) {
			callback(this.lastStatus);
		}

		// Return unsubscribe function
		return () => {
			const index = this.listeners.indexOf(callback);
			if (index > -1) {
				this.listeners.splice(index, 1);
			}
		};
	}

	/**
	 * Get the last known cache status
	 */
	getLastStatus(): CacheStatus | null {
		return this.lastStatus;
	}

	private updateStatus(status: CacheStatus): void {
		this.lastStatus = status;
		this.listeners.forEach(listener => {
			try {
				listener(status);
			} catch (error) {
				console.error('Error in cache status listener:', error);
			}
		});
	}

	/**
	 * Setup listener for service worker messages about cache staleness
	 */
	private setupMessageListener(): void {
		// Guard against SSR
		if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
			return;
		}

		this.messageListener = (event: MessageEvent) => {
			if (event.data && event.data.type === 'CACHE_STALE_DETECTED') {
				console.warn('Service worker detected stale cache:', event.data);
				
				// Immediately mark cache as stale and notify listeners
				const status: CacheStatus = {
					isStale: true,
					currentVersion: this.lastStatus?.currentVersion || null,
					latestVersion: this.lastStatus?.latestVersion || null,
					lastCheck: new Date(),
					error: `Cache is stale (${event.data.reason}): ${event.data.url}`
				};
				
				this.updateStatus(status);
			}
		};

		navigator.serviceWorker.addEventListener('message', this.messageListener);
	}

	/**
	 * Cleanup resources
	 */
	destroy(): void {
		this.stopMonitoring();
		
		// Guard against SSR
		if (this.messageListener && typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
			navigator.serviceWorker.removeEventListener('message', this.messageListener);
			this.messageListener = null;
		}
	}
}

// Export singleton instance getter (lazy initialization to avoid SSR issues)
function getCacheValidator(): CacheValidator {
	return CacheValidator.getInstance();
}

export const cacheValidator = typeof window !== 'undefined' ? getCacheValidator() : ({
	// Provide stub for SSR
	startMonitoring: () => {},
	stopMonitoring: () => {},
	checkCacheStatus: async () => ({
		isStale: false,
		currentVersion: null,
		latestVersion: null,
		lastCheck: new Date(),
		error: 'SSR environment'
	}),
	forceRefresh: async () => {},
	onStatusChange: () => () => {},
	getLastStatus: () => null,
	destroy: () => {}
} as unknown as CacheValidator);
