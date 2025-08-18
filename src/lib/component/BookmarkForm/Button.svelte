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
	export let existingBookmarks: Bookmark[] = [];

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

<button class={buttonClass} on:click={openForm} title={buttonText}>
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

<BookmarkForm.View bind:isOpen={isFormOpen} {bookmark} {isEdit} {existingBookmarks} on:save={handleSave} />

<style>
	button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	svg {
		width: 1rem;
		height: 1rem;
	}
</style>
