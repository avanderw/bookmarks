<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Bookmark } from '$lib/bookmarks';
	import { BookmarkForm } from '$lib/component/BookmarkForm';

	// Props
	export let bookmark: Bookmark | null = null;
	export let isEdit: boolean = false;
	export let buttonText: string = isEdit ? 'Edit Bookmark' : 'Add Bookmark';
	export let buttonClass: string = '';
	export let iconOnly: boolean = false;

	// State
	let isFormOpen = false;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		save: Bookmark;
	}>();

	// Event handlers
	function handleSave(event: CustomEvent<Bookmark>) {
		// Forward the save event to parent components
		dispatch('save', event.detail);
	}

	function openForm() {
		isFormOpen = true;
	}
</script>

<button
	class={`bookmark-form-button ${buttonClass}`}
	on:click={openForm}
	title={buttonText}
>
	{#if iconOnly}
		<svg>
			<use href="feather-sprite.svg#{isEdit ? 'edit' : 'plus'}" />
		</svg>
	{:else}
		<svg>
			<use href="feather-sprite.svg#{isEdit ? 'edit' : 'plus'}" />
		</svg>
		{buttonText}
	{/if}
</button>

<BookmarkForm.View
	bind:isOpen={isFormOpen}
	{bookmark}
	{isEdit}
	on:save={handleSave}
/>

<style>
	.bookmark-form-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: var(--submit-background, #0366d6);
		color: var(--submit-text, white);
		border: 1px solid var(--button-border, transparent);
		border-radius: 0.25rem;
		font-size: 0.9rem;
		font-weight: bold;
		cursor: pointer;
	}

	.bookmark-form-button:hover {
		background-color: var(--submit-hover, #0257ba);
	}

	.bookmark-form-button:active {
		background-color: var(--submit-active, #014899);
	}

	svg {
		width: 1rem;
		height: 1rem;
	}
</style>