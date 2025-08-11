<script lang="ts">
	import type { Bookmark } from '$lib/bookmarks';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

	export let data: Bookmark;
</script>

<dialog open>
	<article>
		<header>
			<button aria-label="Close" rel="prev" on:click={() => dispatch('close')}></button>
			<h3>Notes</h3>
		</header>
		{#if data && data.notes}
			<pre>{data.notes}</pre>
		{:else}
			<p>No notes for this bookmark.</p>
		{/if}
		<footer>
			<button on:click={() => dispatch('close')}>Close</button>
		</footer>
	</article>
</dialog>

<style>
	dialog {
		z-index: 1000;
	}
	
	h3 {
		margin: 0;
	}
	
	pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
		font-family: inherit;
		font-size: 0.875rem;
		max-height: 60vh;
		overflow-y: auto;
	}
</style>
