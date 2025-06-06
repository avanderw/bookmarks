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
	
	// Pagination state
	let currentPage = 1;
	let itemsPerPage = 10;
	let totalPages = 0;

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
			currentPage = 1; // Reset to first page on new import
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
		currentPage = 1; // Reset to first page when filter changes
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

	// Pagination functions
	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage += 1;
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage -= 1;
		}
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
	
	// Calculate pagination values
	$: totalPages = Math.max(1, Math.ceil(sortedBookmarks.length / itemsPerPage));
	$: paginatedBookmarks = sortedBookmarks.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);
	
	// Calculate the range of bookmarks being displayed
	$: startIndex = sortedBookmarks.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
	$: endIndex = Math.min(sortedBookmarks.length, currentPage * itemsPerPage);
	
	// Ensure current page is valid when total pages changes
	$: if (currentPage > totalPages) {
		currentPage = totalPages;
	}
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
				
				<label>
					Items per page:
					<select bind:value={itemsPerPage}>
						<option value={5}>5</option>
						<option value={10}>10</option>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
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
			<ol start={startIndex}>
				{#each paginatedBookmarks as bookmark (bookmark.url)}
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
			
			<div class="pagination">
				<div class="pagination-info">
					{#if sortedBookmarks.length > 0}
						Showing {startIndex}-{endIndex} of {sortedBookmarks.length} bookmarks
					{:else}
						No bookmarks to display
					{/if}
				</div>
				<div class="pagination-controls">
					<button 
						class="pagination-button" 
						disabled={currentPage === 1} 
						on:click={() => goToPage(1)}
					>
						First
					</button>
					<button 
						class="pagination-button" 
						disabled={currentPage === 1} 
						on:click={prevPage}
					>
						Previous
					</button>
					<span class="pagination-current">{currentPage} of {totalPages}</span>
					<button 
						class="pagination-button" 
						disabled={currentPage === totalPages} 
						on:click={nextPage}
					>
						Next
					</button>
					<button 
						class="pagination-button" 
						disabled={currentPage === totalPages} 
						on:click={() => goToPage(totalPages)}
					>
						Last
					</button>
				</div>
			</div>
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
		display: flex;
		gap: 1rem;
		align-items: center;
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
	
	.pagination {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 1rem;
		padding: 0.5rem;
		border-top: 1px solid var(--border-light, #eee);
	}
	
	.pagination-info {
		font-size: 0.8rem;
		color: var(--text-muted, #6a737d);
		margin-bottom: 0.5rem;
	}
	
	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.pagination-button {
		background-color: var(--background-alt, #f6f8fa);
		border: 1px solid var(--border, #e1e4e8);
		border-radius: 4px;
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
		cursor: pointer;
	}
	
	.pagination-button:hover:not(:disabled) {
		background-color: var(--background-hover, #e1e4e8);
	}
	
	.pagination-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.pagination-current {
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}
</style>
