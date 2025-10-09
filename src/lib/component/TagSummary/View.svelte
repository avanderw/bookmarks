<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Bookmark } from '$lib/bookmarks';
	import { extractTagSummary, filterTags, type TagInfo } from './Logic';

	export let bookmarks: Bookmark[] = [];
	export let isOpen = false;
	export let maxDisplayedTags = 50;

	const dispatch = createEventDispatcher<{
		close: void;
		tagClick: { tag: string };
		tagsSelected: { tags: string[] };
	}>();

	let tagSummary: TagInfo[] = [];
	let filteredTags: TagInfo[] = [];
	let tagSearchText = '';
	let selectedTags: Set<string> = new Set();
	let showAll = false;
	let lastBookmarksHash = '';

	// Memoize tag summary calculation to avoid recalculating on every change
	function getBookmarksHash(bookmarks: Bookmark[]): string {
		return `${bookmarks.length}-${bookmarks.map((b) => b.tags?.join(',') || '').join('|')}`;
	}

	// Update tag summary when bookmarks actually change
	$: {
		const currentHash = getBookmarksHash(bookmarks);
		if (currentHash !== lastBookmarksHash) {
			lastBookmarksHash = currentHash;
			tagSummary = extractTagSummary(bookmarks);
		}
	}

	// Filter tags based on search text
	$: filteredTags = filterTags(tagSummary, tagSearchText);

	// Determine which tags to display
	$: displayedTags = showAll ? filteredTags : filteredTags.slice(0, maxDisplayedTags);

	function handleTagClick(tag: string) {
		dispatch('tagClick', { tag });
	}

	function handleTagSelect(tag: string, event: Event) {
		event.stopPropagation();
		if (selectedTags.has(tag)) {
			selectedTags.delete(tag);
		} else {
			selectedTags.add(tag);
		}
		selectedTags = new Set(selectedTags); // Trigger reactivity
	}

	function applySelectedTags() {
		dispatch('tagsSelected', { tags: Array.from(selectedTags) });
		close();
	}

	function clearSelection() {
		selectedTags.clear();
		selectedTags = new Set(selectedTags);
	}

	function selectAll() {
		selectedTags = new Set(displayedTags.map((t) => t.tag));
	}

	function close() {
		dispatch('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			close();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<dialog open on:click|self={close}>
		<article on:click|stopPropagation>
			<header>
				<button aria-label="Close" on:click={close} />
				<h3>Tag Summary</h3>
				<p>Click tags to filter, or select multiple and apply</p>
			</header>

			<div class="tag-summary-content">
				<!-- Search and controls -->
				<div class="controls">
					<div class="search-section">
						<input
							type="search"
							bind:value={tagSearchText}
							placeholder="Search tags..."
							class="tag-search"
						/>
						<small class="text-muted">
							Showing {displayedTags.length} of {filteredTags.length} tags
						</small>
					</div>

					{#if selectedTags.size > 0}
						<div class="selection-controls">
							<span class="selection-count">{selectedTags.size} selected</span>
							<button class="btn-compact secondary" on:click={clearSelection}> Clear </button>
							<button class="btn-compact" on:click={applySelectedTags}> Apply Filter </button>
						</div>
					{:else}
						<div class="bulk-controls">
							<button class="btn-compact secondary" on:click={selectAll}>
								Select All Visible
							</button>
						</div>
					{/if}
				</div>

				<!-- Tag cloud -->
				<div class="tag-cloud" class:has-selection={selectedTags.size > 0}>
					{#each displayedTags as tagInfo (tagInfo.tag)}
						<div class="tag-bubble" class:selected={selectedTags.has(tagInfo.tag)}>
							<input
								type="checkbox"
								id="tag-{tagInfo.tag}"
								checked={selectedTags.has(tagInfo.tag)}
								on:change={(e) => handleTagSelect(tagInfo.tag, e)}
								title="Select for multi-tag filter"
							/>
							<label
								for="tag-{tagInfo.tag}"
								class="tag-label"
								role="button"
								tabindex="0"
								on:click|preventDefault={() => handleTagClick(tagInfo.tag)}
								on:keydown={(e) => e.key === 'Enter' && handleTagClick(tagInfo.tag)}
							>
								<span class="tag-name">#{tagInfo.tag}</span>
								<span class="tag-count">{tagInfo.count}</span>
							</label>
						</div>
					{/each}

					{#if filteredTags.length === 0}
						<div class="empty-state">
							{#if tagSearchText}
								No tags found matching "{tagSearchText}"
							{:else}
								No tags found in bookmarks
							{/if}
						</div>
					{/if}

					{#if !showAll && filteredTags.length > maxDisplayedTags}
						<div class="show-more">
							<button class="btn-compact secondary" on:click={() => (showAll = true)}>
								Show {filteredTags.length - maxDisplayedTags} more tags
							</button>
						</div>
					{/if}
				</div>

				<!-- Summary stats -->
				<div class="tag-stats">
					<small class="text-muted">
						Total: {tagSummary.length} unique tags across {bookmarks.length} bookmarks
					</small>
				</div>
			</div>
		</article>
	</dialog>
{/if}

<style>
	.tag-summary-content {
		max-height: 70vh;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	.search-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.tag-search {
		margin: 0;
	}

	.selection-controls,
	.bulk-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.selection-count {
		font-size: 0.875rem;
		color: var(--pico-primary);
		font-weight: 500;
	}

	.tag-cloud {
		flex: 1;
		overflow-y: auto;
		max-height: 400px;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		background: var(--pico-card-background-color);
		padding: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-content: flex-start;
	}

	.tag-bubble {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		border-radius: 1rem;
		transition: all 0.2s ease;
		position: relative;
	}

	.tag-bubble input[type='checkbox'] {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
		margin: 0;
	}

	.tag-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.75rem;
		background: var(--pico-secondary-background);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 1rem;
		cursor: pointer;
		transition: all 0.2s ease;
		user-select: none;
		margin: 0;
		font-size: 0.875rem;
	}

	.tag-label:hover {
		background: var(--pico-primary-background);
		border-color: var(--pico-primary);
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.tag-bubble.selected .tag-label {
		background: var(--pico-primary);
		border-color: var(--pico-primary);
		color: var(--pico-primary-inverse);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	}

	.tag-bubble.selected .tag-name {
		color: var(--pico-primary-inverse);
	}

	.tag-bubble.selected .tag-count {
		background: rgba(255, 255, 255, 0.2);
		color: var(--pico-primary-inverse);
	}

	.tag-name {
		font-weight: 500;
		color: var(--pico-primary);
	}

	.tag-count {
		font-size: 0.75rem;
		color: var(--pico-muted-color);
		background: var(--pico-muted-background);
		padding: 0.125rem 0.375rem;
		border-radius: 0.5rem;
		min-width: fit-content;
		font-weight: 500;
	}

	.empty-state {
		padding: 2rem 1rem;
		text-align: center;
		color: var(--pico-muted-color);
		font-style: italic;
	}

	.show-more {
		padding: 0.75rem;
		text-align: center;
		border-top: 1px solid var(--pico-muted-border-color);
		background: var(--pico-card-sectionning-background-color);
	}

	.tag-stats {
		padding-top: 0.75rem;
		border-top: 1px solid var(--pico-muted-border-color);
		text-align: center;
	}

	@media (max-width: 768px) {
		.tag-summary-content {
			max-height: 80vh;
		}

		.selection-controls,
		.bulk-controls {
			flex-wrap: wrap;
		}

		.tag-cloud {
			padding: 0.5rem;
			gap: 0.375rem;
		}

		.tag-label {
			padding: 0.25rem 0.5rem;
			font-size: 0.8125rem;
		}
	}
</style>
