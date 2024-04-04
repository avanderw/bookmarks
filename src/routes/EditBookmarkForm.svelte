<script lang="ts">
	import type { Bookmark } from '$lib/bookmarks';
	import { createEventDispatcher } from 'svelte';
	import { cacheStore } from '$lib/cache-store';

	const dispatch = createEventDispatcher();

	export let data: Bookmark;
    let tags = data.tags.join(' ');

	let errUrl = false;

	function save() {
		if (data.url === null || data.url === '') {
			errUrl = true;
			return;
		}
		if (data.title === '') {
			data.title = data.url;
		}
		data.tags = tags.split(' ').filter((tag) => tag !== '');
		$cacheStore = $cacheStore;
		close();
	}

	function close() {
		dispatch('close');
	}
</script>

<form on:submit={save} on:reset={close}>
	<h1><svg><use href="feather-sprite.svg#bookmark" /></svg> Edit bookmark</h1>
	<label for="url">URL</label>
	<input id="url" type="url" bind:value={data.url} class:error={errUrl} autofocus />

	<label for="title">Title (optional)</label>
	<input id="title" type="text" bind:value={data.title} />

	<label for="description">Description (optional)</label>
	<textarea id="description" bind:value={data.description} />

	<label for="tags">Tags (optional)</label>
	<input id="tags" type="text" bind:value={tags} />
	<p>Enter any number of tags separated by space and without the hash (#).</p>

	<label for="notes">Notes (optional)</label>
	<textarea id="notes" bind:value={data.notes} />
	<p>Additional notes, supports Markdown.</p>

	<div>
		<button type="submit">Save</button>
		<button type="reset">Nevermind</button>
	</div>
</form>

<style>
	h1 {
		font-size: 1.5rem;
		margin: 0;
	}
	label {
		font-size: 0.9rem;
		font-weight: bold;
	}
	input,
	textarea {
		border: 2px solid var(--border);
		border-radius: 0.25rem;
		padding: 0.25rem;
		width: 95%;
		margin: 0 auto;
	}
	input:focus,
	textarea:focus {
		outline: none;
		border: 2px solid var(--input-focus);
	}
	textarea {
		height: 5rem;
	}
	p {
		font-weight: 300;
		font-size: 0.75rem;
		margin: 0;
	}
	form {
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
		height: 600px;
		transform: translate(-50%, -50%);
	}
	form > div {
		margin-top: auto;
		display: flex;
		justify-content: space-between;
	}
	form > div > button {
		width: 48%;
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
	button[type='reset'] {
		background-color: var(--reset-background);
		color: var(--reset-text);
	}
	button[type='reset']:hover {
		background-color: var(--reset-hover);
	}
	button[type='reset']:active {
		background-color: var(--reset-active);
	}

	@keyframes shake {
		0% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-0.25rem);
		}
		50% {
			transform: translateX(0);
		}
		75% {
			transform: translateX(0.25rem);
		}
		100% {
			transform: translateX(0);
		}
	}
	.error {
		border-color: var(--error);
		animation: shake 0.2s ease-in-out 0s 2;
	}
</style>
