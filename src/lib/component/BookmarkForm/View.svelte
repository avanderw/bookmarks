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
	<dialog open>
		<article>
			<header>
				<button aria-label="Close" rel="prev" on:click={handleClose}></button>
				<h3>
					<svg><use href="feather-sprite.svg#bookmark" /></svg>
					{isEdit ? 'Edit' : 'New'} bookmark
				</h3>
			</header>
			
			<form on:submit|preventDefault={handleSubmit}>
				<fieldset>
					<label>
						URL
						<input 
							type="url" 
							bind:value={formData.url} 
							aria-invalid={urlError}
							disabled={isEdit}
							autofocus
							required
						/>
						{#if urlError}
							<small>{urlErrorMessage}</small>
						{/if}
					</label>

					<label>
						Title (optional)
						<input type="text" bind:value={formData.title} />
					</label>

					<label>
						Description (optional)
						<textarea bind:value={formData.description}></textarea>
					</label>

					<label>
						Tags (optional)
						<input type="text" bind:value={tagsString} />
						<small>Enter any number of tags separated by space and without the hash (#).</small>
					</label>

					<label>
						Notes (optional)
						<textarea bind:value={formData.notes}></textarea>
						<small>Additional notes, supports Markdown.</small>
					</label>
				</fieldset>
			</form>

			<footer>
				<button class="secondary" on:click={handleClose}>Cancel</button>
				<button on:click={handleSubmit}>Save</button>
			</footer>
		</article>
	</dialog>
{/if}

<style>
	dialog {
		z-index: 1000;
	}
	
	h3 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
	}
	
	textarea {
		min-height: 5rem;
		resize: vertical;
	}
	
	footer {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	
	footer button {
		flex: 1;
		margin: 0;
	}
</style>