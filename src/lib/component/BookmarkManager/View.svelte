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
	export let initialData: BookmarkStore | null = null;
	// Component state
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
	let itemsPerPage = 10;
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
	<div class="header">
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
					class="action-button import-button"
					on:click={() => document.getElementById('fileInput').click()}
					title="Import bookmarks"
				>
					<svg class="icon"><use href="feather-sprite.svg#upload" /></svg>
					<span>Import</span>
				</button>

				<button
					class="action-button export-button"
					on:click={onExportRequested}
					title="Export bookmarks"
				>
					<svg class="icon"><use href="feather-sprite.svg#download" /></svg>
					<span>Export</span>
				</button>

				<BookmarkForm.Button
					on:save={onBookmarkSave}
					buttonClass="action-button primary-button"
					buttonText="Add Bookmark"
				/>

				<a
					href="#"
					class="bookmarklet-button"
					title="Drag to your bookmarks bar"
					draggable="true"
					on:dragstart={(e) => e.dataTransfer.setData('text/plain', getBookmarkletCode())}
				>
					<svg class="icon"><use href="feather-sprite.svg#bookmark" /></svg>
					<span>Save to Bookmarks</span>
				</a>
			</div>
		</div>

		<div class="settings-bar">
			<div class="display-settings">
				<label class="setting-label">
					<span>Sort by:</span>
					<select bind:value={sortOrder} class="setting-select">
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

				<label class="setting-label">
					<span>Items per page:</span>
					<select bind:value={itemsPerPage} class="setting-select">
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
	</div>
	<!-- Hidden file input for importing -->
	<input
		type="file"
		id="fileInput"
		accept=".json,.html,.htm"
		style="display:none"
		on:change={(e) => {
			if (e.target.files && e.target.files[0]) {
				onFileImported(FileUtils.createFileEvent(e.target.files[0]));
			}
		}}
	/>

	<div class="bookmark-list" class:is-dragging={isDragging}>
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
										>{bookmark.title || 'Untitled'}</a
									>
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
								</div>								<div class="muted">									{#if bookmark.clicked > 0}
										<span>{bookmark.clicked} clicks</span>
										{#if bookmark.last}
											<span title={formatFriendlyDate(bookmark.last)}>
												last visited {formatRelativeTime(bookmark.last)}
											</span>
										{/if}
									{:else}
										<span>Never visited</span>
									{/if}
									{#if bookmark.added}
										<span class="separator">|</span>
										<span title={formatFriendlyDate(bookmark.added)}>
											added {formatRelativeTime(bookmark.added)}
										</span>
									{/if}
									{#if bookmark.notes}
										<span class="separator">|</span>
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
					<button class="pagination-button" disabled={currentPage === 1} on:click={prevPage}>
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
			on:close={() => (selectedBookmark = null)}
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

	.toolbar {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 0.75rem 0;
	}

	.search-section {
		flex: 1;
		min-width: 300px;
		display: flex;
		align-items: center;
	}

	.search-section :global(input) {
		height: 38px;
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		box-sizing: border-box;
	}

	.action-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.action-button,
	.bookmarklet-button {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		border: 1px solid var(--border, #e1e4e8);
		background-color: var(--background-alt, #f6f8fa);
		color: var(--text, #333);
		font-size: 0.9rem;
		cursor: pointer;
		text-decoration: none;
		transition: background-color 0.2s, transform 0.1s;
	}

	.action-button:hover,
	.bookmarklet-button:hover {
		background-color: var(--background-hover, #e1e4e8);
	}

	.action-button:active,
	.bookmarklet-button:active {
		transform: translateY(1px);
	}

	.primary-button {
		background-color: var(--primary, #0366d6);
		color: white;
		border-color: var(--primary-dark, #005cc5);
	}

	.primary-button:hover {
		background-color: var(--primary-dark, #005cc5);
	}

	.primary-button .icon {
		color: white;
	}

	.import-button,
	.export-button {
		min-width: 90px;
	}

	.bookmarklet-button {
		border-style: dashed;
		cursor: grab;
	}

	.icon {
		width: 16px;
		height: 16px;
	}

	.settings-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 0.75rem 0;
		border-top: 1px solid var(--border-light, #eee);
	}

	.display-settings {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	.setting-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}

	.setting-select {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		border: 1px solid var(--border, #e1e4e8);
		background-color: var(--background-alt, #f6f8fa);
		color: var(--text, #333);
		font-size: 0.9rem;
		cursor: pointer;
	}

	.pagination-info {
		font-size: 0.9rem;
		color: var(--text-muted, #6a737d);
	}

	.pagination {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-top: 1rem;
		padding: 0.5rem;
		border-top: 1px solid var(--border-light, #eee);
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

	/* Separator styling */
	.separator {
		margin: 0 0.5rem;
		color: var(--text-muted, #6a737d);
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

	.bookmark-list {
		width: 100%;
		min-height: 200px;
		position: relative;
		border-radius: 4px;
	}

	.bookmark-list.is-dragging {
		border: 3px dashed var(--primary, #0366d6);
		background-color: rgba(3, 102, 214, 0.05);
	}

	.bookmark-list.is-dragging::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(3, 102, 214, 0.1);
		z-index: 1;
		pointer-events: none;
	}

	.bookmark-list.is-dragging::after {
		content: 'Drop bookmark file here';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: var(--panel, white);
		color: var(--primary, #0366d6);
		font-size: 1.5rem;
		font-weight: bold;
		padding: 1rem 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 2;
		pointer-events: none;
	}

	.empty-state {
		text-align: center;
		padding: 2rem 1rem;
		color: var(--text-muted);
	}
</style>
