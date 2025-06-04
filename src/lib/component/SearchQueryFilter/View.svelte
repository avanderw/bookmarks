<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import type { FilterOptions, FilterResult } from './Filter';
    import { parseFilterQuery, applyFilter } from './Filter';
    
    export let data: any[] = [];
    export let placeholder: string = "Search (use + for AND, | for OR, - for NOT)";
    export let debounceTime: number = 300;
    
    let query: string = '';
    let filterOptions: FilterOptions = { and: [], or: [], not: [] };
    let timer: ReturnType<typeof setTimeout>;
    
    const dispatch = createEventDispatcher<{ filtered: FilterResult }>();
    
    function handleInput() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        filterOptions = parseFilterQuery(query);
        const filteredData = applyFilter(data, filterOptions);
        dispatch('filtered', { 
          data: filteredData, 
          options: filterOptions, 
          query 
        });
      }, debounceTime);
    }
    
    // Initial filter on mount
    $: if (data) {
      handleInput();
    }
  </script>
  
  <div class="filter-container">
    <input
      type="text"
      bind:value={query}
      on:input={handleInput}
      {placeholder}
      class="filter-input"
    />
    
    {#if query}
      <div class="filter-help">
        <small>
          AND terms: <span class="tag">{filterOptions.and.join(', ') || 'none'}</span>
        </small>
        <small>
          OR terms: <span class="tag">{filterOptions.or.join(', ') || 'none'}</span>
        </small>
        <small>
          NOT terms: <span class="tag">{filterOptions.not.join(', ') || 'none'}</span>
        </small>
      </div>
    {/if}
  </div>
  
  <style>
    .filter-container {
      margin-bottom: 1rem;
    }
    
    .filter-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 1rem;
    }
    
    .filter-help {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: #666;
    }
    
    .tag {
      color: #333;
      font-weight: 500;
    }
  </style>