<!-- FilterHelp.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;

	const dispatch = createEventDispatcher<{
		close: void;
		applyExample: string;
	}>();

	function applyExample(query: string) {
		dispatch('applyExample', query);
	}

	function close() {
		dispatch('close');
	}

	const examples = [
		{
			category: 'Bookmark Cleanup (Find candidates for removal)',
			items: [
				{ query: 'clicked:=0 added:>90', description: 'Old bookmarks never used (90+ days)' },
				{ query: 'clicked:=0 device:mobile', description: 'Mobile bookmarks to review' },
				{
					query: 'clicked:>365 -tag:important',
					description: 'Old unimportant bookmarks (1+ year)'
				},
				{ query: 'added:>365 clicked:=0', description: 'Year-old bookmarks never clicked' }
			]
		},
		{
			category: 'Current Device Relevance',
			items: [
				{ query: 'device:mobile +tutorial', description: 'Mobile-saved tutorials' },
				{ query: 'browser:chrome os:windows', description: 'Bookmarks from current setup' },
				{ query: 'device:desktop +work', description: 'Work bookmarks from desktop' },
				{ query: 'os:android device:mobile', description: 'Android mobile bookmarks' }
			]
		},
		{
			category: 'Click Activity Analysis',
			items: [
				{ query: 'clicked:=0', description: 'Never clicked bookmarks' },
				{ query: 'clicked:>90', description: 'Not clicked in 90+ days' },
				{ query: 'clicked:<7', description: 'Recently clicked (last week)' },
				{ query: 'clicked:>30 clicked:<90', description: 'Moderately stale (1-3 months)' }
			]
		},
		{
			category: 'Tag Management',
			items: [
				{ query: 'tag:javascript +tutorial', description: 'JavaScript learning resources' },
				{ query: '-tag:archived', description: 'Exclude archived bookmarks' },
				{ query: 'tag:work device:mobile', description: 'Work bookmarks saved on mobile' },
				{ query: '-tag:deprecated tag:library', description: 'Current libraries (not deprecated)' }
			]
		},
		{
			category: 'Date-Based Filters',
			items: [
				{ query: 'added:>365', description: 'Bookmarks older than 1 year' },
				{ query: 'added:<7', description: 'Bookmarks added this week' },
				{ query: 'added:>30 added:<90', description: 'Added 1-3 months ago' },
				{ query: 'added:<1 clicked:=0', description: 'New bookmarks not yet used' }
			]
		}
	];
</script>

{#if isOpen}
	<dialog open on:click|self={close}>
		<article on:click|stopPropagation>
			<header>
				<button aria-label="Close" on:click={close} />
				<h3>Search Filter Help</h3>
			</header>

			<div class="filter-help-content">
				<div class="syntax-section">
					<h4>Basic Syntax</h4>
					<ul>
						<li><code>+term</code> - Must contain (AND)</li>
						<li><code>term</code> - Contains any (OR)</li>
						<li><code>-term</code> - Must not contain (NOT)</li>
						<li><code>"exact phrase"</code> - Exact phrase match</li>
					</ul>

					<h4>Raw Data Filters</h4>
					<ul>
						<li><code>clicked:=0</code> - Never clicked</li>
						<li><code>clicked:>90</code> - Not clicked in 90+ days</li>
						<li><code>added:>365</code> - Added over 1 year ago</li>
						<li><code>tag:name</code> - Contains tag</li>
						<li><code>device:mobile</code> - From mobile device</li>
						<li><code>-tag:deprecated</code> - Exclude deprecated tags</li>
					</ul>
				</div>

				<div class="relevance-section">
					<h4>Relevance Sorting</h4>
					<p>When you search with text, results are automatically sorted by relevance:</p>
					<ul>
						<li><strong>AND terms</strong> (+) get higher weight</li>
						<li><strong>OR terms</strong> get base weight</li>
						<li><strong>More matches</strong> = higher ranking</li>
						<li>Special filters don't affect ranking</li>
					</ul>
				</div>

				{#each examples as category}
					<div class="category-section">
						<h4>{category.category}</h4>
						<div class="examples-grid">
							{#each category.items as example}
								<div class="example-item">
									<button
										class="example-query"
										on:click={() => applyExample(example.query)}
										title="Click to apply this filter"
									>
										<code>{example.query}</code>
									</button>
									<span class="example-description">{example.description}</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}

				<div class="tips-section">
					<h4>Actionable Search Tips</h4>
					<ul>
						<li>
							<strong>Cleanup:</strong> <code>clicked:=0 added:&gt;90</code> finds old unused bookmarks
						</li>
						<li>
							<strong>Device context:</strong> <code>device:mobile +work</code> for mobile work bookmarks
						</li>
						<li>
							<strong>Time ranges:</strong> Use <code>&gt;</code>, <code>&lt;</code>, <code>=</code>
							with numbers (days)
						</li>
						<li>
							<strong>Tag exclusion:</strong> <code>-tag:archived</code> excludes archived items
						</li>
						<li><strong>Combine filters:</strong> <code>clicked:&gt;365 -tag:important</code></li>
						<li>
							<strong>Quick cleanup:</strong> <code>added:&gt;365 clicked:=0</code> for year-old unused
							bookmarks
						</li>
					</ul>
				</div>
			</div>
		</article>
	</dialog>
{/if}

<style>
	.filter-help-content {
		max-height: 70vh;
		overflow-y: auto;
	}

	.syntax-section,
	.relevance-section,
	.category-section,
	.tips-section {
		margin-bottom: 1.5rem;
	}

	.syntax-section h4,
	.relevance-section h4,
	.category-section h4,
	.tips-section h4 {
		margin-bottom: 0.5rem;
		color: var(--pico-primary);
	}

	.examples-grid {
		display: grid;
		gap: 0.5rem;
	}

	.example-item {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem;
		align-items: center;
		padding: 0.5rem;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: var(--pico-border-radius);
		transition: background-color 0.2s ease;
	}

	.example-item:hover {
		background-color: var(--pico-card-sectioning-background-color);
	}

	.example-query {
		background: none;
		border: none;
		padding: 0.25rem 0.5rem;
		background-color: var(--pico-code-background-color);
		border-radius: 4px;
		cursor: pointer;
		font-family: var(--pico-font-family-monospace);
		font-size: 0.875rem;
		transition: background-color 0.2s ease;
	}

	.example-query:hover {
		background-color: var(--pico-primary-background);
	}

	.example-query code {
		background: none;
		padding: 0;
		font-size: inherit;
	}

	.example-description {
		font-size: 0.875rem;
		color: var(--pico-muted-color);
	}

	.syntax-section ul,
	.tips-section ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.syntax-section li,
	.tips-section li {
		margin-bottom: 0.25rem;
	}

	code {
		background-color: var(--pico-code-background-color);
		padding: 0.125rem 0.25rem;
		border-radius: 3px;
		font-family: var(--pico-font-family-monospace);
		font-size: 0.875rem;
	}

	@media (max-width: 768px) {
		.filter-help-content {
			max-height: 60vh;
		}

		.example-item {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}

		.example-query {
			justify-self: start;
		}
	}
</style>
