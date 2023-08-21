<script>
	import AddBookmark from './AddBookmark.svelte';
	import Bookmarks from './Bookmarks.svelte';
	import Filter from './Filter.svelte';

	import { filters } from '$lib/stores';
	import ClearFilter from './ClearFilter.svelte';
</script>

<AddBookmark /><ClearFilter />
<Bookmarks />

{#if $filters.length > 0}
	{#each $filters as filter}
		<Filter model={filter} />
	{/each}
{/if}
