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
      category: "Usage-based Filters",
      items: [
        { query: "never-clicked", description: "Bookmarks that have never been visited" },
        { query: "old-unvisited:30d", description: "Bookmarks added 30+ days ago with 0 clicks" },
        { query: "stale:90d", description: "Bookmarks not clicked in 90+ days" },
      ]
    },
    {
      category: "Device & System Filters", 
      items: [
        { query: "device:mobile", description: "Bookmarks saved from mobile devices" },
        { query: "device:desktop", description: "Bookmarks saved from desktop" },
        { query: "os:windows", description: "Bookmarks saved from Windows" },
        { query: "browser:chrome", description: "Bookmarks saved using Chrome" },
      ]
    },
    {
      category: "Tag Filters",
      items: [
        { query: "tag:javascript", description: "Bookmarks tagged with 'javascript'" },
        { query: "tag:react", description: "Bookmarks tagged with 'react'" },
        { query: "tag:tutorial", description: "Bookmarks tagged with 'tutorial'" },
      ]
    },
    {
      category: "Date-based Filters",
      items: [
        { query: "added:>30d", description: "Bookmarks added more than 30 days ago" },
        { query: "added:<7d", description: "Bookmarks added in the last 7 days" },
        { query: "clicked:>90d", description: "Bookmarks last clicked more than 90 days ago" },
      ]
    },
    {
      category: "Combined Examples",
      items: [
        { query: "never-clicked device:mobile", description: "Unvisited bookmarks from mobile" },
        { query: "old-unvisited:60d browser:chrome", description: "Old Chrome bookmarks never used" },
        { query: "stale:90d +important", description: "Old bookmarks tagged 'important'" },
        { query: "github device:desktop -readme", description: "GitHub bookmarks from desktop (no readme)" },
        { query: "tag:javascript +tutorial", description: "JavaScript tutorial bookmarks" },
        { query: "tag:react tag:vue", description: "Bookmarks tagged with React OR Vue" },
      ]
    }
  ];
</script>

{#if isOpen}
  <dialog open>
    <article>
      <header>
        <button aria-label="Close" on:click={close}></button>
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
          <h4>Tips</h4>
          <ul>
            <li>Combine multiple filters: <code>never-clicked device:mobile</code></li>
            <li>Use time suffixes: <code>30d</code> (30 days), <code>7d</code> (7 days)</li>
            <li>Mix with regular search: <code>github never-clicked</code></li>
            <li>Exclude with minus: <code>device:mobile -android</code></li>
            <li>Search tags: <code>tag:javascript</code> or just type <code>javascript</code></li>
            <li>Multiple tags: <code>tag:react tag:hooks</code> for OR, <code>+tag:react +tag:hooks</code> for AND</li>
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
  .category-section,
  .tips-section {
    margin-bottom: 1.5rem;
  }
  
  .syntax-section h4,
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
