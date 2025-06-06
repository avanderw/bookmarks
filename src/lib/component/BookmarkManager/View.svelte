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
	let sortOrder: string = 'date'; // Default sort

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
					<option value="date">Date Added</option>
					<option value="title">Title</option>
					<option value="clicks">Clicks</option>
					<option value="url">URL</option>
				</select>
			</label>
		</div>
	</div>

	<div class="bookmark-list">
		{#if sortedBookmarks.length === 0}
			<div class="empty-state">
				<p>No bookmarks found. Import a bookmark file or add new bookmarks.</p>
			</div>
		{:else}
			{#each sortedBookmarks as bookmark (bookmark.url)}
				<div class="bookmark-item">
					<a
						href={bookmark.url}
						target="_blank"
						rel="noopener noreferrer"
						on:click|preventDefault={() => onBookmarkClick(bookmark)}
					>
						<div class="bookmark-title">{bookmark.title || 'Untitled'}</div>
						<div class="bookmark-url">{bookmark.url}</div>
						<div class="bookmark-meta">
							Added: {new Date(bookmark.added).toLocaleDateString()}
							• Clicks: {bookmark.clicked}
							{#if bookmark.last}
								• Last visited: {new Date(bookmark.last).toLocaleDateString()}
							{/if}
						</div>
						{#if bookmark.tags && bookmark.tags.length > 0}
							<div class="bookmark-tags">
								{#each bookmark.tags as tag}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						{/if}
					</a>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.bookmark-manager {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.sort-controls {
		display: flex;
		justify-content: flex-end;
	}

	.bookmark-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		background-color: var(--panel);
		border-radius: 0.5rem;
		color: var(--text-muted);
	}

	.bookmark-item {
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		overflow: hidden;
		background-color: var(--panel);
	}

	.bookmark-item a {
		display: block;
		padding: 1rem;
		color: inherit;
		text-decoration: none;
	}

	.bookmark-item:hover {
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		border-color: var(--primary);
	}

	.bookmark-title {
		font-weight: 500;
		font-size: 1.1rem;
		margin-bottom: 0.25rem;
	}

	.bookmark-url {
		color: var(--primary);
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
		word-break: break-all;
	}

	.bookmark-meta {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-bottom: 0.5rem;
	}

	.bookmark-tags {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.tag {
		background-color: var(--bg-accent);
		padding: 0.2rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}
</style>
