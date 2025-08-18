// Re-export the component
export { default as SearchQueryFilter } from './View.svelte';

// Re-export the types and functions from the logic file
export type { FilterOptions, FilterResult } from './Logic';
export { applyFilter } from './Logic';
