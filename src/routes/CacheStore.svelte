<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import {
		downloadCache,
		syncFile,
		unsyncFile,
		readFile,
		saveCache,
		syncStatus,
		refreshFromCache,
	} from '$lib/cache-store';

	async function uploadFile() {
		let fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.style.display = 'none';
		fileInput.addEventListener('change', async (e) => {
			const file = (e.target as HTMLInputElement).files?.item(0);
			if (!file) return;
			const reader = new FileReader();
			reader.onload = async (e) => {
				readFile(file);
				document.body.removeChild(fileInput);
			};
			reader.readAsText(file);
		});
		document.body.appendChild(fileInput);
		fileInput.click();
	}

	async function openFile() {
		await window
			// @ts-ignore
			.showOpenFilePicker({ multiple: false })
			.then(async (fh: FileSystemFileHandle[]) => {
				syncFile(fh[0]);
			})
			.catch((e: Error) => {
				console.error(e);
			});
	}

	function showDrag(e: DragEvent) {
		console.warn('Showing the visual for dragging not implemented!');
		e.preventDefault();
		e.stopPropagation();
	}

	function hideDrag() {
		console.warn('Hiding the visual for dragging not implemented!');
	}

	async function loadFile(e: DragEvent) {
		hideDrag();
		e.preventDefault();
		e.stopPropagation();

		if (e.dataTransfer!.files.length == 0) {
			console.warn('No files found to load!');
			return;
		}

		if (e.dataTransfer!.files.length > 1) {
			console.warn('Multiple file upload not supported! Warn the user not implemented!');
		}

		if ('showOpenFilePicker' in window) {
			// @ts-ignore
			syncFile(await e.dataTransfer!.items[0].getAsFileSystemHandle());
		} else {
			readFile(e.dataTransfer!.items[0].getAsFile()!);
		}
	}

	onMount(() => {
		if (!browser) {
			return;
		}
		window.addEventListener('dragover', showDrag);
		window.addEventListener('dragleave', hideDrag);
		window.addEventListener('drop', loadFile);
		document.addEventListener('visibilitychange', refreshFromCache);
	});
	onDestroy(() => {
		if (!browser) {
			return;
		}
		window.removeEventListener('dragover', showDrag);
		window.removeEventListener('dragleave', hideDrag);
		window.removeEventListener('drop', loadFile);
		document.removeEventListener('visibilitychange', refreshFromCache);
	});
</script>

<button on:click={openFile} disabled={!$syncStatus.available}>Open</button>
<button on:click={saveCache} disabled={!($syncStatus.running && $syncStatus.changes)}>Save</button>
<button on:click={unsyncFile} disabled={!$syncStatus.running}>Close</button>
<button on:click={uploadFile}>Upload</button>
<button on:click={downloadCache}>Download</button>
