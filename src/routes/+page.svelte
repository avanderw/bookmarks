<script lang="ts">
	import { BookmarkManager } from '$lib/component/BookmarkManager';
	import { BookmarkForm } from '$lib/component/BookmarkForm';
	import { CacheRefreshNotification } from '$lib/component/CacheRefreshNotification';
	import { browser } from '$app/environment';
	import { appData, markDataAsUnsaved } from '$lib/bookmarks';
	import { onMount } from 'svelte';
	import { getUrlParameter } from '$lib/url';
	import type { BookmarkStore, Bookmark } from '$lib/bookmarks';

	let bookmarkData: BookmarkStore | null = null;
	let isBookmarkletMode = false;
	let bookmarkFormOpen = false;

	// Initialize data from the store and check for bookmarklet parameters
	onMount(() => {
		if (browser) {
			// Check if we have bookmarklet parameters
			const urlParam = getUrlParameter('h');
			const titleParam = getUrlParameter('t');
			const descParam = getUrlParameter('d');
			
			if (urlParam) {
				isBookmarkletMode = true;
				bookmarkFormOpen = true;
			}

			// Subscribe to the store to get current data
			const unsubscribe = appData.subscribe((data) => {
				console.debug('🔧 appData subscription update', {
					hasUnsavedChanges: data?.hasUnsavedChanges,
					bookmarkCount: data?.bookmarks?.length
				});
				bookmarkData = data;
			});

			// Handle export completed event to clear unsaved changes flag
			const handleExportCompleted = (event: any) => {
				console.debug('🔧 handleExportCompleted: Clearing unsaved changes flag', event.detail);
				if (bookmarkData && event.detail?.exportedData) {
					appData.set(event.detail.exportedData);
				}
			};

			// Listen for system theme changes and update if no custom theme is saved
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleSystemThemeChange = (e: MediaQueryListEvent) => {
				const savedTheme = localStorage.getItem('theme');
				if (!savedTheme) {
					// Only update if user hasn't manually set a theme
					const systemTheme = e.matches ? 'dark' : 'light';
					document.documentElement.setAttribute('data-theme', systemTheme);
				}
			};
			
			mediaQuery.addEventListener('change', handleSystemThemeChange);

			window.addEventListener('export-completed', handleExportCompleted);

			return () => {
				unsubscribe();
				mediaQuery.removeEventListener('change', handleSystemThemeChange);
				window.removeEventListener('export-completed', handleExportCompleted);
			};
		}
	});

	// Handle bookmark save from bookmarklet form
	function handleBookmarkletSave(event: CustomEvent<Bookmark>) {
		// Add the bookmark to the store like normal bookmark saves
		if (bookmarkData) {
			const savedBookmark = event.detail;
			
			// Check if we're updating an existing bookmark or adding a new one
			const existingIndex = bookmarkData.bookmarks.findIndex((b) => b.url === savedBookmark.url);

			let newBookmarks;
			if (existingIndex >= 0) {
				// Update existing bookmark
				newBookmarks = [...bookmarkData.bookmarks];
				newBookmarks[existingIndex] = savedBookmark;
			} else {
				// Add new bookmark
				newBookmarks = [...bookmarkData.bookmarks, savedBookmark];
			}

			const newData = markDataAsUnsaved({
				...bookmarkData,
				bookmarks: newBookmarks
			});

			appData.set(newData);
		}
		
		// Close the form
		bookmarkFormOpen = false;
		
		// Close the window if in bookmarklet mode (opened from bookmarklet)
		if (isBookmarkletMode && browser) {
			// Try to close the window - this will only work if the window was opened by a script
			window.close();
		}
	}

	// Handle bookmark form close from bookmarklet
	function handleBookmarkletClose() {
		bookmarkFormOpen = false;
		
		// Close the window if in bookmarklet mode (opened from bookmarklet)
		if (isBookmarkletMode && browser) {
			// Try to close the window - this will only work if the window was opened by a script
			window.close();
		}
	}

	// Handle data changes from BookmarkManager
	function handleDataChanged(event: CustomEvent<any[]>) {
		if (bookmarkData) {
			const newData = markDataAsUnsaved({
				...bookmarkData,
				bookmarks: event.detail
			});
			console.debug('🔧 handleDataChanged: Marking data as unsaved', {
				oldUnsaved: bookmarkData.hasUnsavedChanges,
				newUnsaved: newData.hasUnsavedChanges
			});
			appData.set(newData);
		} else {
			console.warn('⚠️ bookmarkData is null, cannot update store');
		}
	}

	// Handle bookmark clicks
	function handleBookmarkClicked(event: CustomEvent<any>) {
		// The BookmarkManager already updates the bookmark, just need to sync to store
		if (bookmarkData) {
			const updatedBookmarks = bookmarkData.bookmarks.map((b) =>
				b.url === event.detail.url ? event.detail : b
			);
			const newData = markDataAsUnsaved({
				...bookmarkData,
				bookmarks: updatedBookmarks
			});
			console.debug('🔧 handleBookmarkClicked: Marking data as unsaved', {
				oldUnsaved: bookmarkData.hasUnsavedChanges,
				newUnsaved: newData.hasUnsavedChanges
			});
			appData.set(newData);
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
		} else {
			// If no saved theme, detect system preference
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const systemTheme = prefersDark ? 'dark' : 'light';
			document.documentElement.setAttribute('data-theme', systemTheme);
		}
	}
