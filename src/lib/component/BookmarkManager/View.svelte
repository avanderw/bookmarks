<!-- src/lib/component/BookmarkManager/View.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Bookmark, BookmarkStore } from '$lib/bookmarks';
	import { FileManager } from '$lib/component/FileManager';
	import { SearchQueryFilter } from '$lib/component/SearchQueryFilter';
	import { BookmarkForm } from '$lib/component/BookmarkForm';
	import { Bookmarklet } from '$lib/component/Bookmarklet';
	import { downloadCache } from '$lib/cache-store';
	import { handleFileImport, updateBookmarkClickCount, sortBookmarks } from './Logic';

	// Component props
	export let initialData: BookmarkStore | null = null;

	// Component state
	let bookmarks: Bookmark[] = [];
	let filteredBookmarks: Bookmark[] = [];
	let sortOrder: string = 'clicks'; // Changed default sort to clicks
	let isSearchActive = false; // Track if search is active
	let previousSortOrder: string = sortOrder; // Store previous sort order when search becomes active
	let selectedBookmark: Bookmark | null = null; // Track selected bookmark for editing
	let viewingNotes: Bookmark | null = null; // Track bookmark for viewing notes
	
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
		const newSearchActive = event.detail.query && event.detail.query.trim() !== '';
		
		// If search is becoming active, store current sort and switch to relevance
		if (!isSearchActive && newSearchActive) {
			previousSortOrder = sortOrder;
			sortOrder = 'relevance';
		}
		// If search is being cleared, restore previous sort order
		else if (isSearchActive && !newSearchActive) {
			sortOrder = previousSortOrder;
		}
		
		isSearchActive = newSearchActive;
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

	// Handle edit bookmark
	function onEditBookmarkClick(bookmark: Bookmark) {
		selectedBookmark = bookmark;
	}

	// Handle delete bookmark
	function onDeleteBookmarkClick(bookmark: Bookmark) {
		if (confirm(`Are you sure you want to delete "${bookmark.title || bookmark.url}"?`)) {
			// Remove from bookmarks array
			bookmarks = bookmarks.filter(b => b.url !== bookmark.url);
			
			// Update filtered bookmarks to match
			filteredBookmarks = filteredBookmarks.filter(b => b.url !== bookmark.url);
			
			// Notify parent component of data change
			dispatch('dataChanged', bookmarks);
		}
	}

	// Handle view notes
	function onViewNotesClick(bookmark: Bookmark) {
		viewingNotes = bookmark;
	}

	// Handle close notes
	function onNotesClose() {
		viewingNotes = null;
	}

	// Handle bookmark save (both add and edit)
	function onBookmarkSave(event: CustomEvent<Bookmark>) {
		const savedBookmark = event.detail;
		
		// Check if we're updating an existing bookmark or adding a new one
		const existingIndex = bookmarks.findIndex(b => b.url === savedBookmark.url);
		
		if (existingIndex >= 0) {
			// Update existing bookmark
			bookmarks[existingIndex] = savedBookmark;
			bookmarks = [...bookmarks]; // Trigger reactivity
		} else {
			// Add new bookmark
			bookmarks = [...bookmarks, savedBookmark];
		}
		
		// Update filtered bookmarks to match
		filteredBookmarks = isSearchActive 
			? filteredBookmarks 
			: [...bookmarks];
			
		// Reset selected bookmark
		selectedBookmark = null;
		
		// Notify parent component of data change
		dispatch('dataChanged', bookmarks);
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
	$: sortedBookmarks = sortOrder === 'relevance' && isSearchActive 
		? filteredBookmarks // Keep the relevancy order from search
		: sortBookmarks(filteredBookmarks, sortOrder);
	
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

			<div class="add-bookmark">
				<BookmarkForm.Button 
					on:save={onBookmarkSave}
					buttonText="Add Bookmark" 
				/>
			</div>

			<div class="sort-controls">
				<label>
					Sort by:
					<select bind:value={sortOrder}>
						{#if isSearchActive}
							<option value="relevance">Relevance</option>
						{/if}
						<option value="clicks">Clicks</option>
						<option value="date">Date Added</option>
						<option value="title">Title</option>
						<option value="url">URL</option>
					</select>
					{#if isSearchActive && sortOrder !== 'relevance'}
						<small class="info-text">(search relevance overridden)</small>
					{/if}
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

		<!-- Bookmarklet component -->
		<div class="bookmarklet-wrapper">
			<Bookmarklet.View />
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
						<div class="bookmark-row">
							<div class="bookmark-content">
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
									{#if bookmark.notes}
										<span>|</span>
										<button 
											class="notes-button" 
											on:click={() => onViewNotesClick(bookmark)}
											title="View notes"
										>
											<svg><use href="feather-sprite.svg#file-text" /></svg>
											Notes
										</button>
									{/if}
								</div>
							</div>
							<div class="bookmark-actions">
								<button 
									class="edit-button" 
									on:click={() => onEditBookmarkClick(bookmark)}
									title="Edit bookmark"
								>
									<svg>
										<use href="feather-sprite.svg#edit" />
									</svg>
								</button>
								<button 
									class="delete-button" 
									on:click={() => onDeleteBookmarkClick(bookmark)}
									title="Delete bookmark"
								>
									<svg>
										<use href="feather-sprite.svg#trash-2" />
									</svg>
								</button>
							</div>
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
	
	<!-- Edit bookmark form (conditionally rendered) -->
	{#if selectedBookmark}
		<BookmarkForm.View
			isOpen={!!selectedBookmark}
			bookmark={selectedBookmark}
			isEdit={true}
			on:save={onBookmarkSave}
			on:close={() => selectedBookmark = null}
		/>
	{/if}

	<!-- Notes viewer (conditionally rendered) -->
	{#if viewingNotes}
		<div class="notes-modal-overlay" on:click|self={onNotesClose}>
			<div class="notes-modal">
				<div class="notes-header">
					<h2>Notes for "{viewingNotes.title || 'Untitled'}"</h2>
					<button class="close-button" on:click={onNotesClose} title="Close">
						<svg><use href="feather-sprite.svg#x" /></svg>
					</button>
				</div>
				<div class="notes-content">
					{#if viewingNotes.notes}
						<pre>{viewingNotes.notes}</pre>
					{:else}
						<p>No notes for this bookmark.</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
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

	.add-bookmark {
		margin-left: auto;
	}

	.sort-controls {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.bookmarklet-wrapper {
		margin-top: 1rem;
		margin-bottom: 1rem;
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

	.bookmark-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.bookmark-content {
		flex: 1;
	}

	.bookmark-content div {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.bookmark-actions {
		margin-left: 1rem;
		display: flex;
		gap: 0.5rem;
	}

	.edit-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 4px;
		background-color: var(--background-alt, #f6f8fa);
		border: 1px solid var(--border, #e1e4e8);
		cursor: pointer;
	}
	
	.edit-button:hover {
		background-color: var(--background-hover, #e1e4e8);
	}
	
	.edit-button svg {
		width: 16px;
		height: 16px;
		color: var(--text-muted, #6a737d);
	}

	.delete-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 4px;
		background-color: var(--danger-bg, #ffeef0);
		border: 1px solid var(--danger-border, #f5c2c7);
		color: var(--danger-text, #b71c1c);
		cursor: pointer;
	}
	
	.delete-button:hover {
		background-color: var(--danger-hover, #f5c2c7);
	}
	
	.delete-button svg {
		width: 16px;
		height: 16px;
		color: inherit;
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

	.info-text {
		font-style: italic;
		color: var(--text-muted, #6a737d);
		margin-left: 0.5rem;
	}

	/* Notes button and modal styles */
	.notes-button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--text-muted, #6a737d);
	}

	.notes-button:hover {
		color: var(--primary, #0366d6);
	}

	.notes-button svg {
		width: 12px;
		height: 12px;
	}

	.notes-modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.notes-modal {
		background-color: var(--panel, white);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		width: 90%;
		max-width: 600px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.notes-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--border-light, #eee);
	}

	.notes-header h2 {
		font-size: 1.25rem;
		margin: 0;
	}

	.notes-content {
		padding: 1rem;
		overflow-y: auto;
		flex: 1;
		max-height: 60vh;
	}

	.notes-content pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
		font-family: inherit;
		font-size: 0.9rem;
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 4px;
		background-color: var(--background-alt, #f6f8fa);
		border: 1px solid var(--border, #e1e4e8);
	}

	.close-button svg {
		width: 16px;
		height: 16px;
	}
</style>
