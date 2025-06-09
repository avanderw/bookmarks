<!-- src/lib/component/Bookmarklet/View.svelte -->
<script lang="ts">
	import { createBookmarkletCode } from './Logic';
	
	// Optional props for customization
	export let linkText = 'Bookmark This Site';
	export let instructionText = 'Drag this link to your bookmarks bar to quickly save websites to your bookmark collection.';
</script>

<div class="bookmarklet-container">
	<a 
		href={`javascript:${createBookmarkletCode()}`} 
		title="Drag this link to your bookmark bar"
		class="bookmarklet-link"
	>
		{linkText}
	</a>
	<p class="bookmarklet-instruction">
		{instructionText}
	</p>
</div>

<style>
	.bookmarklet-container {
		margin: 1rem 0;
		padding: 1rem;
		border: 1px dashed var(--border, #ccc);
		border-radius: 0.5rem;
		background-color: var(--bg-card, #f8f9fa);
		text-align: center;
	}
	
	.bookmarklet-link {
		display: inline-block;
		padding: 0.5rem 1rem;
		background-color: var(--primary, #0366d6);
		color: var(--text-contrast, white);
		border-radius: 0.25rem;
		font-weight: bold;
		text-decoration: none;
		cursor: move; /* Indicates it's draggable */
	}
	
	.bookmarklet-link:hover {
		background-color: var(--primary-dark, #0257ba);
	}
	
	.bookmarklet-instruction {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		color: var(--text-secondary, #6a737d);
	}
</style>