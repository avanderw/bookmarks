<script lang="ts">
	import { BookmarkManager } from '$lib/component/BookmarkManager';
	import { browser } from '$app/environment';
	import { appData } from '$lib/bookmarks';
	import { onMount } from 'svelte';
	import type { BookmarkStore } from '$lib/bookmarks';

	let bookmarkData: BookmarkStore | null = null;

	// Initialize data from the store
	onMount(() => {
		if (browser) {
			// Subscribe to the store to get current data
			const unsubscribe = appData.subscribe((data) => {
				bookmarkData = data;
			});

			// Set up storage full export handler
			const handleStorageFullExport = () => {
				// This will trigger the BookmarkManager's export functionality
				const exportEvent = new CustomEvent('trigger-export');
				window.dispatchEvent(exportEvent);
			};
			
			window.addEventListener('storage-full-export', handleStorageFullExport);
			
			return () => {
				unsubscribe();
				window.removeEventListener('storage-full-export', handleStorageFullExport);
			};
		}
	});

	// Handle data changes from BookmarkManager
	function handleDataChanged(event: CustomEvent<any[]>) {
		console.log('� Updating store with', event.detail.length, 'bookmarks');
		if (bookmarkData) {
			const newData = {
				...bookmarkData,
				bookmarks: event.detail
			};
			appData.set(newData);
		}
	}

	// Handle bookmark clicks
	function handleBookmarkClicked(event: CustomEvent<any>) {
		// The BookmarkManager already updates the bookmark, just need to sync to store
		if (bookmarkData) {
			const updatedBookmarks = bookmarkData.bookmarks.map(b => 
				b.url === event.detail.url ? event.detail : b
			);
			appData.set({
				...bookmarkData,
				bookmarks: updatedBookmarks
			});
		}
	}

	// Theme switcher
	function toggleTheme() {
		if (browser) {
			const html = document.documentElement;
			const currentTheme = html.getAttribute('data-theme');
			const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
			html.setAttribute('data-theme', newTheme);
			localStorage.setItem('theme', newTheme);
		}
	}

	// Initialize theme from localStorage or system preference
	if (browser) {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme) {
			document.documentElement.setAttribute('data-theme', savedTheme);
		}
	}
</script>

<svelte:head>
	<title>Bookmarks</title>
</svelte:head>

{#if bookmarkData}
	<BookmarkManager 
		initialData={bookmarkData}
		on:dataChanged={handleDataChanged}
		on:bookmarkClicked={handleBookmarkClicked}
	/>
{:else}
	<div class="loading">
		<p>Loading bookmarks...</p>
	</div>
{/if}

<nav>
	<ul>
		<li><a href="https://avanderw.co.za"><svg><use href="feather-sprite.svg#home" /></svg>My homepage</a></li>
		<li><a href="https://github.com/avanderw/bookmarks">
			<svg><use href="feather-sprite.svg#github" /></svg>
			Repo
		</a></li>
		<li><a href="https://github.com/avanderw/bookmarks/blob/main/README.md">
			<svg><use href="feather-sprite.svg#help-circle" /></svg>
			Help
		</a></li>
		<li><a href="https://tracking.avanderw.co.za/avanderw.co.za">
			<svg><use href="feather-sprite.svg#bar-chart-2" /></svg>
			Analytics
		</a></li>
		<li>
			<button class="secondary btn-compact" on:click={toggleTheme} title="Toggle theme">
				<svg><use href="feather-sprite.svg#sun" /></svg>
				Theme
			</button>
		</li>
	</ul>
</nav>


<style>
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 200px;
		color: var(--pico-muted-color);
	}

	nav ul {
		justify-content: center;
		margin: 1rem 0;
	}
	
	nav a {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
	}
	
	nav a:hover {
		text-decoration: underline;
	}

	nav button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
	}
</style>
