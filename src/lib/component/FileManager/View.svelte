<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { downloadCache, readFile } from '$lib/cache-store';

	let expanded = false;
	let isDragging = false;
	let dragCounter = 0;
	let previousExpandedState = false; // Store previous state

	function toggleExpand() {
		expanded = !expanded;
	}

	// Existing drag event handlers
	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragCounter++;
		if (dragCounter === 1) {
			isDragging = true;
			// Store current expanded state and auto-expand
			previousExpandedState = expanded;
			expanded = true;
		}
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragCounter--;
		if (dragCounter === 0) {
			isDragging = false;
			// Restore previous expanded state when dragging ends without drop
			expanded = previousExpandedState;
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
			// Restore previous state when no files are dropped
			expanded = previousExpandedState;
			return;
		}

		if (e.dataTransfer.files.length > 1) {
			alert('Please drop only one file at a time');
			// Restore previous state on error
			expanded = previousExpandedState;
			return;
		}

		const file = e.dataTransfer.files[0];
		await readFile(file);

		// Close the panel after successful file drop (after a brief delay)
		setTimeout(() => {
			expanded = previousExpandedState;
		}, 500); // Half-second delay to show the success state
	}

	function handleImportClick() {
		const input = document.createElement('input');
		input.type = 'file';
		input.style.display = 'none';
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				readFile(file);
			}
			document.body.removeChild(input);
		};
		document.body.appendChild(input);
		input.click();
	}

	onMount(() => {
		if (!browser) return;

		window.addEventListener('dragenter', handleDragEnter);
		window.addEventListener('dragleave', handleDragLeave);
		window.addEventListener('dragover', handleDragOver);
		window.addEventListener('drop', handleDrop);
	});

	onDestroy(() => {
		if (!browser) return;

		window.removeEventListener('dragenter', handleDragEnter);
		window.removeEventListener('dragleave', handleDragLeave);
		window.removeEventListener('dragover', handleDragOver);
		window.removeEventListener('drop', handleDrop);
	});
</script>

<div class="file-manager {expanded ? 'expanded' : 'collapsed'} {isDragging ? 'dragging' : ''}">
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

			<button class="btn export" on:click={downloadCache}>
				<svg><use href="feather-sprite.svg#download" /></svg> Export
			</button>
		</div>
	{/if}
</div>

<style>
	.file-manager {
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		overflow: hidden;
		background-color: var(--panel);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.header {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		cursor: pointer;
		font-weight: 500;
		gap: 0.5rem;
	}

	.header:hover {
		background-color: var(--bg-hover);
	}

	.toggle-icon {
		margin-left: auto;
	}

	.content {
		padding: 1rem;
		border-top: 1px solid var(--border);
	}

	.drop-zone {
		border: 2px dashed var(--border);
		border-radius: 0.5rem;
		padding: 1.5rem;
		text-align: center;
		margin-bottom: 1rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.file-manager.dragging .drop-zone {
		border-color: var(--primary);
		background-color: rgba(67, 97, 238, 0.1);
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		font-weight: 500;
		border: none;
		cursor: pointer;
		flex: 1;
		justify-content: center;
	}

	.export {
		background-color: var(--primary);
		color: var(--neutral-white);
	}

	svg {
		width: 1rem;
		height: 1rem;
	}

	.toggle-icon {
		margin-left: auto;
	}
</style>
