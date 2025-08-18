<!-- Storage Monitor View Component -->
<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		getStorageInfo,
		formatBytes,
		getStorageStatusColor,
		getStorageStatusText,
		generateCleanupSuggestions,
		type StorageStats
	} from './Logic';

	// Props
	export let isOpen: boolean = false;

	// Events
	const dispatch = createEventDispatcher<{
		close: void;
		export: void;
		cleanup: void;
	}>();

	// State
	let stats: StorageStats | null = null;
	let refreshInterval: number;

	// Lifecycle
	onMount(() => {
		refreshStats();

		// Refresh stats every 5 seconds when open
		if (isOpen) {
			refreshInterval = setInterval(refreshStats, 5000);
		}

		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});

	// Watch for open state changes
	$: if (isOpen) {
		refreshStats();
		refreshInterval = setInterval(refreshStats, 5000);
	} else if (refreshInterval) {
		clearInterval(refreshInterval);
	}

	function refreshStats() {
		stats = getStorageInfo();
	}

	function handleClose() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}
		dispatch('close');
	}

	function handleExport() {
		dispatch('export');
	}

	function handleCleanup() {
		dispatch('cleanup');
	}
</script>

{#if isOpen}
	<dialog open on:click|self={handleClose}>
		<article on:click|stopPropagation>
			<header>
				<button aria-label="Close" data-rel="prev" on:click={handleClose} />
				<h3>📊 Storage Monitor</h3>
			</header>

			{#if stats}
				<div class="storage-overview">
					<div class="storage-bar">
						<div class="storage-label">
							Storage Usage: {stats.percentUsed.toFixed(1)}%
							<span class="status" style="color: {getStorageStatusColor(stats.percentUsed)}">
								({getStorageStatusText(stats.percentUsed)})
							</span>
						</div>
						<div class="progress-bar">
							<div
								class="progress-fill"
								style="width: {Math.min(
									stats.percentUsed,
									100
								)}%; background-color: {getStorageStatusColor(stats.percentUsed)}"
							/>
						</div>
					</div>

					<div class="storage-details">
						<div class="detail-grid">
							<div class="detail-item">
								<strong>📚 Bookmarks:</strong>
								<span>{stats.bookmarkCount.toLocaleString()}</span>
							</div>
							<div class="detail-item">
								<strong>💾 Bookmark Data:</strong>
								<span>{formatBytes(stats.dataSize)}</span>
							</div>
							<div class="detail-item">
								<strong>🗄️ Total Storage:</strong>
								<span>{formatBytes(stats.totalSize)}</span>
							</div>
							<div class="detail-item">
								<strong>⚠️ Warning Threshold:</strong>
								<span>{formatBytes(stats.warningThreshold)}</span>
							</div>
							<div class="detail-item">
								<strong>🚨 Critical Threshold:</strong>
								<span>{formatBytes(stats.criticalThreshold)}</span>
							</div>
						</div>
					</div>

					{#if stats.percentUsed > 50}
						<div class="cleanup-suggestions">
							<h4>💡 Cleanup Suggestions</h4>
							<ul>
								{#each generateCleanupSuggestions(stats) as suggestion}
									<li>{suggestion}</li>
								{/each}
							</ul>
						</div>
					{/if}

					<div class="actions">
						<button class="secondary" on:click={handleExport}>
							<svg><use href="feather-sprite.svg#download" /></svg>
							Export Bookmarks
						</button>

						{#if stats.percentUsed > 60}
							<button class="btn-warning" on:click={handleCleanup}>
								<svg><use href="feather-sprite.svg#trash-2" /></svg>
								Find Duplicates
							</button>
						{/if}

						<button on:click={refreshStats}>
							<svg><use href="feather-sprite.svg#refresh-cw" /></svg>
							Refresh
						</button>
					</div>
				</div>
			{:else}
				<p>Unable to load storage information.</p>
			{/if}
		</article>
	</dialog>
{/if}

<style>
	.storage-overview {
		padding: 1rem 0;
	}

	.storage-bar {
		margin-bottom: 1.5rem;
	}

	.storage-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.status {
		font-weight: bold;
	}

	.progress-bar {
		width: 100%;
		height: 20px;
		background-color: var(--pico-muted-border-color);
		border-radius: 10px;
		overflow: hidden;
		position: relative;
	}

	.progress-fill {
		height: 100%;
		border-radius: 10px;
		transition: all 0.3s ease;
		position: relative;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem 1rem;
		margin-bottom: 1.5rem;
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background: var(--pico-card-background-color);
		border-radius: 0.25rem;
		border: 1px solid var(--pico-muted-border-color);
	}

	.cleanup-suggestions {
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: var(--pico-card-sectioning-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 0.5rem;
	}

	.cleanup-suggestions h4 {
		margin: 0 0 0.5rem 0;
		color: var(--pico-primary);
	}

	.cleanup-suggestions ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.cleanup-suggestions li {
		margin-bottom: 0.25rem;
		color: var(--pico-color);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.btn-warning {
		background-color: var(--pico-ins-color);
		border-color: var(--pico-ins-color);
		color: var(--pico-contrast);
	}

	.btn-warning:hover {
		background-color: var(--pico-del-color);
		border-color: var(--pico-del-color);
		color: var(--pico-contrast);
	}

	@media (max-width: 768px) {
		.detail-grid {
			grid-template-columns: 1fr;
		}

		.actions {
			flex-direction: column;
		}
	}
</style>
