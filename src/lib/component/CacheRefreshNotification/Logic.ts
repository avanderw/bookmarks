import type { CacheStatus } from '$lib/utils/CacheValidator';
import { cacheValidator } from '$lib/utils/CacheValidator';

/**
 * Logic for PWA cache validation and refresh notifications
 */

export interface CacheRefreshState {
	showNotification: boolean;
	isChecking: boolean;
	status: CacheStatus | null;
	error: string | null;
}

export function createCacheRefreshLogic() {
	let state: CacheRefreshState = {
		showNotification: false,
		isChecking: false,
		status: null,
		error: null
	};

	let unsubscribe: (() => void) | null = null;
	let stateChangeCallbacks: ((state: CacheRefreshState) => void)[] = [];

	/**
	 * Notify listeners of state changes
	 */
	function notifyStateChange(): void {
		stateChangeCallbacks.forEach(callback => {
			try {
				callback({ ...state });
			} catch (error) {
				console.error('Error in state change callback:', error);
			}
		});
	}

	/**
	 * Initialize cache monitoring
	 */
	function initialize(): void {
		// Start monitoring with 5 minute intervals
		cacheValidator.startMonitoring(5 * 60 * 1000);

		// Listen for status changes
		unsubscribe = cacheValidator.onStatusChange((status) => {
			state.status = status;
			state.showNotification = status.isStale;
			state.error = status.error || null;
			
			if (status.isStale) {
				console.log('PWA cache is stale, showing refresh notification');
			}
		});
	}

	/**
	 * Initialize with a single check only (no continuous monitoring)
	 */
	function initializeOnceOnly(): void {
		// Listen for status changes but don't start continuous monitoring
		unsubscribe = cacheValidator.onStatusChange((status) => {
			state.status = status;
			state.showNotification = status.isStale;
			state.error = status.error || null;
			
			if (status.isStale) {
				console.log('PWA cache is stale, showing refresh notification');
			}
			
			// Notify component of state change
			notifyStateChange();
		});

		// Do a single check on initialization
		checkNow();
	}

	/**
	 * Manually check cache status
	 */
	async function checkNow(): Promise<void> {
		state.isChecking = true;
		notifyStateChange();
		
		try {
			const status = await cacheValidator.checkCacheStatus();
			state.status = status;
			state.showNotification = status.isStale;
			state.error = status.error || null;
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Check failed';
		} finally {
			state.isChecking = false;
		}
		
		notifyStateChange();
	}

	/**
	 * Refresh the PWA
	 */
	async function refreshApp(): Promise<void> {
		try {
			await cacheValidator.forceRefresh();
		} catch (error) {
			state.error = error instanceof Error ? error.message : 'Refresh failed';
		}
	}

	/**
	 * Dismiss the notification
	 */
	function dismissNotification(): void {
		state.showNotification = false;
		notifyStateChange();
	}

	/**
	 * Add listener for state changes
	 */
	function onStateChange(callback: (state: CacheRefreshState) => void): () => void {
		stateChangeCallbacks.push(callback);
		
		// Return unsubscribe function
		return () => {
			const index = stateChangeCallbacks.indexOf(callback);
			if (index > -1) {
				stateChangeCallbacks.splice(index, 1);
			}
		};
	}

	/**
	 * Get current state
	 */
	function getState(): CacheRefreshState {
		return { ...state };
	}

	/**
	 * Cleanup resources
	 */
	function destroy(): void {
		if (unsubscribe) {
			unsubscribe();
			unsubscribe = null;
		}
		cacheValidator.stopMonitoring();
	}

	return {
		initialize,
		initializeOnceOnly,
		checkNow,
		refreshApp,
		dismissNotification,
		onStateChange,
		getState,
		destroy
	};
}
