<script lang="ts">
	import { createCacheRefreshLogic } from './Logic';
	import { onMount, onDestroy } from 'svelte';

	const logic = createCacheRefreshLogic();
	let state = logic.getState();
	let stateUnsubscribe: (() => void) | null = null;

	onMount(() => {
		// Subscribe to state changes for reactive updates
		stateUnsubscribe = logic.onStateChange((newState) => {
			state = newState;
		});
		
		// Initialize with a single check on page load (no continuous monitoring)
		logic.initializeOnceOnly();
	});

	onDestroy(() => {
		if (stateUnsubscribe) {
			stateUnsubscribe();
		}
		logic.destroy();
	});

	async function handleRefresh() {
		await logic.refreshApp();
	}

	function handleDismiss() {
		logic.dismissNotification();
	}

	async function handleCheckNow() {
		await logic.checkNow();
	}
</script>

<!-- Cache Refresh Notification -->
{#if state.showNotification}
	<div class="cache-notification" role="alert">
		<article>
			<header>
				<h4>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M1 4v6h6"/>
						<path d="M23 20v-6h-6"/>
						<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10"/>
						<path d="M3.51 15a9 9 0 0 0 14.85 3.36L23 14"/>
					</svg>
					App Update Available
				</h4>
			</header>
			
			<p>
				A new version of the bookmark app is available. 
				{#if state.status}
					<small>
						Current: {state.status.currentVersion || 'unknown'} → 
						Latest: {state.status.latestVersion || 'unknown'}
					</small>
				{/if}
			</p>

			{#if state.error}
				<p class="error-text">
					<small>⚠️ {state.error}</small>
				</p>
			{/if}

			<footer>
				<button 
					class="primary"
					on:click={handleRefresh}
					disabled={state.isChecking}
				>
					{state.isChecking ? 'Refreshing...' : 'Refresh Now'}
				</button>
				
				<button 
					class="secondary"
					on:click={handleCheckNow}
					disabled={state.isChecking}
				>
					Check Again
				</button>
				
				<button 
					class="outline"
					on:click={handleDismiss}
				>
					Dismiss
				</button>
			</footer>
		</article>
	</div>
{/if}

<style>
	.cache-notification {
		position: fixed;
		top: 1rem;
		right: 1rem;
		z-index: 1000;
		max-width: 400px;
		animation: slideIn 0.3s ease-out;
	}

	.cache-notification article {
		margin: 0;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border-left: 4px solid var(--primary);
	}

	.cache-notification header {
		padding-bottom: 0.5rem;
	}

	.cache-notification h4 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1rem;
	}

	.cache-notification p {
		margin: 0.5rem 0;
		font-size: 0.9rem;
	}

	.cache-notification footer {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.cache-notification button {
		font-size: 0.8rem;
		padding: 0.5rem 1rem;
		margin: 0;
	}

	.error-text {
		color: var(--color-error, #e74c3c);
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@media (max-width: 640px) {
		.cache-notification {
			top: 0;
			left: 0;
			right: 0;
			max-width: none;
			border-radius: 0;
		}

		.cache-notification footer {
			flex-direction: column;
		}

		.cache-notification button {
			width: 100%;
		}
	}
</style>
