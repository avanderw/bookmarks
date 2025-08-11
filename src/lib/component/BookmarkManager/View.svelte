<!-- src/lib/component/BookmarkManager/View.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import type { Bookmark, BookmarkStore } from '$lib/bookmarks';
	import { SearchQueryFilter } from '$lib/component/SearchQueryFilter';
	import { BookmarkForm } from '$lib/component/BookmarkForm';
	import { Bookmarklet } from '$lib/component/Bookmarklet';
	import { downloadCache } from '$lib/cache-store';
	import { updateBookmarkClickCount, sortBookmarks } from './Logic';
	import { PaginationUtils } from './PaginationUtils';
	import { FileUtils } from './FileUtils';
	import { formatRelativeTime, formatFriendlyDate } from '$lib/utils/DateUtils';

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		bookmarkClicked: Bookmark;
		dataChanged: Bookmark[];
	}>();
	// Component props
	export let initialData: BookmarkStore | null = null;	// Component state
	let bookmarks: Bookmark[] = [];
	let filteredBookmarks: Bookmark[] = [];
	let sortedBookmarks: Bookmark[] = [];
	let paginatedBookmarks: Bookmark[] = [];
	let sortOrder: string = 'clicks';
	let isSearchActive = false;
	let previousSortOrder: string = sortOrder;
	let selectedBookmark: Bookmark | null = null;
	let viewingNotes: Bookmark | null = null;
	// Pagination state
	let currentPage = 1;
	let itemsPerPage = 20;
	let totalPages = 0;
	let startIndex = 0;
	let endIndex = 0;

	// Drag and drop state
	let isDragging = false;
	let dragCounter = 0;

	// Initialize data from props if available
	onMount(() => {
		if (initialData) {
			bookmarks = initialData.bookmarks;
			filteredBookmarks = [...bookmarks];
		}

		// Set up global drag and drop handlers
		if (browser) {
			window.addEventListener('dragenter', handleDragEnter);
			window.addEventListener('dragover', handleDragOver);
			window.addEventListener('dragleave', handleDragLeave);
			window.addEventListener('drop', handleDrop);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('dragenter', handleDragEnter);
			window.removeEventListener('dragover', handleDragOver);
			window.removeEventListener('dragleave', handleDragLeave);
			window.removeEventListener('drop', handleDrop);
		}
	});

	// File handling
	// -------------------------------------
	// File handling functions
	/**
	 * Handle file import event from FileManager
	 * @param event CustomEvent containing the file to import
	 */
	async function onFileImported(event: CustomEvent<File>) {
		try {
			const result = await FileUtils.importFile(event.detail);
			bookmarks = result.bookmarks;
			filteredBookmarks = [...bookmarks];
			currentPage = 1; // Reset to first page on new import
		} catch (error) {
			console.error('Error importing file:', error);
			alert('Failed to import file. Please check the file format.');
		}
	}

	/**
	 * Handle export request from FileManager
	 */
	function onExportRequested() {
		downloadCache();
	} // Search handlers
	// -------------------------------------

	/**
	 * Handle filtered results from SearchQueryFilter
	 * @param event CustomEvent containing filtered data and search query
	 */
	function onFiltered(event: CustomEvent<{ data: Bookmark[]; query: string }>) {
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
	} // Bookmark handlers
	// -------------------------------------

	/**
	 * Handle bookmark click - updates click count and dispatches event
	 */
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

	/**
	 * Open the edit form for a bookmark
	 */
	function onEditBookmarkClick(bookmark: Bookmark) {
		selectedBookmark = bookmark;
	}

	/**
	 * Delete a bookmark after confirmation
	 */
	function onDeleteBookmarkClick(bookmark: Bookmark) {
		if (confirm(`Are you sure you want to delete "${bookmark.title || bookmark.url}"?`)) {
			// Remove from bookmarks array
			bookmarks = bookmarks.filter((b) => b.url !== bookmark.url);

			// Update filtered bookmarks to match
			filteredBookmarks = filteredBookmarks.filter((b) => b.url !== bookmark.url);

			// Notify parent component of data change
			dispatch('dataChanged', bookmarks);
		}
	}

	/**
	 * Display notes for a bookmark
	 */
	function onViewNotesClick(bookmark: Bookmark) {
		viewingNotes = bookmark;
	}

	/**
	 * Close the notes modal
	 */
	function onNotesClose() {
		viewingNotes = null;
	}

	/**
	 * Handle bookmark save (both add and edit)
	 * @param event CustomEvent containing the saved bookmark
	 */
	function onBookmarkSave(event: CustomEvent<Bookmark>) {
		const savedBookmark = event.detail;

		// Check if we're updating an existing bookmark or adding a new one
		const existingIndex = bookmarks.findIndex((b) => b.url === savedBookmark.url);

		if (existingIndex >= 0) {
			// Update existing bookmark
			bookmarks[existingIndex] = savedBookmark;
			bookmarks = [...bookmarks]; // Trigger reactivity
		} else {
			// Add new bookmark
			bookmarks = [...bookmarks, savedBookmark];
		}

		// Update filtered bookmarks to match
		if (!isSearchActive) {
			filteredBookmarks = [...bookmarks];
		}

		// Reset selected bookmark
		selectedBookmark = null;

		// Notify parent component of data change
		dispatch('dataChanged', bookmarks);
	}

	// Pagination functions
	/**
	 * Navigate to a specific page
	 * @param page The page number to navigate to
	 */
	function goToPage(page: number) {
		currentPage = PaginationUtils.goToPage(page, totalPages);
	}

	/**
	 * Navigate to the next page
	 */
	function nextPage() {
		currentPage = PaginationUtils.nextPage(currentPage, totalPages);
	}

	/**
	 * Navigate to the previous page
	 */
	function prevPage() {
		currentPage = PaginationUtils.prevPage(currentPage);
	}
	/**
	 * Generate bookmarklet code for the drag-and-drop bookmarklet
	 */
	function getBookmarkletCode(): string {
		return `javascript:${encodeURIComponent(Bookmarklet.createBookmarkletCode())}`;
	}
	// Drag and drop handlers
	// -------------------------------------
	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dragCounter++;
		if (dragCounter === 1) {
			isDragging = true;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'copy';
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
	async function handleDrop(e: DragEvent) {
	e.preventDefault();
	e.stopPropagation();
	isDragging = false;
	dragCounter = 0;
	if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
		const file = e.dataTransfer.files[0];
		await onFileImported(FileUtils.createFileEvent(file));
		}
	}

	// Reactive declarations
	// -------------------------------------

	// Watch for changes to bookmarks and notify parent
	$: if (bookmarks.length > 0) {
		dispatch('dataChanged', bookmarks);
	}
	// Sort bookmarks based on sort order and search state
	$: sortedBookmarks =
		sortOrder === 'relevance' && isSearchActive
			? filteredBookmarks // Keep the relevancy order from search
			: sortBookmarks(filteredBookmarks, sortOrder);

	// Calculate pagination values using utility
	$: {
		const pagination = PaginationUtils.calculatePagination(
			sortedBookmarks,
			currentPage,
			itemsPerPage
		);
		totalPages = pagination.totalPages;
		paginatedBookmarks = pagination.paginatedItems;
		startIndex = pagination.startIndex;
		endIndex = pagination.endIndex;

		// Update current page if it's out of bounds
		if (currentPage !== pagination.validCurrentPage) {
			currentPage = pagination.validCurrentPage;
		}
	}