</script>

<svelte:head>
	<title>Bookmarks{isBookmarkletMode ? ' - Add Bookmark' : ''}{bookmarkData?.hasUnsavedChanges ? ' (unsaved changes)' : ''}</title>
</svelte:head>

<!-- PWA Cache Refresh Notification -->
<CacheRefreshNotification />

{#if isBookmarkletMode}
	<!-- Show simplified view for bookmarklet mode -->
	<div class="bookmarklet-mode">
		<h2>Add Bookmark</h2>
		<p>Adding bookmark from page...</p>
	</div>
	
	<!-- Bookmarklet bookmark form -->
	<BookmarkForm.View
		bind:isOpen={bookmarkFormOpen}
		bookmark={null}
		isEdit={false}
		existingBookmarks={bookmarkData?.bookmarks || []}
		on:save={handleBookmarkletSave}
		on:close={handleBookmarkletClose}
	/>
{:else}
	<!-- Normal bookmark manager view -->
	{#if bookmarkData?.hasUnsavedChanges}
		<div class="unsaved-banner" role="alert">
			<svg><use href="feather-sprite.svg#alert-circle" /></svg>
			<span>You have unsaved changes. <button class="btn-link" on:click={() => window.dispatchEvent(new CustomEvent('trigger-export'))}>Export bookmarks</button> to save them.</span>
		</div>
	{/if}
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
{/if}

<nav>
	<ul>
		<li>
			<a href="https://avanderw.co.za"
				><svg><use href="feather-sprite.svg#home" /></svg>My homepage</a
			>
		</li>
		<li>
			<a href="https://github.com/avanderw/bookmarks">
				<svg><use href="feather-sprite.svg#github" /></svg>
				Repo
			</a>
		</li>
		<li>
			<a href="https://github.com/avanderw/bookmarks/blob/main/README.md">
				<svg><use href="feather-sprite.svg#help-circle" /></svg>
				Help
			</a>
		</li>
		<li>
			<a href="https://tracking.avanderw.co.za/avanderw.co.za">
				<svg><use href="feather-sprite.svg#bar-chart-2" /></svg>
				Analytics
			</a>
		</li>
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

	.bookmarklet-mode {
		text-align: center;
		padding: 2rem;
		color: var(--pico-muted-color);
	}

	.bookmarklet-mode h2 {
		margin: 0 0 0.5rem 0;
		color: var(--pico-color);
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

	.unsaved-banner {
		background-color: var(--pico-secondary-background);
		border: 1px solid var(--pico-secondary);
		border-radius: var(--pico-border-radius);
		color: var(--pico-secondary);
		padding: 0.75rem 1rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		animation: fade-in 0.3s ease;
	}

	.unsaved-banner svg {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		stroke: currentColor;
		fill: none;
	}

	.btn-link {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		color: var(--pico-secondary);
		text-decoration: underline;
		cursor: pointer;
		font-size: inherit;
		font-family: inherit;
	}

	.btn-link:hover {
		color: var(--pico-primary);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
