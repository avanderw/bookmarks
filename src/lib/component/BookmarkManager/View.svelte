<!-- src/lib/component/BookmarkManager/View.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Bookmark, BookmarkStore } from '$lib/bookmarks';
	import { FileManager } from '$lib/component/FileManager';
	import { SearchQueryFilter } from '$lib/component/SearchQueryFilter';
	import { downloadCache } from '$lib/cache-store';
	import { handleFileImport, updateBookmarkClickCount, sortBookmarks } from './Logic';

	// Component props
	export let initialData: BookmarkStore | null = null;

	// Component state
	let bookmarks: Bookmark[] = [];
	let filteredBookmarks: Bookmark[] = [];
	let sortOrder: string = 'clicks'; // Changed default sort to clicks

	// Initialize data from props if available
	onMount(() => {
		if (initialData) {
			bookmarks = initialData.bookmarks;
			filteredBookmarks = [...bookmarks];
		}
	});

	// Handle file import event from FileManager
	async function onFileImported(event: CustomEvent<File>) {
		try {
			const result = await handleFileImport(event.detail);
			bookmarks = result.bookmarks;
			filteredBookmarks = [...bookmarks];
		} catch (error) {
			console.error('Error importing file:', error);
			alert('Failed to import file. Please check the file format.');
		}
	}

	// Handle export request from FileManager
	function onExportRequested() {
		downloadCache();
	}

	// Handle filtered results from SearchQueryFilter
	function onFiltered(event: CustomEvent<any>) {
		filteredBookmarks = event.detail.data;
	}

	// Handle bookmark click
	function onBookmarkClick(bookmark: Bookmark) {
		// Update the bookmark with new click count
		const updatedBookmark = updateBookmarkClickCount(bookmark);

		// Update in our lists
		bookmarks = bookmarks.map((b) => (b.url === bookmark.url ? updatedBookmark : b));

		filteredBookmarks = filteredBookmarks.map((b) =>
			b.url === bookmark.url ? updatedBookmark : b
		);

		// Dispatch event for parent component to handle (e.g., updating stores)
		dispatch('bookmarkClicked', updatedBookmark);
	}

	// Event dispatcher
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher<{
		bookmarkClicked: Bookmark;
		dataChanged: Bookmark[];
	}>();

	// Watch for changes to bookmarks and notify parent
	$: if (bookmarks.length > 0) {
		dispatch('dataChanged', bookmarks);
	}

	// Sort bookmarks when sort order changes
	$: sortedBookmarks = sortBookmarks(filteredBookmarks, sortOrder);
</script>

<div class="bookmark-manager">
	<div class="header">
		<div class="controls">
			<FileManager on:fileImported={onFileImported} on:exportRequested={onExportRequested} />

			<SearchQueryFilter
				data={bookmarks}
				on:filtered={onFiltered}
				placeholder="Search bookmarks..."
			/>

			<div class="sort-controls">
				<label>
					Sort by:
					<select bind:value={sortOrder}>
						<option value="clicks">Clicks</option>
						<option value="date">Date Added</option>
						<option value="title">Title</option>
						<option value="url">URL</option>
					</select>
				</label>
			</div>
		</div>
	</div>

	<div class="bookmark-list">
		{#if sortedBookmarks.length === 0}
			<div class="empty-state">
				<p>No bookmarks found. Import a bookmark file or add new bookmarks.</p>
			</div>
		{:else}
			<ol>
				{#each sortedBookmarks as bookmark (bookmark.url)}
					<li>
						<div>
							<a
								href={bookmark.url}
								target="_blank"
								rel="noopener noreferrer"
								on:click|preventDefault={() => onBookmarkClick(bookmark)}
							>{bookmark.title || 'Untitled'}</a>
							{#if bookmark.url}
								<button class="muted">
									({bookmark.url.replace(/^https?:\/\/([^\/]+).*$/, '$1')})
								</button>
							{/if}
						</div>
						<div>
							{#if bookmark.tags && bookmark.tags.length > 0}
								{#each bookmark.tags as tag}
									<button class="tag">#{tag}</button>
								{/each}
								{#if bookmark.description}
									<span>|</span>
								{/if}
							{/if}
							{#if bookmark.description}
								<span>{bookmark.description}</span>
							{/if}
						</div>
						<div class="muted">
							{#if bookmark.clicked > 0}
								<span>{bookmark.clicked} clicks</span>
								{#if bookmark.last}
									<span>last visited {new Date(bookmark.last).toLocaleDateString()}</span>
								{/if}
							{:else}
								<span>Never visited</span>
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</div>

<style>
	.bookmark-manager {
		display: block;
		width: 100%;
		margin-top: 1rem;
	}

	.header {
		display: block;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1rem;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding-bottom: 0.5rem;
	}

	.sort-controls {
		margin-left: auto;
	}

	.bookmark-list {
		width: 100%;
	}

	.empty-state {
		text-align: center;
		padding: 1rem;
		color: var(--text-muted);
	}

	ol {
		padding: 0 1rem;
	}

	li {
		padding: 0.25rem 0;
		border-bottom: 1px solid var(--border-light, #eee);
	}

	li:last-child {
		border-bottom: none;
	}

	li div {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	a {
		text-decoration: none;
		color: var(--primary, #0366d6);
	}

	a:hover {
		text-decoration: underline;
	}

	button {
		border: none;
		background: none;
		padding: 0;
		margin: 0;
		cursor: pointer;
		color: inherit;
	}

	.tag {
		overflow: initial;
		background-color: var(--tag, #f1f8ff);
		color: var(--tag-text, #0366d6);
		border-radius: 0.25rem;
		padding: 0.15rem;
		margin: 0.1rem 0;
		border: none;
		font-size: 0.75rem;
	}

	.muted {
		font-size: 0.75rem;
		color: var(--text-muted, #6a737d);
	}

	span, button {
		display: inline-block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
