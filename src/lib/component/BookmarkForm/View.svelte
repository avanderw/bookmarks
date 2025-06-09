<script lang="ts">
	import type { Bookmark } from '$lib/bookmarks';
	import { createEventDispatcher } from 'svelte';
	import { createEmptyBookmark, validateBookmark, prepareBookmarkForSave } from './Logic';

	const dispatch = createEventDispatcher<{
		save: Bookmark;
		close: void;
	}>();

	// Props
	export let bookmark: Bookmark | null = null;
	export let isEdit: boolean = false;

	// Initialize bookmark data
	let formData = bookmark ? { ...bookmark } : createEmptyBookmark();
	let tagsString = formData.tags.join(' ');
	
	// Error state
	let urlError = false;
	let urlErrorMessage = '';

	// Form modal state
	export let isOpen = false;

	function handleSubmit() {
		// Validate bookmark (simple validation without duplicate check)
		const validation = validateBookmark(formData);
		
		if (validation.urlError) {
			urlError = true;
			urlErrorMessage = validation.urlErrorMessage;
			return;
		}

		// Prepare bookmark for saving
		const preparedBookmark = prepareBookmarkForSave(formData, tagsString);
		
		// Dispatch save event with prepared bookmark
		dispatch('save', preparedBookmark);
		
		// Close the form
		isOpen = false;
	}

	function handleClose() {
		isOpen = false;
		dispatch('close');
	}
</script>

{#if isOpen}
	<div class="modal-overlay" on:click|self={handleClose}>
		<form on:submit|preventDefault={handleSubmit} on:reset|preventDefault={handleClose} class="bookmark-form">
			<h1>
				<svg><use href="feather-sprite.svg#bookmark" /></svg>
				{isEdit ? 'Edit' : 'New'} bookmark
			</h1>
			
			<label for="url">URL</label>
			<input 
				id="url" 
				type="url" 
				bind:value={formData.url} 
				class:error={urlError} 
				disabled={isEdit}
				autofocus
			/>
			{#if urlError}
				<p class="error-message">{urlErrorMessage}</p>
			{/if}

			<label for="title">Title (optional)</label>
			<input id="title" type="text" bind:value={formData.title} />

			<label for="description">Description (optional)</label>
			<textarea id="description" bind:value={formData.description} />

			<label for="tags">Tags (optional)</label>
			<input id="tags" type="text" bind:value={tagsString} />
			<p class="help-text">
				Enter any number of tags separated by space and without the hash (#).
			</p>

			<label for="notes">Notes (optional)</label>
			<textarea id="notes" bind:value={formData.notes} />
			<p class="help-text">Additional notes, supports Markdown.</p>

			<div class="button-group">
				<button type="submit">Save</button>
				<button type="reset">Cancel</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.bookmark-form {
		background-color: var(--panel, white);
		border: 1px solid var(--border, #ccc);
		padding: 1rem;
		border-radius: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 320px;
		max-height: 80vh;
		overflow-y: auto;
	}

	h1 {
		font-size: 1.5rem;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	label {
		font-size: 0.9rem;
		font-weight: bold;
		margin-top: 0.5rem;
	}
	
	input,
	textarea {
		border: 2px solid var(--border, #ccc);
		border-radius: 0.25rem;
		padding: 0.25rem;
		width: 95%;
		margin: 0 auto;
	}
	
	input:focus,
	textarea:focus {
		outline: none;
		border: 2px solid var(--input-focus, #0366d6);
	}
	
	textarea {
		height: 5rem;
		resize: vertical;
	}
	
	.help-text {
		font-weight: 300;
		font-size: 0.75rem;
		margin: 0;
		color: var(--text-muted, #6a737d);
	}
	
	.error-message {
		color: var(--error, red);
		font-size: 0.75rem;
		margin: 0;
	}
	
	.button-group {
		margin-top: 1rem;
		display: flex;
		justify-content: space-between;
	}
	
	.button-group > button {
		width: 48%;
	}
	
	button {
		border: 1px solid var(--button-border, #ccc);
		border-radius: 0.25rem;
		padding: 0.5rem;
		font-size: 0.9rem;
		font-weight: bold;
		cursor: pointer;
	}
	
	button[type='submit'] {
		background-color: var(--submit-background, #0366d6);
		color: var(--submit-text, white);
	}
	
	button[type='submit']:hover {
		background-color: var(--submit-hover, #0257ba);
	}
	
	button[type='submit']:active {
		background-color: var(--submit-active, #014899);
	}
	
	button[type='reset'] {
		background-color: var(--reset-background, #f6f8fa);
		color: var(--reset-text, #24292e);
	}
	
	button[type='reset']:hover {
		background-color: var(--reset-hover, #e1e4e8);
	}
	
	button[type='reset']:active {
		background-color: var(--reset-active, #d1d5da);
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
		border-color: var(--error, red);
		animation: shake 0.2s ease-in-out 0s 2;
	}
</style>