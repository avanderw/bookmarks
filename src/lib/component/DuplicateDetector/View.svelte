<!-- src/lib/component/DuplicateDetector/View.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Bookmark } from '$lib/bookmarks';
	import {
		analyzeDuplicates,
		getSuggestedAction,
		getConfidenceColor,
		getTypeLabel,
		type DuplicateAnalysis,
		type DuplicateGroup
	} from './Logic';
	import { formatRelativeTime } from '$lib/utils/DateUtils';

	// Props
	export let bookmarks: Bookmark[] = [];
	export let isOpen: boolean = false;

	// Event dispatcher
	const dispatch = createEventDispatcher<{
		close: void;
		deleteBookmark: Bookmark;
		editBookmark: Bookmark;
		bookmarkClicked: Bookmark;
	}>();

	// Component state
	let analysis: DuplicateAnalysis;
	let selectedGroupTypes: Set<string> = new Set(['exact_url', 'similar_url', 'similar_title']);
	let expandedGroups: Set<string> = new Set();
	let minConfidence: number = 0.6;

	// Reactive analysis
	$: if (bookmarks.length > 0) {
		analysis = analyzeDuplicates(bookmarks);
	}

	// Filtered groups based on user preferences
	$: filteredGroups =
		analysis?.duplicateGroups.filter(
			(group) => selectedGroupTypes.has(group.type) && group.confidence >= minConfidence
		) || [];

	function toggleGroupType(type: string) {
		if (selectedGroupTypes.has(type)) {
			selectedGroupTypes.delete(type);
		} else {
			selectedGroupTypes.add(type);
		}
		selectedGroupTypes = new Set(selectedGroupTypes);
	}

	function toggleGroupExpansion(groupId: string) {
		if (expandedGroups.has(groupId)) {
			expandedGroups.delete(groupId);
		} else {
			expandedGroups.add(groupId);
		}
		expandedGroups = new Set(expandedGroups);
	}

	function handleBookmarkClick(bookmark: Bookmark) {
		dispatch('bookmarkClicked', bookmark);
	}

	function handleEditBookmark(bookmark: Bookmark) {
		dispatch('editBookmark', bookmark);
	}

	function handleDeleteBookmark(bookmark: Bookmark) {
		if (confirm(`Delete "${bookmark.title || bookmark.url}"?`)) {
			dispatch('deleteBookmark', bookmark);
		}
	}

	function handleClose() {
		dispatch('close');
	}

	// Keep only the newest bookmark in a group
	function keepNewest(group: DuplicateGroup) {
		const sortedByDate = [...group.bookmarks].sort(
			(a, b) => new Date(b.added).getTime() - new Date(a.added).getTime()
		);

		// Delete all except the newest
		for (let i = 1; i < sortedByDate.length; i++) {
			handleDeleteBookmark(sortedByDate[i]);
		}
	}

	// Keep the most clicked bookmark in a group
	function keepMostClicked(group: DuplicateGroup) {
		const sortedByClicks = [...group.bookmarks].sort((a, b) => b.clicked - a.clicked);

		// Delete all except the most clicked
		for (let i = 1; i < sortedByClicks.length; i++) {
			handleDeleteBookmark(sortedByClicks[i]);
		}
	}

	function expandAll() {
		expandedGroups = new Set(filteredGroups.map((g) => g.id));
	}

	function collapseAll() {
		expandedGroups = new Set();
	}
</script>

