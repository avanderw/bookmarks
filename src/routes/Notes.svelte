<script lang="ts">
	import type { Bookmark } from '$lib/bookmarks';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

	export let data: Bookmark;
</script>

<div>
	<h1>Notes</h1>
	{#if data && data.notes}
		<pre>{data.notes}</pre>
	{:else}
		<p>No notes for this bookmark.</p>
	{/if}
	<button type="submit" on:click={() => dispatch('close')}>Close</button>
</div>

<style>
    h1 {
        margin: 0;
        font-size: 1.5rem;
        border-bottom: 1px solid var(--border);
    }
	div {
		background-color: var(--panel);
		border: 1px solid var(--border);
		padding: 1rem;
		border-radius: 1rem;
		position: fixed;
		top: 50%;
		left: 50%;
		margin: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 320px;
		transform: translate(-50%, -50%);
	}
    pre {
        overflow: hidden;
        text-overflow: ellipsis;
        max-height: 400px;
    }
	button {
		border: 1px solid var(--button-border);
		border-radius: 0.25rem;
		padding: 0.25rem;
		font-size: 0.9rem;
		font-weight: bold;
	}
	button[type='submit'] {
		background-color: var(--submit-background);
		color: var(--submit-text);
	}
	button[type='submit']:hover {
		background-color: var(--submit-hover);
	}
	button[type='submit']:active {
		background-color: var(--submit-active);
	}
</style>
