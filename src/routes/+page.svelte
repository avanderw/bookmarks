<script>
	import { getUrlParameter } from '$lib/url';
	import Bookmarklet from './Bookmarklet.svelte';
	import AddBookmarkForm from './AddBookmarkForm.svelte';
	import EditBookmarkForm from './EditBookmarkForm.svelte';
	import DebugStore from './DebugStore.svelte';
	import BookmarkList from './BookmarkList.svelte';

	let state = 'default';
	let selected = null;

	if (getUrlParameter('h') !== null) {
		state = 'add';
	}
</script>

<button on:click={() => (state = 'add')}
	><svg><use href="feather-sprite.svg#plus-square" /></svg></button
>

<h1>Bookmarks</h1>
<BookmarkList on:edit={(e) => {state = 'edit'; selected = e.detail}} />
<Bookmarklet />
{#if state === 'add'}
	<AddBookmarkForm on:close={() => (state = 'default')} />
{/if}
{#if state === 'edit'}
	<EditBookmarkForm on:close={() => (state = 'default')} data={selected} />
{/if}
<DebugStore />