</script>

<div class="bookmark-manager">
	<section class="header">
		<div class="toolbar">
			<div class="search-section">
				<SearchQueryFilter
					data={bookmarks}
					on:filtered={onFiltered}
					placeholder="Search bookmarks..."
				/>
			</div>

			<div class="action-section">
				<button
					class="btn-compact secondary"
					on:click={() => document.getElementById('fileInput').click()}
					title="Import bookmarks"
				>
					<svg><use href="feather-sprite.svg#upload" /></svg>
					Import
				</button>

				<button
					class="btn-compact secondary"
					on:click={onExportRequested}
					title="Export bookmarks"
				>
					<svg><use href="feather-sprite.svg#download" /></svg>
					Export
				</button>

				<BookmarkForm.Button
					on:save={onBookmarkSave}
					buttonClass="btn-compact"
					buttonText="Add Bookmark"
				/>

				<a
					href={getBookmarkletCode()}
					class="btn-compact secondary bookmarklet-button"
					title="Drag to your bookmarks bar"
					draggable="true"
					on:dragstart={(e) => e.dataTransfer.setData('text/plain', getBookmarkletCode())}
				>
					<svg><use href="feather-sprite.svg#bookmark" /></svg>
					Save to Bookmarks
				</a>
			</div>
		</div>

		<div class="settings-bar">
			<div class="display-settings">
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
						<small class="text-muted">(search relevance overridden)</small>
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

			<div class="pagination-info">
				{#if sortedBookmarks.length > 0}
					Showing {startIndex}-{endIndex} of {sortedBookmarks.length} bookmarks
				{:else}
					No bookmarks to display
				{/if}
			</div>
		</div>
	</section>
	<!-- Hidden file input for importing -->
	<input
		type="file"
		id="fileInput"
		accept=".json,.html,.htm"
		style="display:none"
		on:change={(e) => {			if (e.target.files && e.target.files[0]) {
				onFileImported(FileUtils.createFileEvent(e.target.files[0]));
			}
		}}
	/>
	
	<section class="bookmark-list" class:drop-zone={isDragging} class:active={isDragging}>
		{#if sortedBookmarks.length === 0}
			<div class="text-center">
				<p>No bookmarks found. Import a bookmark file or add new bookmarks.</p>
			</div>
		{:else}
			<div class="bookmark-items">
				{#each paginatedBookmarks as bookmark, index (bookmark.url)}
					<article class="bookmark-row">
						<div class="bookmark-content">
							<div class="bookmark-title-row">								
								<div class="title-section">									
									<span class="bookmark-number">{startIndex + index}.</span>
									<a
										href={bookmark.url}
										target="_blank"
										rel="noopener noreferrer"
										on:click|preventDefault={() => onBookmarkClick(bookmark)}
									>{bookmark.title || 'Untitled'}</a>
									{#if bookmark.url}
										<span class="bookmark-domain">
											({bookmark.url.replace(/^https?:\/\/([^\/]+).*$/, '$1')})
										</span>
									{/if}
									
									{#if bookmark.description}
										<span class="bookmark-description">{bookmark.description}</span>
									{/if}
								</div>
								
								<div class="bookmark-actions">
									<button
										class="btn-compact secondary"
										on:click={() => onEditBookmarkClick(bookmark)}
										title="Edit bookmark"
									>
										<svg><use href="feather-sprite.svg#edit" /></svg>
									</button>
									<button
										class="btn-compact secondary"
										on:click={() => onDeleteBookmarkClick(bookmark)}
										title="Delete bookmark"
									>
										<svg><use href="feather-sprite.svg#trash-2" /></svg>
									</button>
								</div>							
							</div>
							
							<div class="bookmark-meta">
								{#if bookmark.clicked > 0}
									<span>{bookmark.clicked} clicks</span>
									{#if bookmark.last}
										<span title={formatFriendlyDate(bookmark.last)}>
											visited {formatRelativeTime(bookmark.last)}
										</span>
									{/if}
								{:else}
									<span>Never visited</span>
								{/if}								
								
								{#if bookmark.added}
									<span title={formatFriendlyDate(bookmark.added)}>
										added {formatRelativeTime(bookmark.added)}
									</span>
								{/if}
								
								{#if bookmark.notes}
									<button
										class="btn-compact secondary"
										on:click={() => onViewNotesClick(bookmark)}
										title="View notes"
									>
										<svg><use href="feather-sprite.svg#file-text" /></svg>
										Notes
									</button>
								{/if}
								
								{#if bookmark.tags && bookmark.tags.length > 0}
									<div class="tags">
										{#each bookmark.tags as tag}
											<span class="bookmark-tag">#{tag}</span>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</article>
				{/each}
			</div>

			<nav class="pagination">
				<div class="pagination-info">
					{#if sortedBookmarks.length > 0}
						Showing {startIndex}-{endIndex} of {sortedBookmarks.length} bookmarks
					{:else}
						No bookmarks to display
					{/if}
				</div>
				<div class="pagination-controls">
					<button
						class="btn-compact secondary"
						disabled={currentPage === 1}
						on:click={() => goToPage(1)}
					>
						First
					</button>
					<button 
						class="btn-compact secondary" 
						disabled={currentPage === 1} 
						on:click={prevPage}
					>
						Previous
					</button>
					<span class="pagination-current">{currentPage} of {totalPages}</span>
					<button
						class="btn-compact secondary"
						disabled={currentPage === totalPages}
						on:click={nextPage}
					>
						Next
					</button>
					<button
						class="btn-compact secondary"
						disabled={currentPage === totalPages}
						on:click={() => goToPage(totalPages)}
					>
						Last
					</button>
				</div>
			</nav>
		{/if}
	</section>

	<!-- Edit bookmark form (conditionally rendered) -->
	{#if selectedBookmark}
		<BookmarkForm.View
			isOpen={!!selectedBookmark}
			bookmark={selectedBookmark}
			isEdit={true}
			on:save={onBookmarkSave}
			on:close={() => (selectedBookmark = null)}
		/>
	{/if}

	<!-- Notes viewer (conditionally rendered) -->
	{#if viewingNotes}
		<dialog open>
			<article>
				<header>
					<button aria-label="Close" rel="prev" on:click={onNotesClose}></button>
					<h3>Notes for "{viewingNotes.title || 'Untitled'}"</h3>
				</header>
				<div class="notes-content">
					{#if viewingNotes.notes}
						<pre>{viewingNotes.notes}</pre>
					{:else}
						<p>No notes for this bookmark.</p>
					{/if}
				</div>
			</article>
		</dialog>
	{/if}
</div>

<style>
	.bookmark-manager {
		width: 100%;
	}

	.header {
		border-bottom: 1px solid var(--pico-muted-border-color);
		margin-bottom: 1rem;
		padding-bottom: 1rem;
	}

	.toolbar {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		align-items: center;
		margin-bottom: 1rem;
	}

	.search-section {
		min-width: 300px;
	}

	.action-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.settings-bar {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		align-items: center;
		padding: 0.5rem 0;
		border-top: 1px solid var(--pico-muted-border-color);
		font-size: 0.875rem;
	}

	.display-settings {
		display: flex;
		gap: 1.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.display-settings label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
	}

	.display-settings select {
		width: auto;
		margin: 0;
		font-size: 0.875rem;
	}

	.bookmarklet-button {
		border-style: dashed !important;
		cursor: grab;
		text-decoration: none;
	}

	.bookmarklet-button:hover {
		text-decoration: none;
	}

	.bookmark-list {
		min-height: 200px;
	}

	.bookmark-list.drop-zone.active::after {
		content: 'Drop bookmark file here';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: var(--pico-card-background-color);
		color: var(--pico-primary);
		font-size: 1.25rem;
		font-weight: bold;
		padding: 1rem 2rem;
		border-radius: var(--pico-border-radius);
		box-shadow: var(--pico-box-shadow);
		z-index: 2;
		pointer-events: none;
	}

	.bookmark-row {
		border-bottom: 1px solid var(--bookmark-border);
		padding: 0.75rem 0;
	}

	.bookmark-row:last-child {
		border-bottom: none;
	}

	.bookmark-title-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}

	.title-section {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.5rem;
	}

	.title-section a {
		font-weight: 500;
		text-decoration: none;
	}

	.title-section a:hover {
		text-decoration: underline;
	}

	.bookmark-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.bookmark-actions button {
		padding: 0.25rem;
		margin: 0;
		min-width: auto;
		width: auto;
		height: auto;
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
	}

	.pagination-controls button {
		margin: 0;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
	}

	.pagination-current {
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
		color: var(--pico-muted-color);
	}

	.notes-content {
		max-height: 60vh;
		overflow-y: auto;
	}

	.notes-content pre {
		white-space: pre-wrap;
		word-wrap: break-word;
		margin: 0;
		font-family: inherit;
		font-size: 0.875rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin-top: 0.25rem;
	}

	/* Mobile responsive adjustments */
	@media (max-width: 768px) {
		.toolbar {
			grid-template-columns: 1fr;
		}
		
		.settings-bar {
			grid-template-columns: 1fr;
		}
		
		.display-settings {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		
		.action-section {
			justify-content: center;
		}
		
		.bookmark-title-row {
			flex-direction: column;
			gap: 0.5rem;
		}
		
		.bookmark-actions {
			align-self: flex-end;
		}
	}
</style>
