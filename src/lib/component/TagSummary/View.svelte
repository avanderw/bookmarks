<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Bookmark } from '$lib/bookmarks';
  import { extractTagSummary, filterTags, type TagInfo } from './Logic';
  
  export let bookmarks: Bookmark[] = [];
  export let isOpen = false;
  export let maxDisplayedTags = 50;
  
  const dispatch = createEventDispatcher<{
    close: void;
    tagClick: { tag: string };
    tagsSelected: { tags: string[] };
  }>();
  
  let tagSummary: TagInfo[] = [];
  let filteredTags: TagInfo[] = [];
  let tagSearchText = '';
  let selectedTags: Set<string> = new Set();
  let showAll = false;
  let lastBookmarksHash = '';
  
  // Memoize tag summary calculation to avoid recalculating on every change
  function getBookmarksHash(bookmarks: Bookmark[]): string {
    return `${bookmarks.length}-${bookmarks.map(b => b.tags?.join(',') || '').join('|')}`;
  }
  
  // Update tag summary when bookmarks actually change
  $: {
    const currentHash = getBookmarksHash(bookmarks);
    if (currentHash !== lastBookmarksHash) {
      lastBookmarksHash = currentHash;
      tagSummary = extractTagSummary(bookmarks);
    }
  }
  
  // Filter tags based on search text
  $: filteredTags = filterTags(tagSummary, tagSearchText);
  
  // Determine which tags to display
  $: displayedTags = showAll ? filteredTags : filteredTags.slice(0, maxDisplayedTags);
  
  function handleTagClick(tag: string) {
    dispatch('tagClick', { tag });
  }
  
  function handleTagSelect(tag: string, event: Event) {
    event.stopPropagation();
    if (selectedTags.has(tag)) {
      selectedTags.delete(tag);
    } else {
      selectedTags.add(tag);
    }
    selectedTags = new Set(selectedTags); // Trigger reactivity
  }
  
  function applySelectedTags() {
    dispatch('tagsSelected', { tags: Array.from(selectedTags) });
    close();
  }
  
  function clearSelection() {
    selectedTags.clear();
    selectedTags = new Set(selectedTags);
  }
  
  function selectAll() {
    selectedTags = new Set(displayedTags.map(t => t.tag));
  }
  
  function close() {
    dispatch('close');
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <dialog open>
    <article>
      <header>
        <button aria-label="Close" on:click={close}></button>
        <h3>Tag Summary</h3>
        <p>Click tags to filter, or select multiple and apply</p>
      </header>
      
      <div class="tag-summary-content">
        <!-- Search and controls -->
        <div class="controls">
          <div class="search-section">
            <input
              type="search"
              bind:value={tagSearchText}
              placeholder="Search tags..."
              class="tag-search"
            />
            <small class="text-muted">
              Showing {displayedTags.length} of {filteredTags.length} tags
            </small>
          </div>
          
          {#if selectedTags.size > 0}
            <div class="selection-controls">
              <span class="selection-count">{selectedTags.size} selected</span>
              <button class="btn-compact secondary" on:click={clearSelection}>
                Clear
              </button>
              <button class="btn-compact" on:click={applySelectedTags}>
                Apply Filter
              </button>
            </div>
          {:else}
            <div class="bulk-controls">
              <button class="btn-compact secondary" on:click={selectAll}>
                Select All Visible
              </button>
            </div>
          {/if}
        </div>
        
        <!-- Tag list -->
        <div class="tag-list" class:has-selection={selectedTags.size > 0}>
          {#each displayedTags as tagInfo (tagInfo.tag)}
            <div class="tag-item" class:selected={selectedTags.has(tagInfo.tag)}>
              <div 
                class="tag-content" 
                role="button"
                tabindex="0"
                on:click={() => handleTagClick(tagInfo.tag)}
                on:keydown={(e) => e.key === 'Enter' && handleTagClick(tagInfo.tag)}
              >
                <span class="tag-name">#{tagInfo.tag}</span>
                <span class="tag-count">{tagInfo.count}</span>
              </div>
              <div class="tag-actions">
                <input
                  type="checkbox"
                  checked={selectedTags.has(tagInfo.tag)}
                  on:change={(e) => handleTagSelect(tagInfo.tag, e)}
                  title="Select for multi-tag filter"
                />
              </div>
            </div>
          {/each}
          
          {#if filteredTags.length === 0}
            <div class="empty-state">
              {#if tagSearchText}
                No tags found matching "{tagSearchText}"
              {:else}
                No tags found in bookmarks
              {/if}
            </div>
          {/if}
          
          {#if !showAll && filteredTags.length > maxDisplayedTags}
            <div class="show-more">
              <button class="btn-compact secondary" on:click={() => showAll = true}>
                Show {filteredTags.length - maxDisplayedTags} more tags
              </button>
            </div>
          {/if}
        </div>
        
        <!-- Summary stats -->
        <div class="tag-stats">
          <small class="text-muted">
            Total: {tagSummary.length} unique tags across {bookmarks.length} bookmarks
          </small>
        </div>
      </div>
    </article>
  </dialog>
{/if}

<style>
  .tag-summary-content {
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--pico-muted-border-color);
  }
  
  .search-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .tag-search {
    margin: 0;
  }
  
  .selection-controls,
  .bulk-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .selection-count {
    font-size: 0.875rem;
    color: var(--pico-primary);
    font-weight: 500;
  }
  
  .tag-list {
    flex: 1;
    overflow-y: auto;
    max-height: 400px;
    border: 1px solid var(--pico-muted-border-color);
    border-radius: var(--pico-border-radius);
    background: var(--pico-card-background-color);
  }
  
  .tag-item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--pico-muted-border-color);
    transition: background-color 0.2s ease;
  }
  
  .tag-item:last-child {
    border-bottom: none;
  }
  
  .tag-item:hover {
    background-color: var(--pico-secondary-background);
  }
  
  .tag-item.selected {
    background-color: var(--pico-primary-background);
    border-color: var(--pico-primary-border);
  }
  
  .tag-content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }
  
  .tag-name {
    font-weight: 500;
    color: var(--pico-primary);
  }
  
  .tag-count {
    font-size: 0.875rem;
    color: var(--pico-muted-color);
    background: var(--pico-muted-background);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    min-width: fit-content;
  }
  
  .tag-actions {
    margin-left: 0.75rem;
  }
  
  .tag-actions input[type="checkbox"] {
    margin: 0;
    width: auto;
    height: auto;
  }
  
  .empty-state {
    padding: 2rem 1rem;
    text-align: center;
    color: var(--pico-muted-color);
    font-style: italic;
  }
  
  .show-more {
    padding: 0.75rem;
    text-align: center;
    border-top: 1px solid var(--pico-muted-border-color);
    background: var(--pico-card-sectionning-background-color);
  }
  
  .tag-stats {
    padding-top: 0.75rem;
    border-top: 1px solid var(--pico-muted-border-color);
    text-align: center;
  }
  
  @media (max-width: 768px) {
    .tag-summary-content {
      max-height: 80vh;
    }
    
    .selection-controls,
    .bulk-controls {
      flex-wrap: wrap;
    }
    
    .tag-item {
      padding: 0.75rem;
    }
    
    .tag-content {
      gap: 0.5rem;
    }
  }
</style>
