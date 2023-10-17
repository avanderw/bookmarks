<script lang="ts">
	import type { Bookmark } from '$lib/bookmarks';
	import { appData } from '$lib/bookmarks';
	import { friendly } from '$lib/time';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let search = '';
	$: viewData = filter($appData.bookmarks, search);

	function filter(bookmarks: Bookmark[], search: string) {
		if (search === '') {
			return bookmarks;
		}

		const terms = search
			.toLocaleLowerCase()
			.split(' ')
			.filter((t) => t !== '' && !t.startsWith('#'));
		const tags = search
			.toLocaleLowerCase()
			.split(' ')
			.filter((t) => t.startsWith('#'))
			.map((t) => t.slice(1));
		return bookmarks.filter((b) => {
			const title = b.title?.toLowerCase();
			const desc = b.description?.toLowerCase();

			let incl = true;
			if (terms.length > 0) {
				incl = terms.some((t) => title?.includes(t) || desc?.includes(t));
			}
			if (tags.length > 0) {
				incl = incl && tags.every((t) => b.tags.includes(t));
			}

			return incl;
		});
	}

	function deleteBookmark(bookmark: Bookmark) {
		$appData.bookmarks = $appData.bookmarks.filter((b) => b.url !== bookmark.url);
	}

	function toggleTag(tag: string) {
		if (search.includes('#' + tag)) {
			search = search.replace('#' + tag, '').trim();
		} else {
			if (search !== '') search += ' ';
			search += '#' + tag;
		}
	}
</script>

<div class="container">
	<div class="header">
		<h1><svg><use href="feather-sprite.svg#bookmark" /></svg> Bookmarks</h1>
		<input type="text" placeholder="Search for words or #tags" bind:value={search} />
	</div>
	<ol>
		{#each viewData as bookmark}
			<li title={bookmark.description}>
				<div>
					<a href={bookmark.url}>{bookmark.title}</a>
					<span class="muted">added {friendly(bookmark.added)}</span>
					<button class="muted">({bookmark.url.replace(/^https?:\/\/([^\/]+).*$/, '$1')})</button>
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
					<span>43 points</span>
					<span>with {bookmark.clicked} clicks</span>
					<span>and last {bookmark.last === null ? 'never' : bookmark.last}</span>
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
        float:right;
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