{#if isOpen}
	<dialog open on:click|self={handleClose}>
		<article class="duplicate-detector" on:click|stopPropagation>
			<header>
				<button aria-label="Close" on:click={handleClose} />
				<h2>
					<svg><use href="feather-sprite.svg#copy" /></svg>
					Duplicate Detector
				</h2>
			</header>

			{#if !analysis}
				<div class="loading">
					<p>Analyzing bookmarks...</p>
				</div>
			{:else}
				<div class="analysis-summary">
					<div class="stats-grid">
						<div class="stat-card">
							<div class="stat-number">{analysis.totalBookmarks}</div>
							<div class="stat-label">Total Bookmarks</div>
						</div>
						<div class="stat-card">
							<div class="stat-number">{analysis.duplicateCount}</div>
							<div class="stat-label">Potential Duplicates</div>
						</div>
						<div class="stat-card">
							<div class="stat-number">{analysis.duplicateGroups.length}</div>
							<div class="stat-label">Duplicate Groups</div>
						</div>
						<div class="stat-card">
							<div class="stat-number">{analysis.uniqueCount}</div>
							<div class="stat-label">Unique Bookmarks</div>
						</div>
					</div>
				</div>

				<div class="controls">
					<div class="filter-section">
						<h3>Filter Options</h3>
						<div class="filter-grid">
							<div class="filter-group">
								<span>Detection Types:</span>
								<div class="type-filters">
									<label class="checkbox-label">
										<input
											type="checkbox"
											checked={selectedGroupTypes.has('exact_url')}
											on:change={() => toggleGroupType('exact_url')}
										/>
										Exact Duplicates
									</label>
									<label class="checkbox-label">
										<input
											type="checkbox"
											checked={selectedGroupTypes.has('similar_url')}
											on:change={() => toggleGroupType('similar_url')}
										/>
										Similar URLs
									</label>
									<label class="checkbox-label">
										<input
											type="checkbox"
											checked={selectedGroupTypes.has('similar_title')}
											on:change={() => toggleGroupType('similar_title')}
										/>
										Similar Titles
									</label>
									<label class="checkbox-label">
										<input
											type="checkbox"
											checked={selectedGroupTypes.has('same_domain')}
											on:change={() => toggleGroupType('same_domain')}
										/>
										Same Domain
									</label>
								</div>
							</div>

							<div class="filter-group">
								<label>
									Minimum Confidence: {Math.round(minConfidence * 100)}%
									<input type="range" min="0.5" max="1" step="0.05" bind:value={minConfidence} />
								</label>
							</div>
						</div>

						<div class="view-controls">
							<button class="btn-compact secondary" on:click={expandAll}>
								<svg><use href="feather-sprite.svg#maximize-2" /></svg>
								Expand All
							</button>
							<button class="btn-compact secondary" on:click={collapseAll}>
								<svg><use href="feather-sprite.svg#minimize-2" /></svg>
								Collapse All
							</button>
						</div>
					</div>
				</div>

				<div class="duplicate-groups">
					{#if filteredGroups.length === 0}
						<div class="no-results">
							<p>
								{#if analysis.duplicateGroups.length === 0}
									🎉 No duplicates found! Your bookmarks are well organized.
								{:else}
									No duplicates match your current filter criteria.
								{/if}
							</p>
						</div>
					{:else}
						{#each filteredGroups as group (group.id)}
							<div class="duplicate-group">
								<div
									class="group-header"
									role="button"
									tabindex="0"
									on:click={() => toggleGroupExpansion(group.id)}
									on:keydown={(e) => e.key === 'Enter' && toggleGroupExpansion(group.id)}
								>
									<div class="group-info">
										<span class="group-type" style="color: {getConfidenceColor(group.confidence)}">
											{getTypeLabel(group.type)}
										</span>
										<span class="group-reason">{group.reason}</span>
										<span
											class="confidence-badge"
											style="background-color: {getConfidenceColor(group.confidence)}"
										>
											{Math.round(group.confidence * 100)}%
										</span>
									</div>
									<div class="group-actions">
										<span class="bookmark-count">{group.bookmarks.length} bookmarks</span>
										<svg class="expand-icon" class:expanded={expandedGroups.has(group.id)}>
											<use href="feather-sprite.svg#chevron-down" />
										</svg>
									</div>
								</div>

								{#if expandedGroups.has(group.id)}
									<div class="group-content">
										<div class="group-suggestion">
											<strong>Suggestion:</strong>
											{getSuggestedAction(group)}
										</div>

										<div class="bulk-actions">
											<button
												class="btn-compact secondary"
												on:click={() => keepNewest(group)}
												title="Keep only the newest bookmark"
											>
												<svg><use href="feather-sprite.svg#clock" /></svg>
												Keep Newest
											</button>
											<button
												class="btn-compact secondary"
												on:click={() => keepMostClicked(group)}
												title="Keep only the most clicked bookmark"
											>
												<svg><use href="feather-sprite.svg#mouse-pointer" /></svg>
												Keep Most Used
											</button>
										</div>

										<div class="bookmark-list">
											{#each group.bookmarks as bookmark, index (bookmark.url)}
												<div class="bookmark-item">
													<div class="bookmark-content">
														<div class="bookmark-title">
															<span class="bookmark-index">{index + 1}.</span>
															<a
																href={bookmark.url}
																target="_blank"
																rel="noopener noreferrer"
																on:click|preventDefault={() => handleBookmarkClick(bookmark)}
															>
																{bookmark.title || 'Untitled'}
															</a>
														</div>

														<div class="bookmark-url">
															{bookmark.url}
														</div>

														{#if bookmark.description}
															<div class="bookmark-description">
																{bookmark.description}
															</div>
														{/if}

														<div class="bookmark-meta">
															<span>
																{bookmark.clicked} clicks
															</span>
															<span>
																added {formatRelativeTime(bookmark.added)}
															</span>
															{#if bookmark.last}
																<span>
																	last visited {formatRelativeTime(bookmark.last)}
																</span>
															{/if}
														</div>
													</div>

													<div class="bookmark-actions">
														<button
															class="btn-compact secondary"
															on:click={() => handleEditBookmark(bookmark)}
															title="Edit bookmark"
														>
															<svg><use href="feather-sprite.svg#edit" /></svg>
														</button>
														<button
															class="btn-compact secondary"
															on:click={() => handleDeleteBookmark(bookmark)}
															title="Delete bookmark"
														>
															<svg><use href="feather-sprite.svg#trash-2" /></svg>
														</button>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</article>
	</dialog>
{/if}

<style>
	.duplicate-detector {
		max-width: 90vw;
		max-height: 90vh;
		width: 1000px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.duplicate-detector header h2 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
	}

	.analysis-summary {
		border-bottom: 1px solid var(--pico-muted-border-color);
		padding-bottom: 1rem;
		margin-bottom: 1rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	.stat-card {
		text-align: center;
		padding: 1rem;
		background: var(--pico-card-background-color);
		border-radius: var(--pico-border-radius);
		border: 1px solid var(--pico-muted-border-color);
	}

	.stat-number {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--pico-primary);
	}

	.stat-label {
		font-size: 0.875rem;
		color: var(--pico-muted-color);
		margin-top: 0.25rem;
	}

	.controls {
		border-bottom: 1px solid var(--pico-muted-border-color);
		padding-bottom: 1rem;
		margin-bottom: 1rem;
	}

	.controls h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 2rem;
		align-items: start;
	}

	.filter-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.type-filters {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.checkbox-label {
		display: flex !important;
		align-items: center;
		gap: 0.5rem;
		margin: 0 !important;
		font-weight: normal !important;
	}

	.view-controls {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.duplicate-groups {
		flex: 1;
		overflow-y: auto;
	}

	.no-results {
		text-align: center;
		padding: 2rem;
		color: var(--pico-muted-color);
	}

	.duplicate-group {
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		margin-bottom: 1rem;
	}

	.group-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		cursor: pointer;
		background: var(--pico-card-background-color);
		border-radius: var(--pico-border-radius);
		transition: background-color 0.2s;
	}

	.group-header:hover {
		background: var(--pico-card-sectioning-background-color);
	}

	.group-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.group-type {
		font-weight: 600;
		font-size: 0.875rem;
		/* Color will be set inline based on confidence */
	}

	.group-reason {
		color: var(--pico-color);
		font-size: 0.875rem;
	}

	.confidence-badge {
		color: var(--pico-contrast);
		padding: 0.125rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.group-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.bookmark-count {
		font-size: 0.875rem;
		color: var(--pico-muted-color);
	}

	.expand-icon {
		width: 1.25rem;
		height: 1.25rem;
		transition: transform 0.2s;
	}

	.expand-icon.expanded {
		transform: rotate(180deg);
	}

	.group-content {
		padding: 1rem;
		border-top: 1px solid var(--pico-muted-border-color);
	}

	.group-suggestion {
		background: var(--pico-card-sectioning-background-color);
		padding: 0.75rem;
		border-radius: var(--pico-border-radius);
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.bulk-actions {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.bookmark-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.bookmark-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 0.75rem;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		background: var(--pico-background-color);
	}

	.bookmark-content {
		flex: 1;
		min-width: 0;
	}

	.bookmark-title {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.bookmark-index {
		color: var(--pico-muted-color);
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.bookmark-title a {
		font-weight: 500;
		text-decoration: none;
		word-break: break-all;
		color: var(--pico-color);
	}

	.bookmark-title a:hover {
		text-decoration: underline;
		color: var(--pico-primary);
	}

	.bookmark-url {
		font-size: 0.75rem;
		color: var(--pico-muted-color);
		word-break: break-all;
		margin-bottom: 0.25rem;
	}

	.bookmark-description {
		font-size: 0.875rem;
		color: var(--pico-color);
		margin-bottom: 0.25rem;
	}

	.bookmark-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--pico-muted-color);
		flex-wrap: wrap;
	}

	.bookmark-actions {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
		margin-left: 1rem;
	}

	.bookmark-actions button {
		padding: 0.25rem;
		margin: 0;
		min-width: auto;
	}

	@media (max-width: 768px) {
		.duplicate-detector {
			width: 95vw;
			max-height: 95vh;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.filter-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.type-filters {
			flex-direction: column;
			gap: 0.5rem;
		}

		.bookmark-item {
			flex-direction: column;
			gap: 0.75rem;
		}

		.bookmark-actions {
			align-self: flex-end;
			margin-left: 0;
		}
	}
</style>
