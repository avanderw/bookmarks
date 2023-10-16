<script>
	import AddBookmark from './AddBookmark.svelte';
	import Bookmarks from './Bookmarks.svelte';
	import Filter from './Filter.svelte';

	import { filters } from '$lib/stores';
	import ClearFilter from './ClearFilter.svelte';
	import Bookmarklet from './Bookmarklet.svelte';
	import AddBookmarkForm from './AddBookmarkForm.svelte';
	import DebugStore from './DebugStore.svelte';

	let state = 'add';
</script>

<AddBookmark /><ClearFilter />
<Bookmarks />

{#if $filters.length > 0}
	{#each $filters as filter}
		<Filter model={filter} />
	{/each}
{/if}

<Bookmarklet />
{#if state === 'add'}
	<AddBookmarkForm on:close={() => (state = 'default')} />
{/if}
<DebugStore />