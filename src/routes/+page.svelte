<script lang="ts">
	import type { Bookmark } from '$lib/bookmarks';
	import { getUrlParameter } from '$lib/url';
	import Bookmarklet from './Bookmarklet.svelte';
	import AddBookmarkForm from './AddBookmarkForm.svelte';
	import EditBookmarkForm from './EditBookmarkForm.svelte';
	import DebugStore from './DebugStore.svelte';
	import BookmarkList from './BookmarkList.svelte';
	import Notes from './Notes.svelte';

	let state = 'default';
	let selected: Bookmark;

	if (getUrlParameter('h') !== null) {
		state = 'add';
	}
</script>

<div>
	<Bookmarklet />
	<button on:click={() => (state = 'add')}>
		<svg><use href="feather-sprite.svg#plus-circle" /></svg> <span>Add Bookmark</span>
	</button>
</div>

<BookmarkList
	on:edit={(e) => {
		state = 'edit';
		selected = e.detail;
	}}
	on:notes={(e) => {
		state = 'notes';
		selected = e.detail;
	}}
	on:click={(e) => {
		state = 'default';
	}}
/>
{#if state === 'add'}
	<AddBookmarkForm on:close={() => (state = 'default')} />
{/if}
{#if state === 'edit'}
	<EditBookmarkForm on:close={() => (state = 'default')} data={selected} />
{/if}
{#if state === 'notes'}
	<Notes on:close={() => (state = 'default')} data={selected} />
{/if}

<style>
	div {
		display: flex;
		align-items: center;
		justify-content: right;
		gap: 0.5rem;
	}
	button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		border: none;
		background-color: var(--reset-background);
		color: var(--reset-text);
		font-weight: 300;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		margin: 0.5rem 0;
		cursor: pointer;
	}
</style>
