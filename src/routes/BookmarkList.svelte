<script>
	import { appData } from '$lib/bookmarks';
	import { friendly } from '$lib/time';
    import {createEventDispatcher} from "svelte";

    const dispatch = createEventDispatcher();

	$: viewData = $appData.bookmarks;
</script>

<ol>
	{#each viewData as bookmark}
		<li title={bookmark.description}>
			<div>
				<a href={bookmark.url}>{bookmark.title}</a>
				<button class="muted">({bookmark.url.replace(/^https?:\/\/([^\/]+).*$/, '$1')})</button>
			</div>
			<div>
				{#if bookmark.tags.length > 0}
					{#each bookmark.tags as tag}
						<button class="tag">#{tag}</button>
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
                <span>used {bookmark.clicked} times</span>
                <span>added {friendly(bookmark.added)}</span>
                <span>last used {bookmark.last}</span> |
				<button on:click={()=>dispatch('edit', bookmark)}><svg><use href="feather-sprite.svg#edit" /></svg> Edit</button>
				<button><svg><use href="feather-sprite.svg#trash" /></svg> Delete</button>
				{#if bookmark.notes}
					| <button><svg><use href="feather-sprite.svg#file-text" /></svg> Notes</button>
				{/if}
			</div>
		</li>
	{/each}
</ol>

<style>
	div {
		display: flex;
		align-items: center;
		gap: 0.5em;
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
	a {
		max-width: 375px;
		display: inline-block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	span {
		max-width: 375px;
		display: inline-block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tag {
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
