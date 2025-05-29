<script lang="ts">
	import type { Bookmark } from '$lib/bookmarks';
	import { getUrlParameter } from '$lib/url';
	import AddBookmarkForm from './AddBookmarkForm.svelte';
	import EditBookmarkForm from './EditBookmarkForm.svelte';
	import Notes from './Notes.svelte';
	import CacheStore from './FileManager.svelte';
	import CacheView from './CacheView.svelte';

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
	<a href="https://github.com/avanderw/bookmarks">
		<svg><use href="feather-sprite.svg#github" /></svg>
		Repo
	</a>
	<a href="#"><svg><use href="feather-sprite.svg#help-circle" /></svg>Help</a>
	<a href="https://tracking.avanderw.co.za/avanderw.co.za">
		<svg><use href="feather-sprite.svg#bar-chart-2" /></svg>
		Analytics
	</a>
</div>

{#if state === 'add'}
	<AddBookmarkForm on:close={() => (state = 'default')} />
{/if}
{#if state === 'edit'}
	<EditBookmarkForm on:close={() => (state = 'default')} data={selected} />
{/if}
{#if state === 'notes'}
	<Notes on:close={() => (state = 'default')} data={selected} />
{/if}

<CacheStore />
<CacheView
	on:add={(e) => {
		state = 'add';
	}}
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
</style>
