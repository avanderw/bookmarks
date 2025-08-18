<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let expanded = false;
	let isDragging = false;
	let dragCounter = 0;

	const dispatch = createEventDispatcher<{
		fileImported: File;
		exportRequested: void;
	}>();

	function toggleExpand() {
		expanded = !expanded;
	}

	// Component-local drag event handlers
	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragCounter++;
		if (dragCounter === 1) {
			isDragging = true;
		}
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragCounter--;
		if (dragCounter === 0) {
			isDragging = false;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		isDragging = false;
		dragCounter = 0;

		if (!e.dataTransfer?.files.length) {
			return;
		}

		if (e.dataTransfer.files.length > 1) {
			alert('Please drop only one file at a time');
			return;
		}

		const file = e.dataTransfer.files[0];
		dispatch('fileImported', file);
	}

	function handleImportClick() {
		const input = document.createElement('input');
		input.type = 'file';
		input.style.display = 'none';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				dispatch('fileImported', file);
			}
			document.body.removeChild(input);
		};
		document.body.appendChild(input);
		input.click();
	}

	function handleExportClick() {
		dispatch('exportRequested');
	}
</script>

<div class="file-manager" class:expanded class:dragging={isDragging}>
	<div
		class="header"
		role="button"
		tabindex="0"
		on:click={toggleExpand}
		on:keydown={(e) => e.key === 'Enter' && toggleExpand()}
		on:dragenter={handleDragEnter}
		on:dragleave={handleDragLeave}
		on:dragover={handleDragOver}
		on:drop={handleDrop}
	>
		<svg><use href="feather-sprite.svg#file" /></svg>
		<span>File Manager</span>
		<svg class="toggle-icon"
			><use href="feather-sprite.svg#{expanded ? 'chevron-down' : 'chevron-right'}" /></svg
		>
	</div>

	{#if expanded}
		<div class="content">
			<div
				class="drop-zone"
				class:active={isDragging}
				role="button"
				tabindex="0"
				on:dragenter={handleDragEnter}
				on:dragleave={handleDragLeave}
				on:dragover={handleDragOver}
				on:drop={handleDrop}
				on:click={handleImportClick}
				on:keydown={(e) => e.key === 'Enter' && handleImportClick()}
			>
				<svg><use href="feather-sprite.svg#upload" /></svg>
				<span>{isDragging ? 'Drop file here' : 'Click or drag file to import'}</span>
			</div>

			<button class="secondary" on:click={handleExportClick}>
				<svg><use href="feather-sprite.svg#download" /></svg> Export
			</button>
		</div>
	{/if}
</div>

<style>
	.file-manager {
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		margin-bottom: 1rem;
		overflow: hidden;
		background-color: var(--pico-card-background-color);
	}

	.header {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		cursor: pointer;
		font-weight: 500;
		gap: 0.5rem;
		transition: background-color 0.2s;
	}

	.header:hover {
		background-color: var(--pico-dropdown-background-color);
	}

	.toggle-icon {
		margin-left: auto;
	}

	.content {
		padding: 1rem;
		border-top: 1px solid var(--pico-muted-border-color);
	}

	.drop-zone {
		border: 2px dashed var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		padding: 1.5rem;
		text-align: center;
		margin-bottom: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		background-color: var(--pico-card-background-color);
	}

	.drop-zone.active {
		border-color: var(--pico-primary);
		background-color: var(--pico-primary-background);
		color: var(--pico-primary);
	}

	button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
		width: 100%;
	}

	svg {
		width: 1rem;
		height: 1rem;
	}
</style>
