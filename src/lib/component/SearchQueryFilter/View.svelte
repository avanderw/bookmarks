<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { FilterOptions, FilterResult } from './Logic';
	import { applyFilter } from './Logic';
	import FilterHelp from './FilterHelp.svelte';

	export let data: any[] = [];
	export let placeholder: string = 'Search (use filters like never-clicked, device:mobile, etc.)';
	export let debounceTime: number = 500; // Increased from 300ms to 500ms for better performance

	let query: string = '';
	let filterOptions: FilterOptions = { and: [], or: [], not: [], special: [], notSpecial: [] };
	let timer: ReturnType<typeof setTimeout>;
	let showHelp = false;
	let lastDataHash = '';

	const dispatch = createEventDispatcher<{ filtered: FilterResult }>();

	function handleInput() {
		clearTimeout(timer);
		timer = setTimeout(() => {
			let filterResult = applyFilter(data, query);
			filterOptions = filterResult.options;
			dispatch('filtered', filterResult);
		}, debounceTime);
	}

	// Create a simple hash of the data to detect actual changes
	function getDataHash(data: any[]): string {
		return `${data.length}-${data.map((item) => item.url || item.id || '').join(',')}`;
	}

	function toggleHelp() {
		showHelp = !showHelp;
	}

	function onApplyExample(event: CustomEvent<string>) {
		query = event.detail;
		showHelp = false;
		handleInput();
	}

	function onCloseHelp() {
		showHelp = false;
	}

	// Public method to set query externally
	export function setQuery(newQuery: string) {
		query = newQuery;
		handleInput();
	}

	// Only trigger search when data actually changes (not on every reactive update)
	$: {
		const currentDataHash = getDataHash(data);
		if (currentDataHash !== lastDataHash) {
			lastDataHash = currentDataHash;
			// Clear any cached search text when data changes
			data.forEach((item) => {
				if (item._searchText) {
					delete item._searchText;
				}
			});
			handleInput();
		}
	}
</script>

<div class="filter-container">
	<div class="search-input-wrapper">
		<input type="search" bind:value={query} on:input={handleInput} {placeholder} />
		<button
			class="help-button"
			on:click={toggleHelp}
			title="Show filter help and examples"
			type="button"
		>
			<svg><use href="feather-sprite.svg#help-circle" /></svg>
		</button>
	</div>

	{#if query}
		<div class="filter-status">
			{#if filterOptions.special.length > 0}
				<div class="filter-group">
					<small>Special filters:</small>
					{#each filterOptions.special as filter}
						<span class="filter-tag special">
							{filter.type}
							{#if filter.value}:{filter.value}{/if}
							{#if filter.operator && filter.duration}{filter.operator}{filter.duration}d{/if}
							{#if filter.duration && !filter.operator}:{filter.duration}d{/if}
						</span>
					{/each}
				</div>
			{/if}

			{#if filterOptions.notSpecial.length > 0}
				<div class="filter-group">
					<small>NOT special filters:</small>
					{#each filterOptions.notSpecial as filter}
						<span class="filter-tag not-special">
							-{filter.type}
							{#if filter.value}:{filter.value}{/if}
							{#if filter.operator && filter.duration}{filter.operator}{filter.duration}d{/if}
							{#if filter.duration && !filter.operator}:{filter.duration}d{/if}
						</span>
					{/each}
				</div>
			{/if}

			{#if filterOptions.and.length > 0}
				<div class="filter-group">
					<small>AND terms:</small>
					{#each filterOptions.and as term}
						<span class="filter-tag and">{term}</span>
					{/each}
				</div>
			{/if}

			{#if filterOptions.or.length > 0}
				<div class="filter-group">
					<small>OR terms:</small>
					{#each filterOptions.or as term}
						<span class="filter-tag or">{term}</span>
					{/each}
				</div>
			{/if}

			{#if filterOptions.not.length > 0}
				<div class="filter-group">
					<small>NOT terms:</small>
					{#each filterOptions.not as term}
						<span class="filter-tag not">{term}</span>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<FilterHelp isOpen={showHelp} on:close={onCloseHelp} on:applyExample={onApplyExample} />

<style>
	.filter-container {
		margin-bottom: 1rem;
		width: 100%;
	}

	.search-input-wrapper {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.search-input-wrapper input {
		flex: 1;
		margin: 0;
	}

	.help-button {
		padding: 0.5rem;
		margin: 0;
		min-width: auto;
		width: auto;
		height: auto;
		background: var(--pico-secondary-background);
		border: 1px solid var(--pico-secondary-border);
		color: var(--pico-secondary);
		border-radius: var(--pico-border-radius);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.help-button:hover {
		background: var(--pico-secondary-hover-background);
		border-color: var(--pico-secondary-hover-border);
		color: var(--pico-secondary-hover);
		transform: translateY(-1px);
	}

	.help-button svg {
		width: 16px;
		height: 16px;
	}

	.filter-status {
		margin-top: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.filter-group small {
		font-size: 0.75rem;
		color: var(--pico-muted-color);
		font-weight: 500;
		min-width: fit-content;
	}

	.filter-tag {
		display: inline-block;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		line-height: 1.2;
	}

	.filter-tag.special {
		background-color: var(--pico-primary-background);
		color: var(--pico-primary);
		border: 1px solid var(--pico-primary-border);
	}

	.filter-tag.and {
		background-color: var(--pico-ins-color);
		color: white;
	}

	.filter-tag.or {
		background-color: var(--pico-secondary-background);
		color: var(--pico-secondary);
		border: 1px solid var(--pico-secondary-border);
	}

	.filter-tag.not {
		background-color: var(--pico-del-color);
		color: white;
	}

	.filter-tag.not-special {
		background-color: var(--pico-del-color);
		color: white;
		border: 1px solid var(--pico-del-color);
	}

	@media (max-width: 768px) {
		.search-input-wrapper {
			flex-direction: column;
		}

		.search-input-wrapper input {
			width: 100%;
		}

		.help-button {
			align-self: flex-end;
		}

		.filter-group {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
	}
</style>
