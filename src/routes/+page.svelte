<script lang="ts">
	import type { Bookmark } from '$lib/bookmarks';
	import { getUrlParameter } from '$lib/url';
	import Bookmarklet from './Bookmarklet.svelte';
	import AddBookmarkForm from './AddBookmarkForm.svelte';
	import EditBookmarkForm from './EditBookmarkForm.svelte';
	import BookmarkList from './BookmarkList.svelte';
	import Notes from './Notes.svelte';
	import Feedback from './Feedback.svelte';
	import ReloadOnVisibility from './ReloadOnVisibility.svelte';

	let state = 'default';
	let selected: Bookmark;

	if (getUrlParameter('h') !== null) {
		state = 'add';
	}
</script>

<svelte:head>
	<title>Bookmarks</title>
</svelte:head>

<div>
	<a href="https://avanderw.co.za"><svg><use href="feather-sprite.svg#home" /></svg>My homepage</a>
	<a href="https://github.com/avanderw/bookmarks"><svg><use href="feather-sprite.svg#github" /></svg>Repo</a>
	<Bookmarklet />
	<button on:click={() => (state = 'add')}>
		<svg><use href="feather-sprite.svg#bookmark" /></svg> <span>Add Bookmark</span>
	</button>
	<a href="#"><svg><use href="feather-sprite.svg#help-circle" /></svg>Help</a>
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
<Feedback />
<ReloadOnVisibility />

<div>
<a href="https://avanderw.tplinkdns.com:31024/avanderw.co.za"><svg><use href="feather-sprite.svg#bar-chart-2" /></svg>Analytics</a>
</div>

<style>
	a {
		display: inline-flex;
		gap: 0.5rem;
	}
	div {
		display: flex;
		align-items: center;
		justify-content: right;
		gap: 2rem;
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
