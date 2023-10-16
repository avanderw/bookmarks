<script>
	// @ts-nocheck

	import { bookmarks } from '$lib/stores';

	export let id;

	let state = 'idle';
	let value = '';

	function addTag() {
		if (state === 'idle') {
			state = 'adding';
		} else {
			updateStore();
			state = 'idle';
			value = '';
		}
	}

	function updateStore() {
		const bookmark = $bookmarks.find((b) => b.id === id);
		if (!bookmark.tags) {
			bookmark.tags = [];
		}

		bookmark.tags = [...bookmark.tags, value];

		$bookmarks = $bookmarks;
	}
</script>

<form on:submit={addTag}>
	{#if state !== 'idle'}
		<!-- svelte-ignore a11y-autofocus -->
		<input type="text" bind:value autofocus />
	{/if}
	<button type="submit"><i class="bi bi-tag-fill" /></button>
</form>

{#if id === undefined}
	<span style="color:#cc0000">!AddTag:id</span>
{/if}

<style>
	form {
		display: inline;
	}
	form::before {
		content: ' | ';
	}
	button {
		background: none;
		color: #5e503f;
		border: none;
		padding: 0;
		font: inherit;
		font-size: smaller;
		cursor: pointer;
		outline: inherit;
	}
	button:hover {
		font-weight: normal;
		text-decoration: underline;
	}
</style>
