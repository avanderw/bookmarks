/**
 * Test for CacheValidator functionality
 * Run this manually in browser console to test cache validation
 */

import { cacheValidator } from '$lib/utils/CacheValidator';

export async function testCacheValidator() {
	console.log('Testing CacheValidator...');

	// Test initial state
	const initialStatus = cacheValidator.getLastStatus();
	console.log('Initial status:', initialStatus);

	// Test manual check
	console.log('Performing manual cache check...');
	const status = await cacheValidator.checkCacheStatus();
	console.log('Cache status:', status);

	// Test state listener
	const unsubscribe = cacheValidator.onStatusChange((newStatus) => {
		console.log('Status changed:', newStatus);
	});

	// Simulate a second check
	setTimeout(async () => {
		console.log('Performing second check...');
		await cacheValidator.checkCacheStatus();
		
		// Cleanup
		unsubscribe();
		console.log('Test completed');
	}, 2000);
}

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
	(window as any).testCacheValidator = testCacheValidator;
}
