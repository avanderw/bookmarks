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

	private constructor() {}

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
}

// Export singleton instance
export const cacheValidator = CacheValidator.getInstance();
