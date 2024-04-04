<script lang="ts">
	import type { CacheStore, Bookmark } from '$lib/index';
	import { cacheStore } from '$lib/cache-store';
	import { friendly } from '$lib/time';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let andFilter: string, notFilter: string, orFilter: string;
	$: cacheView = buildView($cacheStore, andFilter, notFilter, orFilter);

	function buildView(store: CacheStore, andFilter: string, notFilter: string, orFilter: string) {
		return store.bookmarks;
	}

	function preload() {
		$cacheStore.bookmarks.push({
			url: '',
			title: 'xkcd.com',
			description: 'description',
			tags: ['comic'],
			notes: 'preloaded',
			added: new Date(),
			clicked: 0,
			last: null
		});
		$cacheStore = $cacheStore;
	}

	function handleClick(bookmark: Bookmark) {
		bookmark.clicked++;
		bookmark.last = new Date();
		$cacheStore = $cacheStore;
	}

	function deleteBookmark(bookmark: Bookmark) {
		$cacheStore.bookmarks = $cacheStore.bookmarks.filter((b) => b.url !== bookmark.url);
	}

	function toggleTag(tag: string) {
		console.log('cycle between, andFilter, notFilter, empty');
	}
</script>

<div class="container">
	<div class="header">
		<h1><svg><use href="feather-sprite.svg#bookmark" /></svg> Bookmarks</h1>

		<button on:click={() => dispatch('add')}>Add</button>
	</div>
	{#if cacheView.length === 0}
		<p>There are no bookmarks.</p>
		<h2>Getting started</h2>
		<ul>
			<li>The quickest is to <a href="#" on:click={preload}>pre-load web comics</a>.</li>
			<li>The hardest is to manually <a href="#">add a new bookmark</a>.</li>
			<li>The easiest is to use the <a href="#">bookmarklet</a> when browsing the web.</li>
		</ul>
	{:else}
		<ol>
			{#each cacheView as bookmark}
				<li title={bookmark.description}>
					<div>
						<a
							href={bookmark.url}
							on:click={() => handleClick(bookmark)}
							on:auxclick={() => handleClick(bookmark)}>{bookmark.title}</a
						>
						<span class="muted">added {friendly(bookmark.added)}</span>
						{#if bookmark.url !== null && bookmark.url.length > 0}
							<button class="muted">
								({bookmark.url.replace(/^https?:\/\/([^\/]+).*$/, '$1')})
							</button>
						{/if}
					</div>
					<div>
						{#if bookmark.tags.length > 0}
							{#each bookmark.tags as tag}
								<button on:click={() => toggleTag(tag)} class="tag">#{tag}</button>
							{/each}
							{#if bookmark.description}
								<span>|</span>
							{/if}
						{/if}
						{#if bookmark.description}
							<span>{bookmark.description}</span>
						{/if}
					</div>
					<div class="muted">
						{#if bookmark.clicked > 0}
							<span>43 points</span>
							<span>with {bookmark.clicked} clicks</span>
							<span>and last {friendly(bookmark.last)}</span>
						{:else}
							<span>Never been used</span>
						{/if}
						|
						<button on:click={() => dispatch('edit', bookmark)}
							><svg><use href="feather-sprite.svg#edit" /></svg> Edit</button
						>
						<button on:click={() => deleteBookmark(bookmark)}
							><svg><use href="feather-sprite.svg#trash" /></svg> Delete</button
						>
						{#if bookmark.notes}
							| <button on:click={() => dispatch('notes', bookmark)}
								><svg><use href="feather-sprite.svg#file-text" /></svg> Notes</button
							>
						{/if}
					</div>
				</li>
			{/each}
		</ol>
	{/if}
</div>

<style>
	h1 {
		display: inline-block;
		font-size: 1.5rem;
		margin: 0 0 0.5rem 0;
	}
	div {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	div.container {
		display: block;
		width: 100%;
		margin-top: 1rem;
	}
	div.header {
		display: block;
		border-bottom: 1px solid var(--border);
		gap: 1rem;
	}
	ol {
		padding: 0 1rem;
	}
	li {
		padding: 0.25rem 0;
	}
	li button {
		border: none;
		background: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		color: inherit;
	}
	li button svg {
		width: 1.2em;
		height: 1.2em;
		stroke: var(--text-muted);
	}
	a,
	span,
	button {
		display: inline-block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	input {
		border: 2px solid var(--border);
		border-radius: 0.25rem;
		padding: 0.25rem;
		margin: 0 auto;
		width: 33%;
		float: right;
	}
	input:focus {
		outline: none;
		border: 2px solid var(--input-focus);
	}
	.tag {
		overflow: initial;
		background-color: var(--tag);
		color: var(--tag-text);
		border-radius: 0.25rem;
		padding: 0.15rem;
		margin: 0.1rem 0;
		border: none;
	}
	.muted {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
</style>
