<!-- SortingHelp.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { explainRelevanceScore, analyzeRelevanceDistribution } from '$lib/utils/RelevanceUtils';
	import type { Bookmark } from '$lib/bookmarks';

	export let isOpen = false;
	export let bookmarks: Bookmark[] = [];

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	function close() {
		dispatch('close');
	}

	// Analyze the current bookmarks for demo purposes
	$: stats = bookmarks.length > 0 ? analyzeRelevanceDistribution(bookmarks) : null;

	// Get some example bookmarks for demonstration
	$: exampleBookmarks = bookmarks.slice(0, 3);
</script>

{#if isOpen}
	<dialog open on:click|self={close}>
		<article class="sorting-help-article" on:click|stopPropagation>
			<header>
				<button aria-label="Close" on:click={close} />
				<h3>Smart Usage Sorting Explained</h3>
			</header>

			<div class="sorting-help-content">
				<section class="overview-section">
					<h4>What is Smart Usage Sorting?</h4>
					<p>
						Smart Usage sorts your bookmarks by <strong
							>relevance based on your actual usage patterns</strong
						>, with built-in time decay to ensure frequently used bookmarks rise to the top while
						stale bookmarks naturally fall down the list as your behavior changes.
					</p>
				</section>

				<section class="algorithm-section">
					<h4>How the Algorithm Works</h4>
					<div class="formula-explanation">
						<div class="formula">
							<strong>Relevance Score = (Click Score × 70%) + (Recency Score × 30%)</strong>
						</div>
						<div class="sub-formulas">
							<div><strong>Click Score:</strong> Number of clicks ÷ 100 (capped at 1.0)</div>
							<div>
								<strong>Recency Score:</strong> Exponential decay based on time since last visit
							</div>
						</div>
					</div>

					<div class="factors-grid">
						<div class="factor-card high">
							<h5>High Relevance (0.7+)</h5>
							<ul>
								<li>Frequently clicked (20+ times)</li>
								<li>Recently visited (within 30 days)</li>
								<li>Both clicks and recency</li>
							</ul>
						</div>

						<div class="factor-card medium">
							<h5>Medium Relevance (0.3-0.7)</h5>
							<ul>
								<li>Moderate usage (5-20 clicks)</li>
								<li>Visited 1-3 months ago</li>
								<li>New bookmarks (1 week old)</li>
							</ul>
						</div>

						<div class="factor-card low">
							<h5>Low Relevance (0.1-0.3)</h5>
							<ul>
								<li>Rarely clicked (1-5 times)</li>
								<li>Not visited in 3+ months</li>
								<li>Never clicked, old bookmarks</li>
							</ul>
						</div>
					</div>
				</section>

				<section class="decay-section">
					<h4>Time Decay Explained</h4>
					<div class="decay-timeline">
						<div class="timeline-item">
							<strong>Recent (0-30 days):</strong> Full recency score with gradual decay
						</div>
						<div class="timeline-item">
							<strong>Stale (30-90 days):</strong> Exponential decay kicks in
						</div>
						<div class="timeline-item">
							<strong>Old (90+ days):</strong> Rapid decay, relies mainly on click count
						</div>
						<div class="timeline-item">
							<strong>Never clicked:</strong> Small boost for new bookmarks (7 days), then minimum score
						</div>
					</div>
				</section>

				{#if stats}
					<section class="current-stats">
						<h4>Your Bookmark Collection Analysis</h4>
						<div class="stats-grid">
							<div class="stat-item">
								<strong>{stats.highRelevanceCount}</strong>
								<span>High Relevance</span>
							</div>
							<div class="stat-item">
								<strong>{stats.mediumRelevanceCount}</strong>
								<span>Medium Relevance</span>
							</div>
							<div class="stat-item">
								<strong>{stats.lowRelevanceCount}</strong>
								<span>Low Relevance</span>
							</div>
							<div class="stat-item">
								<strong>{stats.neverClickedCount}</strong>
								<span>Never Clicked</span>
							</div>
							<div class="stat-item">
								<strong>{stats.staleCount}</strong>
								<span>Stale (90+ days)</span>
							</div>
							<div class="stat-item">
								<strong>{stats.averageScore.toFixed(3)}</strong>
								<span>Average Score</span>
							</div>
						</div>
					</section>
				{/if}

				{#if exampleBookmarks.length > 0}
					<section class="examples-section">
						<h4>Examples from Your Bookmarks</h4>
						<div class="examples-list">
							{#each exampleBookmarks as bookmark}
								<div class="example-bookmark">
									<div class="bookmark-title">
										{bookmark.title || 'Untitled'}
									</div>
									<div class="bookmark-explanation">
										{explainRelevanceScore(bookmark)}
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<section class="benefits-section">
					<h4>Benefits of Smart Usage Sorting</h4>
					<div class="benefits-grid">
						<div class="benefit-card">
							<h5>🎯 Adaptive</h5>
							<p>Automatically adjusts to your changing browsing habits</p>
						</div>
						<div class="benefit-card">
							<h5>⏰ Time-Aware</h5>
							<p>Recent activity weighs more than old usage patterns</p>
						</div>
						<div class="benefit-card">
							<h5>🧹 Self-Cleaning</h5>
							<p>Stale bookmarks naturally sink to the bottom</p>
						</div>
						<div class="benefit-card">
							<h5>🆕 New-Friendly</h5>
							<p>Recently added bookmarks get a temporary boost</p>
						</div>
					</div>
				</section>

				<section class="comparison-section">
					<h4>Compared to Other Sorting Options</h4>
					<div class="comparison-table">
						<div class="comparison-row header">
							<div>Sort Method</div>
							<div>Best For</div>
							<div>Adapts Over Time</div>
						</div>
						<div class="comparison-row">
							<div><strong>Smart Usage</strong></div>
							<div>Daily browsing, frequently used bookmarks first</div>
							<div>✅ Yes</div>
						</div>
						<div class="comparison-row">
							<div><strong>Clicks</strong></div>
							<div>Finding most popular bookmarks ever</div>
							<div>❌ No</div>
						</div>
						<div class="comparison-row">
							<div><strong>Date Added</strong></div>
							<div>Seeing newest additions first</div>
							<div>❌ No</div>
						</div>
						<div class="comparison-row">
							<div><strong>Title/URL</strong></div>
							<div>Finding specific bookmark by name</div>
							<div>❌ No</div>
						</div>
					</div>
				</section>

				<section class="tips-section">
					<h4>Pro Tips</h4>
					<ul>
						<li>
							<strong>Default Choice:</strong> Smart Usage is now the default sort - perfect for daily
							use
						</li>
						<li>
							<strong>Combine with Search:</strong> Use search filters to find specific bookmarks, then
							let Smart Usage prioritize results
						</li>
						<li>
							<strong>Regular Cleanup:</strong> Use filters like <code>clicked:=0 added:>90</code> to
							find candidates for removal
						</li>
						<li>
							<strong>Track Patterns:</strong> Watch how your most-used bookmarks change over time
						</li>
						<li>
							<strong>New Bookmarks:</strong> Recently added bookmarks get a 7-day boost to encourage
							trial use
						</li>
					</ul>
				</section>
			</div>
		</article>
	</dialog>
{/if}

<style>
	.sorting-help-content {
		max-height: 75vh;
		overflow-y: auto;
		font-size: 0.95rem;
		line-height: 1.5;
	}

	section {
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--pico-muted-border-color);
	}

	section:last-child {
		border-bottom: none;
	}

	h4 {
		color: var(--pico-primary);
		margin-bottom: 0.75rem;
		margin-top: 0;
	}

	h5 {
		margin-bottom: 0.5rem;
		margin-top: 0;
	}

	.formula-explanation {
		background-color: var(--pico-card-sectioning-background-color);
		padding: 1rem;
		border-radius: var(--pico-border-radius);
		margin-bottom: 1rem;
	}

	.formula {
		font-size: 1.1rem;
		margin-bottom: 0.75rem;
		text-align: center;
	}

	.sub-formulas {
		display: grid;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: var(--pico-muted-color);
	}

	.factors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.factor-card {
		padding: 1rem;
		border-radius: var(--pico-border-radius);
		border: 1px solid var(--pico-muted-border-color);
	}

	.factor-card.high {
		border-left: 4px solid var(--pico-ins-color);
	}

	.factor-card.medium {
		border-left: 4px solid var(--pico-secondary);
	}

	.factor-card.low {
		border-left: 4px solid var(--pico-del-color);
	}

	.factor-card ul {
		margin: 0.5rem 0 0 0;
		padding-left: 1.25rem;
	}

	.factor-card li {
		margin-bottom: 0.25rem;
		font-size: 0.875rem;
	}

	.decay-timeline {
		display: grid;
		gap: 0.75rem;
	}

	.timeline-item {
		padding: 0.75rem;
		background-color: var(--pico-card-sectioning-background-color);
		border-radius: var(--pico-border-radius);
		border-left: 3px solid var(--pico-primary);
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	.stat-item {
		text-align: center;
		padding: 1rem;
		background-color: var(--pico-card-sectioning-background-color);
		border-radius: var(--pico-border-radius);
	}

	.stat-item strong {
		display: block;
		font-size: 1.5rem;
		color: var(--pico-primary);
		margin-bottom: 0.25rem;
	}

	.stat-item span {
		font-size: 0.875rem;
		color: var(--pico-muted-color);
	}

	.examples-list {
		display: grid;
		gap: 0.75rem;
	}

	.example-bookmark {
		padding: 0.75rem;
		background-color: var(--pico-card-sectioning-background-color);
		border-radius: var(--pico-border-radius);
	}

	.bookmark-title {
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	.bookmark-explanation {
		font-size: 0.875rem;
		color: var(--pico-muted-color);
		font-family: var(--pico-font-family-monospace);
	}

	.benefits-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.benefit-card {
		padding: 1rem;
		background-color: var(--pico-card-sectioning-background-color);
		border-radius: var(--pico-border-radius);
		text-align: center;
	}

	.benefit-card h5 {
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
	}

	.benefit-card p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--pico-muted-color);
	}

	.comparison-table {
		display: grid;
		gap: 0.5rem;
	}

	.comparison-row {
		display: grid;
		grid-template-columns: 1fr 2fr 1fr;
		gap: 1rem;
		padding: 0.75rem;
		border-radius: var(--pico-border-radius);
	}

	.comparison-row.header {
		background-color: var(--pico-primary-background);
		font-weight: 500;
	}

	.comparison-row:not(.header) {
		background-color: var(--pico-card-sectioning-background-color);
	}

	.tips-section ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.tips-section li {
		margin-bottom: 0.75rem;
		line-height: 1.6;
	}

	code {
		background-color: var(--pico-code-background-color);
		padding: 0.125rem 0.25rem;
		border-radius: 3px;
		font-family: var(--pico-font-family-monospace);
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.sorting-help-content {
			max-height: 70vh;
		}

		.factors-grid,
		.benefits-grid {
			grid-template-columns: 1fr;
		}

		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.comparison-row {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.comparison-row.header {
			display: none;
		}

		.comparison-row:not(.header) {
			padding: 1rem;
		}

		.comparison-row:not(.header) div:first-child {
			font-weight: 500;
			border-bottom: 1px solid var(--pico-muted-border-color);
			padding-bottom: 0.5rem;
			margin-bottom: 0.5rem;
		}
	}
</style>
