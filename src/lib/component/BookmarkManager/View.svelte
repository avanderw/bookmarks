<!-- src/lib/component/BookmarkManager/View.svelte -->
<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import type { Bookmark, BookmarkStore } from '$lib/bookmarks';
	import { SearchQueryFilter } from '$lib/component/SearchQueryFilter';
	import { BookmarkForm } from '$lib/component/BookmarkForm';
	import { Bookmarklet } from '$lib/component/Bookmarklet';
	import { exportBookmarks } from '$lib/storage';
	import {
		updateBookmarkClickCount,
		sortBookmarks,
		sortBookmarksByUsageRelevance,
		cleanExistingBookmarks
	} from './Logic';
	import { PaginationUtils } from './PaginationUtils';
	import { FileUtils } from './FileUtils';
	import { formatRelativeTime, formatFriendlyDate } from '$lib/utils/DateUtils';
	import { getShortUserAgentSummary } from '$lib/utils/UserAgentUtils';
	import { DuplicateDetector } from '$lib/component/DuplicateDetector';
	import { TagSummary } from '$lib/component/TagSummary';
	import { StorageMonitor } from '$lib/component/StorageMonitor';
	import SortingHelp from './SortingHelp.svelte';

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		bookmarkClicked: Bookmark;
		dataChanged: Bookmark[];
	}>();
	// Component props
	export let initialData: BookmarkStore | null = null; // Component state
	let bookmarks: Bookmark[] = [];
	let filteredBookmarks: Bookmark[] = [];
	let sortedBookmarks: Bookmark[] = [];
	let paginatedBookmarks: Bookmark[] = [];
	let sortOrder: string = 'usage';
	let isSearchActive = false;
	let previousSortOrder: string = sortOrder;
	let selectedBookmark: Bookmark | null = null;
	let viewingNotes: Bookmark | null = null;
	let showDuplicateDetector: boolean = false;
	let showTagSummary: boolean = false;
	let showStorageMonitor: boolean = false;
	let showSortingHelp: boolean = false;
	let showToolsMenu: boolean = false;
	let showImportModeDialog: boolean = false;
	let pendingImportFile: File | null = null;
	let isLocallyModified = false; // Flag to prevent store sync when we've intentionally modified data
	let refreshVersion = 0; // Used to force pagination recalculation when bookmarks are updated
	// Reference to search component to allow setting search from tag/domain clicks
	let searchFilterComponent: any;

	/**
	 * Add a tag to the filter/search input
	 */
	function onTagFilterClick(tag: string) {
		if (searchFilterComponent && searchFilterComponent.setQuery) {
			const current = searchFilterComponent.query || '';
			const tagSyntax = `#${tag}`;
			if (current.split(/\s+/).includes(tagSyntax)) return;
			const newQuery = current.trim() ? `${current.trim()} +${tagSyntax}` : tagSyntax;
			searchFilterComponent.setQuery(newQuery);
		}
	}

	/**
	 * Add a domain to the filter/search input
	 */
	function onDomainFilterClick(domain: string) {
		if (searchFilterComponent && searchFilterComponent.setQuery) {
			const current = searchFilterComponent.query || '';
			if (current.includes(domain)) return;
			const newQuery = current.trim() ? `${current.trim()} +${domain}` : domain;
			searchFilterComponent.setQuery(newQuery);
		}
	}
	// Pagination state
	let currentPage = 1;
	let itemsPerPage = 25; // Default to 25 for better user experience
	let totalPages = 0;
	let startIndex = 0;
	let endIndex = 0;

	// Performance optimization: cache for expensive calculations
	let lastSortedBookmarksLength = 0;
	let lastCurrentPage = 0;
	let lastItemsPerPage = 0;

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
			window.addEventListener('click', handleGlobalClick);

			// Handle storage full export event
			window.addEventListener('trigger-export', onExportRequested);
		}
	});

	// Watch for changes to initialData prop to sync with store updates
	$: if (initialData && initialData.bookmarks && !isLocallyModified) {
		// Check if we need to update (length different OR first bookmark URL different)
		const needsUpdate =
			initialData.bookmarks.length !== bookmarks.length ||
			(initialData.bookmarks.length > 0 &&
				bookmarks.length > 0 &&
				initialData.bookmarks[0].url !== bookmarks[0].url);

		if (needsUpdate) {
			bookmarks = [...initialData.bookmarks];
			filteredBookmarks = [...bookmarks];
		}
	}

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('dragenter', handleDragEnter);
			window.removeEventListener('dragover', handleDragOver);
			window.removeEventListener('dragleave', handleDragLeave);
			window.removeEventListener('drop', handleDrop);
			window.removeEventListener('click', handleGlobalClick);
			window.removeEventListener('trigger-export', onExportRequested);
		}
	});

	// Utility functions
	// -------------------------------------
	
	/**
	 * Remove duplicate bookmarks based on URL
	 * @param bookmarks Array of bookmarks to deduplicate
	 * @returns Object with deduplicatedBookmarks and duplicateCount
	 */
	function removeDuplicatesByUrl(bookmarks: Bookmark[]): { deduplicatedBookmarks: Bookmark[]; duplicateCount: number } {
		const seen = new Set<string>();
		const deduplicatedBookmarks: Bookmark[] = [];
		let duplicateCount = 0;

		for (const bookmark of bookmarks) {
			if (seen.has(bookmark.url)) {
				duplicateCount++;
				console.log(`🔍 Duplicate found: ${bookmark.title || 'Untitled'} (${bookmark.url})`);
			} else {
				seen.add(bookmark.url);
				deduplicatedBookmarks.push(bookmark);
			}
		}

		return { deduplicatedBookmarks, duplicateCount };
	}

	// File handling
	// -------------------------------------
	// File handling functions
	/**
	 * Handle file import event from FileManager
	 * @param event CustomEvent containing the file to import
	 */
	async function onFileImported(event: CustomEvent<File>) {
		try {
			// Store the file and show the import mode dialog
			pendingImportFile = event.detail;
			showImportModeDialog = true;
		} catch (error) {
			console.error('❌ Error importing file:', error);
			alert('Failed to import file. Please check the file format.');
		}
	}

	/**
	 * Process the import based on the selected mode
	 */
	async function processImport(mode: 'replace' | 'add') {
		if (!pendingImportFile) return;

		try {
			const result = await FileUtils.importFile(pendingImportFile);
			
			// Handle duplicates in the imported data
			const { deduplicatedBookmarks, duplicateCount } = removeDuplicatesByUrl(result.bookmarks);
			
			// Set flag to prevent store sync from overwriting our changes
			isLocallyModified = true;

			let finalBookmarks: Bookmark[] = [];
			let message = '';

			switch (mode) {
				case 'replace':
					finalBookmarks = deduplicatedBookmarks;
					message = `Import completed: ${deduplicatedBookmarks.length} bookmarks loaded (${duplicateCount} duplicates removed from file).`;
					break;
				
				case 'add':
					// Merge with existing bookmarks and remove overall duplicates
					const combined = [...bookmarks, ...deduplicatedBookmarks];
					const { deduplicatedBookmarks: finalDeduped, duplicateCount: totalDuplicates } = removeDuplicatesByUrl(combined);
					finalBookmarks = finalDeduped;
					const newBookmarks = finalDeduped.length - bookmarks.length;
					message = `Import completed: ${newBookmarks} new bookmarks added (${totalDuplicates} total duplicates removed).`;
					break;
			}

			// Update local component state
			bookmarks = finalBookmarks;
			filteredBookmarks = [...bookmarks];
			currentPage = 1; // Reset to first page

			// Notify parent component to update the store
			dispatch('dataChanged', bookmarks);
			
			// Reset the local modification flag after a brief delay to allow store to update
			setTimeout(() => {
				isLocallyModified = false;
			}, 100);

			// Show success message
			alert(message);

		} catch (error) {
			console.error('❌ Error processing import:', error);
			alert('Failed to import file. Please check the file format.');
		} finally {
			// Clean up
			showImportModeDialog = false;
			pendingImportFile = null;
		}
	}

	/**
	 * Cancel the import process
	 */
	function cancelImport() {
		showImportModeDialog = false;
		pendingImportFile = null;
	}

	/**
	 * Handle export request from FileManager
	 */
	function onExportRequested() {
		// Create a BookmarkStore from current data and export
		const bookmarkStore = {
			version: initialData?.version || '2025-08-13',
			bookmarks: bookmarks
		};
		exportBookmarks(bookmarkStore);
	} // Search handlers
	// -------------------------------------

	/**
	 * Handle filtered results from SearchQueryFilter
	 * @param event CustomEvent containing filtered data and search query
	 */
	function onFiltered(event: CustomEvent<{ data: Bookmark[]; query: string }>) {
		filteredBookmarks = event.detail.data;
		const newSearchActive = Boolean(event.detail.query && event.detail.query.trim() !== '');

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

		// Force Svelte to recalculate pagination and update the view
		filteredBookmarks = [...filteredBookmarks];
		refreshVersion++;

		// Dispatch event for parent component to handle (e.g., updating stores)
		dispatch('bookmarkClicked', updatedBookmark);
		dispatch('dataChanged', bookmarks);

		// Open the link in a new tab
		window.open(bookmark.url, '_blank', 'noopener');
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
			// Mark as locally modified to prevent store sync issues
			isLocallyModified = true;

			// Remove from bookmarks array
			bookmarks = bookmarks.filter((b) => b.url !== bookmark.url);

			// Update filtered bookmarks to match
			filteredBookmarks = filteredBookmarks.filter((b) => b.url !== bookmark.url);

			// Notify parent component of data change
			dispatch('dataChanged', bookmarks);

			// Clear the flag after a brief delay
			setTimeout(() => {
				isLocallyModified = false;
			}, 100);
		}
	}

	/**
	 * Clear all bookmarks after confirmation
	 */
	function onClearAllBookmarks() {
		const confirmed = confirm('Are you sure you want to delete ALL bookmarks? This action cannot be undone.');
		
		if (confirmed) {
			// Set flag to prevent store sync issues
			isLocallyModified = true;
			
			// Clear all bookmarks
			bookmarks = [];
			filteredBookmarks = [];
			currentPage = 1;
			
			// Notify parent component of data change
			dispatch('dataChanged', bookmarks);
			
			// Clear the flag after a brief delay
			setTimeout(() => {
				isLocallyModified = false;
			}, 100);
			
			alert('All bookmarks have been cleared.');
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
	 * Open the duplicate detector
	 */
	function onOpenDuplicateDetector() {
		showDuplicateDetector = true;
	}

	/**
	 * Close the duplicate detector
	 */
	function onCloseDuplicateDetector() {
		showDuplicateDetector = false;
	}

	/**
	 * Open the tag summary
	 */
	function onOpenTagSummary() {
		showTagSummary = true;
	}

	/**
	 * Close the tag summary
	 */
	function onCloseTagSummary() {
		showTagSummary = false;
	}

	/**
	 * Open the storage monitor
	 */
	function onOpenStorageMonitor() {
		showStorageMonitor = true;
	}

	/**
	 * Close the storage monitor
	 */
	function onCloseStorageMonitor() {
		showStorageMonitor = false;
	}

	/**
	 * Open the sorting help
	 */
	function onOpenSortingHelp() {
		showSortingHelp = true;
	}

	/**
	 * Close the sorting help
	 */
	function onCloseSortingHelp() {
		showSortingHelp = false;
	}

	/**
	 * Handle storage monitor events
	 */
	function onStorageExport() {
		showStorageMonitor = false;
		onExportRequested();
	}

	function onStorageCleanup() {
		showStorageMonitor = false;
		onOpenDuplicateDetector();
	}

	/**
	 * Handle tag click from tag summary - sets search to filter by that tag
	 */
	function onTagClick(event: CustomEvent<{ tag: string }>) {
		const tag = event.detail.tag;
		if (searchFilterComponent && searchFilterComponent.setQuery) {
			searchFilterComponent.setQuery(`tag:${tag}`);
		}
		showTagSummary = false;
	}

	/**
	 * Handle multiple tags selected from tag summary - sets search to filter by all tags
	 */
	function onTagsSelected(event: CustomEvent<{ tags: string[] }>) {
		const tags = event.detail.tags;
		if (searchFilterComponent && searchFilterComponent.setQuery && tags.length > 0) {
			const tagQuery = tags.map((tag) => `tag:${tag}`).join(' +');
			searchFilterComponent.setQuery(tagQuery);
		}
		showTagSummary = false;
	}

	/**
	 * Handle bookmark save (both add and edit)
	 * @param event CustomEvent containing the saved bookmark
	 */
	function onBookmarkSave(event: CustomEvent<Bookmark>) {
		const savedBookmark = event.detail;

		// Set flag to prevent store sync from overwriting our changes
		isLocallyModified = true;

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
		
		// Reset the local modification flag after a brief delay to allow store to update
		setTimeout(() => {
			isLocallyModified = false;
		}, 100);
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

	function handleGlobalClick(e: Event) {
		if (!showToolsMenu) return;
		
		const dropdown = (e.target as Element)?.closest('.dropdown');
		if (!dropdown) {
			showToolsMenu = false;
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
			: sortOrder === 'usage'
			? sortBookmarksByUsageRelevance(filteredBookmarks) // Use dedicated relevance function for performance
			: sortBookmarks(filteredBookmarks, sortOrder);

	// Calculate pagination values using utility (optimized to reduce recalculations)
	$: {
		const needsRecalculation =
			sortedBookmarks.length !== lastSortedBookmarksLength ||
			currentPage !== lastCurrentPage ||
			itemsPerPage !== lastItemsPerPage ||
			refreshVersion;

		if (needsRecalculation) {
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

			// Update cache
			lastSortedBookmarksLength = sortedBookmarks.length;
			lastCurrentPage = currentPage;
			lastItemsPerPage = itemsPerPage;
		}
	}

	/**
	 * Clean invalid URLs from existing bookmarks
	 */
	function onCleanUrls() {
		if (bookmarks.length === 0) {
			alert('No bookmarks to clean.');
			return;
		}

		// Use silent mode to avoid double alerts, we'll handle the UI feedback ourselves
		const cleanupResult = cleanExistingBookmarks(bookmarks, false);

		if (cleanupResult.removedCount === 0) {
			alert(`All ${bookmarks.length} bookmarks have valid URLs. No cleanup needed.`);
			return;
		}

		// Show confirmation dialog with details about what will be removed
		const removedList = cleanupResult.removedBookmarks
			.slice(0, 5) // Show up to 5 examples
			.map((b) => `• ${b.title || 'Untitled'} (${b.url})`)
			.join('\n');

		const moreText =
			cleanupResult.removedCount > 5 ? `\n...and ${cleanupResult.removedCount - 5} more` : '';

		const confirmMessage = `Found ${cleanupResult.removedCount} bookmark(s) with invalid URLs:\n\n${removedList}${moreText}\n\nDo you want to remove these invalid bookmarks?`;

		if (confirm(confirmMessage)) {
			// Mark as locally modified to prevent store sync from overriding our changes
			isLocallyModified = true;

			// Update bookmarks - this is destructive/reductive
			bookmarks = cleanupResult.cleanedBookmarks;
			filteredBookmarks = [...bookmarks];
			currentPage = 1; // Reset to first page

			// Notify parent component of data change
			dispatch('dataChanged', bookmarks);

			// Clear the flag after a brief delay to allow store update to complete
			setTimeout(() => {
				isLocallyModified = false;
			}, 100);

			alert(
				`Successfully removed ${cleanupResult.removedCount} bookmark(s) with invalid URLs.\n\n${cleanupResult.cleanedBookmarks.length} valid bookmarks remaining.`
			);
		}
	}

	/**
	 * Handle file input change event
	 */
	function handleFileInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target?.files && target.files[0]) {
			console.log('� File selected:', target.files[0].name);
			onFileImported(FileUtils.createFileEvent(target.files[0]));
		}
	}
</script>

<div class="bookmark-manager">
	<section class="header">
		<div class="toolbar">
			<div class="search-section">
				<SearchQueryFilter
					bind:this={searchFilterComponent}
					data={bookmarks}
					on:filtered={onFiltered}
					placeholder="Search bookmarks..."
				/>
			</div>

			<div class="action-section">
				<button
					class="btn-icon-only secondary"
					on:click={() => document.getElementById('fileInput')?.click()}
					title="Import bookmarks from file"
				>
					<svg><use href="feather-sprite.svg#upload" /></svg>
				</button>

				<button 
					class="btn-icon-only secondary" 
					on:click={onExportRequested} 
					title="Export all bookmarks to file"
				>
					<svg><use href="feather-sprite.svg#download" /></svg>
				</button>

				<button
					class="btn-icon-only secondary"
					on:click={onOpenTagSummary}
					title="Browse and filter by tags"
					disabled={bookmarks.length === 0}
				>
					<svg><use href="feather-sprite.svg#tag" /></svg>
				</button>

				<button
					class="btn-icon-only secondary"
					on:click={onOpenStorageMonitor}
					title="Monitor storage usage and get cleanup suggestions"
				>
					<svg><use href="feather-sprite.svg#database" /></svg>
				</button>

				<div class="dropdown">
					<button
						class="btn-icon-only secondary dropdown-toggle"
						title="More tools and options"
						on:click={() => showToolsMenu = !showToolsMenu}
					>
						<svg><use href="feather-sprite.svg#more-horizontal" /></svg>
					</button>
					{#if showToolsMenu}
						<div class="dropdown-menu" 
							role="menu" 
							tabindex="-1"
							on:click|stopPropagation
							on:keydown={(e) => e.key === 'Escape' && (showToolsMenu = false)}
						>
							<button
								class="dropdown-item"
								on:click={() => {onOpenDuplicateDetector(); showToolsMenu = false;}}
								disabled={bookmarks.length === 0}
							>
								<svg><use href="feather-sprite.svg#copy" /></svg>
								Find Duplicates
							</button>
							<button
								class="dropdown-item"
								on:click={() => {onCleanUrls(); showToolsMenu = false;}}
								disabled={bookmarks.length === 0}
							>
								<svg><use href="feather-sprite.svg#trash" /></svg>
								Clean Bookmarks
							</button>
						</div>
					{/if}
				</div>

				<BookmarkForm.Button
					on:save={onBookmarkSave}
					buttonClass="btn-compact"
					buttonText="Add Bookmark"
					existingBookmarks={bookmarks}
				/>

				<a
					href={getBookmarkletCode()}
					class="btn-compact secondary bookmarklet-button"
					title="Drag to your bookmarks bar to save bookmarks"
					draggable="true"
					on:dragstart={(e) => e.dataTransfer?.setData('text/plain', getBookmarkletCode())}
				>
					<svg><use href="feather-sprite.svg#bookmark" /></svg>
					Save to Bookmarks
				</a>
			</div>
		</div>

		<div class="settings-bar">
			<div class="display-settings">
				<div class="sort-section">
					<label>
						Sort by:
						<select bind:value={sortOrder}>
							{#if isSearchActive}
								<option value="relevance">Relevance</option>
							{/if}
							<option value="usage">Smart Usage</option>
							<option value="clicks">Clicks</option>
							<option value="date">Date Added</option>
							<option value="title">Title</option>
							<option value="url">URL</option>
						</select>
						{#if isSearchActive && sortOrder !== 'relevance'}
							<small class="text-muted">(search relevance overridden)</small>
						{/if}
					</label>
					{#if sortOrder === 'usage'}
						<button
							class="sort-help-button secondary"
							on:click={onOpenSortingHelp}
							title="Learn about Smart Usage sorting"
							type="button"
						>
							<svg><use href="feather-sprite.svg#help-circle" /></svg>
						</button>
					{/if}
				</div>

				<label>
					Items per page:
					<select bind:value={itemsPerPage}>
						<option value={25}>25</option>
						<option value={50}>50</option>
						<option value={100}>100</option>
						<option value={200}>200</option>
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
		on:change={handleFileInputChange}
	/>

	<section class="bookmark-list" class:drop-zone={isDragging} class:active={isDragging}>
		{#if sortedBookmarks.length === 0}
			<div class="text-center">
				<p>No bookmarks found. Import a bookmark file or add new bookmarks.</p>
			</div>
		{:else}
			<div class="bookmark-items condensed">
				{#each paginatedBookmarks as bookmark, index (`${bookmark.url}-${bookmark.added}-${index}`)}
					<!-- Condensed HN-style view -->
					<article class="bookmark-row-condensed">
						<div class="bookmark-line">
							<span class="bookmark-number condensed">{startIndex + index}.</span>
										<a
											href={bookmark.url}
											target="_blank"
											rel="noopener noreferrer"
											class="bookmark-link"
											on:click|preventDefault={() => onBookmarkClick(bookmark)}
											>{bookmark.title || 'Untitled'}</a
										>
													{#if bookmark.url}
														<span class="bookmark-domain">
															(
																<a href="#" class="domain-link" title="Filter by domain" on:click|preventDefault={() => onDomainFilterClick(bookmark.url.replace(/^https?:\/\/([^\/]+).*$/, '$1'))}>
																	{bookmark.url.replace(/^https?:\/\/([^\/]+).*$/, '$1')}
																</a>
															)
														</span>
													{/if}
							<div class="bookmark-actions-condensed">
								<button
									class="btn-icon"
									on:click={() => onEditBookmarkClick(bookmark)}
									title="Edit bookmark"
								>
									<svg><use href="feather-sprite.svg#edit" /></svg>
								</button>
								<button
									class="btn-icon"
									on:click={() => onDeleteBookmarkClick(bookmark)}
									title="Delete bookmark"
								>
									<svg><use href="feather-sprite.svg#trash-2" /></svg>
								</button>
							</div>
						</div>
						<div class="bookmark-meta-condensed">
							{#if bookmark.clicked > 0}
								<span>{bookmark.clicked} clicks</span>
								{#if bookmark.last}
									<span>visited {formatRelativeTime(bookmark.last)}</span>
								{/if}
							{:else}
								<span>never visited</span>
							{/if}
							
							{#if bookmark.added}
								<span>added {formatRelativeTime(bookmark.added)}</span>
							{/if}

							{#if bookmark.notes}
								<button
									class="btn-link"
									on:click={() => onViewNotesClick(bookmark)}
									title="View notes"
								>
									notes
								</button>
							{/if}

											{#if bookmark.tags && bookmark.tags.length > 0}
												<span class="tags-condensed">
													{#each bookmark.tags as tag, tagIndex}
														<button class="tag-condensed tag-link" type="button" title="Filter by tag" on:click={() => onTagFilterClick(tag)}>#{tag}</button>{tagIndex < bookmark.tags.length - 1 ? ', ' : ''}
													{/each}
												</span>
											{/if}

							{#if bookmark.description}
								<span class="description-condensed">— {bookmark.description}</span>
							{/if}
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
					<button class="btn-compact secondary" disabled={currentPage === 1} on:click={prevPage}>
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
			existingBookmarks={bookmarks}
			on:save={onBookmarkSave}
			on:close={() => (selectedBookmark = null)}
		/>
	{/if}

	<!-- Notes viewer (conditionally rendered) -->
	{#if viewingNotes}
		<dialog open on:click|self={onNotesClose}>
			<article on:click|stopPropagation>
				<header>
					<button aria-label="Close" data-rel="prev" on:click={onNotesClose} />
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

	<!-- Duplicate Detector (conditionally rendered) -->
	<DuplicateDetector
		{bookmarks}
		isOpen={showDuplicateDetector}
		on:close={onCloseDuplicateDetector}
		on:deleteBookmark={(e) => onDeleteBookmarkClick(e.detail)}
		on:editBookmark={(e) => onEditBookmarkClick(e.detail)}
		on:bookmarkClicked={(e) => onBookmarkClick(e.detail)}
	/>

	<!-- Tag Summary (conditionally rendered) -->
	<TagSummary
		{bookmarks}
		isOpen={showTagSummary}
		on:close={onCloseTagSummary}
		on:tagClick={onTagClick}
		on:tagsSelected={onTagsSelected}
	/>

	<!-- Storage Monitor (conditionally rendered) -->
	<StorageMonitor
		isOpen={showStorageMonitor}
		on:close={onCloseStorageMonitor}
		on:export={onStorageExport}
		on:cleanup={onStorageCleanup}
		on:clearAll={onClearAllBookmarks}
	/>

	<!-- Sorting Help (conditionally rendered) -->
	<SortingHelp {bookmarks} isOpen={showSortingHelp} on:close={onCloseSortingHelp} />

	<!-- Import Mode Dialog -->
	{#if showImportModeDialog}
		<dialog open>
			<article>
				<header>
					<h3>Import Bookmarks</h3>
					<p>How would you like to handle the imported bookmarks?</p>
				</header>
				
				<main>
					<div class="import-options">
						<p><strong>File:</strong> {pendingImportFile?.name || 'Unknown'}</p>
						<p>Choose an import mode:</p>
						
						<div class="button-group">
							<button 
								class="secondary" 
								on:click={() => processImport('add')}
								title="Add imported bookmarks to existing ones"
							>
								📥 Add to Current
							</button>
							
							<button 
								on:click={() => processImport('replace')}
								title="Replace all bookmarks with imported ones"
							>
								🔄 Replace All
							</button>
						</div>
					</div>
				</main>
				
				<footer>
					<button 
						class="secondary"
						on:click={cancelImport}
					>
						Cancel
					</button>
				</footer>
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

	.sort-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sort-help-button {
		padding: 0.25rem;
		margin: 0;
		min-width: auto;
		width: auto;
		height: auto;
		border-radius: var(--pico-border-radius);
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.sort-help-button:hover {
		transform: translateY(-1px);
	}

	.sort-help-button svg {
		width: 14px;
		height: 14px;
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

		.bookmark-meta-condensed {
			margin-left: 1rem;
		}

		.bookmark-number {
			min-width: 1.5rem;
		}
	}

	/* Condensed (HN-style) View Styles */
	.bookmark-items.condensed {
		font-size: 0.875rem;
		line-height: 1.3;
		max-width: none; /* Remove any max-width constraints */
	}

	.bookmark-row-condensed {
		padding: 0.0625rem 0; /* Even tighter spacing */
		margin: 0;
		border: none;
		background: none;
	}

	.bookmark-line {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.bookmark-number {
		color: var(--pico-muted-color);
		font-size: 0.8em;
		margin-right: 0.25rem;
		min-width: 1.75rem;
		display: inline-block;
		text-align: right;
		flex-shrink: 0;
	}

	.bookmark-number.condensed {
		font-size: 0.75rem;
		min-width: 1.5rem;
		margin-right: 0.375rem;
	}

	.bookmark-link {
		color: var(--pico-color);
		text-decoration: none;
		font-weight: normal;
		flex: 1;
		min-width: 0; /* Allow text to truncate */
	}

	.bookmark-link:hover {
		color: var(--pico-primary);
		text-decoration: underline;
	}

	.bookmark-domain {
		color: var(--pico-muted-color);
		font-size: 0.85em;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.bookmark-actions-condensed {
		display: flex;
		gap: 0.125rem;
		margin-left: auto;
		opacity: 0;
		transition: opacity 0.15s ease;
		flex-shrink: 0;
	}

	.bookmark-row-condensed:hover .bookmark-actions-condensed {
		opacity: 1;
	}

	.btn-icon {
		padding: 0.125rem;
		margin: 0;
		min-width: auto;
		width: auto;
		height: auto;
		background: none;
		border: none;
		color: var(--pico-muted-color);
		cursor: pointer;
		border-radius: 2px;
		transition: all 0.15s ease;
	}

	.btn-icon:hover {
		background: var(--pico-secondary-background);
		color: var(--pico-secondary);
	}

	.btn-icon svg {
		width: 12px;
		height: 12px;
	}

	.bookmark-meta-condensed {
		font-size: 0.75rem;
		color: var(--pico-muted-color);
		margin-left: 2rem;
		margin-top: 0.05rem;
		margin-bottom: 0.25rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		line-height: 1.2;
	}

	.bookmark-meta-condensed span {
		margin: 0;
	}

	.btn-link {
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		color: var(--pico-muted-color);
		text-decoration: underline;
		cursor: pointer;
		font-size: inherit;
		min-width: auto;
		width: auto;
		height: auto;
	}

	.btn-link:hover {
		color: var(--pico-color);
	}

	.tags-condensed {
		color: var(--pico-muted-color);
	}

	.tag-condensed {
		color: var(--pico-primary);
		text-decoration: none;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		font-size: inherit;
		font-family: inherit;
	}

.tag-condensed.tag-link:hover {
	text-decoration: underline;
	color: var(--pico-secondary);
	}

.domain-link {
	color: var(--pico-primary);
	text-decoration: none;
	cursor: pointer;
	background: none;
	border: none;
	font-size: inherit;
	font-family: inherit;
	padding: 0;
	display: inline;
	margin: 0;
	outline: none;
	transition: color 0.15s;
	line-height: inherit;
	vertical-align: baseline;
	appearance: none;
	box-shadow: none;
	background-color: transparent;
	border-radius: 0;
	font-weight: normal;
	letter-spacing: normal;
	word-break: break-all;
	white-space: normal;
	user-select: text;
	text-align: left;
	text-overflow: ellipsis;
	overflow: hidden;
	max-width: 200px;
}
.domain-link:hover {
	text-decoration: underline;
	color: var(--pico-secondary);
}

	.description-condensed {
		color: var(--pico-muted-color);
		font-style: italic;
	}

	/* Compact pagination for condensed view */
	.pagination {
		margin: 0.5rem 0;
	}

	.pagination .pagination-info {
		font-size: 0.75rem;
		margin: 0.25rem 0;
	}

	/* Icon-only button styles */
	.btn-icon-only {
		padding: 0.5rem;
		margin: 0.125rem;
		min-width: auto;
		width: auto;
		height: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0;
		border-radius: var(--pico-border-radius);
		transition: all 0.2s ease;
	}

	.btn-icon-only svg {
		width: 1rem;
		height: 1rem;
	}

	.btn-icon-only:hover {
		transform: translateY(-1px);
	}

	.btn-icon-only:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;
	}

	/* Dropdown styles */
	.dropdown {
		position: relative;
		display: inline-block;
	}

	.dropdown-menu {
		position: absolute;
		top: 100%;
		right: 0;
		background: var(--pico-card-background-color);
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		box-shadow: var(--pico-box-shadow);
		z-index: 1000;
		min-width: 160px;
		padding: 0.25rem 0;
		margin-top: 0.125rem;
	}

	.dropdown-item {
		width: 100%;
		padding: 0.5rem 1rem;
		margin: 0;
		border: none;
		background: none;
		color: var(--pico-color);
		text-align: left;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		transition: background-color 0.2s ease;
	}

	.dropdown-item:hover:not(:disabled) {
		background: var(--pico-secondary-background);
	}

	.dropdown-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.dropdown-item svg {
		width: 0.875rem;
		height: 0.875rem;
		flex-shrink: 0;
	}

	/* Responsive adjustments for condensed view */
	@media (max-width: 768px) {
		.bookmark-line {
			flex-direction: column;
			align-items: flex-start;
		}

		.bookmark-actions-condensed {
			margin-left: 0;
			align-self: flex-end;
		}

		.bookmark-meta-condensed {
			margin-left: 1rem;
		}

		.bookmark-number {
			min-width: 1.5rem;
		}
	}

	/* Import Dialog Styles */
	.import-options {
		text-align: center;
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-top: 1rem;
	}

	.button-group button {
		flex: 1;
		min-width: 140px;
	}

	dialog {
		border: none;
		border-radius: var(--pico-border-radius);
		box-shadow: var(--pico-box-shadow);
		max-width: 500px;
	}

	dialog::backdrop {
		background-color: rgba(0, 0, 0, 0.5);
	}
</style>
