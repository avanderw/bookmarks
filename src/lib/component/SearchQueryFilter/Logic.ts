export interface FilterOptions {
    and: string[];
    or: string[];
    not: string[];
  }
  
  export interface FilterResult {
    data: any[];
    options: FilterOptions;
    query: string;
  }
  
/**
 * Parses a search query string into filter options
 * 
 * Current Syntax:
 * - Words without special characters are treated as AND terms
 * - Words prefixed with '+' are explicitly AND terms (e.g., '+term', not '+ term')
 * - Words prefixed with '|' are OR terms (e.g., '|term', not '| term')
 * - Words prefixed with '-' are NOT terms/exclusions (e.g., '-term', not '- term')
 * - Quoted phrases like "exact match" are treated as a single term
 * - Prefixes must be attached directly to the term without spaces
 * 
 * Examples:
 * - 'apple banana' → finds items containing both 'apple' AND 'banana'
 * - 'apple |orange' → finds items containing 'apple' AND/OR 'orange'
 * - 'fruit -banana' → finds items containing 'fruit' but NOT 'banana'
 * 
 * Limitations:
 * - Does not support parentheses or complex expressions like 'A + (B - C)'
 * - No support for field-specific filtering (e.g., 'title:keyword')
 * - Limited to simple prefix-based syntax
 * - Operators must be attached to terms (no spaces between operator and term)
 * 
 * Future improvements:
 * - Support for parentheses and nested expressions
 * - Field-specific filtering capability
 * - Advanced operators (CONTAINS, STARTS_WITH, etc.)
 * - Regular expression support
 * - Support for numeric comparisons (>, <, >=, <=)
 * - Customizable field weighting for relevance scoring
 * - More flexible operator syntax that handles spaces between operators and terms
 */
  export function parseFilterQuery(query: string): FilterOptions {
    if (!query || query.trim() === '') {
      return { and: [], or: [], not: [] };
    }
  
    const options: FilterOptions = {
      and: [],
      or: [],
      not: []
    };
    
    // Split by spaces, but preserve quoted phrases
    const terms: string[] = [];
    let currentTerm = '';
    let inQuotes = false;
    
    for (let i = 0; i < query.length; i++) {
      const char = query[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        currentTerm += char;
      } else if (char === ' ' && !inQuotes) {
        if (currentTerm.trim()) {
          terms.push(currentTerm.trim());
        }
        currentTerm = '';
      } else {
        currentTerm += char;
      }
    }
    
    if (currentTerm.trim()) {
      terms.push(currentTerm.trim());
    }
    
    // Process terms based on prefixes
    terms.forEach(term => {
      // Remove quotes for processing but preserve the term
      const cleanTerm = term.replace(/^["']|["']$/g, '');
      
      if (term.startsWith('-')) {
        options.not.push(cleanTerm.substring(1));
      } else if (term.startsWith('|')) {
        options.or.push(cleanTerm.substring(1));
      } else if (term.startsWith('+')) {
        options.and.push(cleanTerm.substring(1));
      } else {
        // Default behavior: words without prefixes are AND terms
        options.and.push(cleanTerm);
      }
    });
    
    return options;
  }
  
  /**
   * Applies filter options to data
   * @param data The array of objects to filter
   * @param options The filter options
   * @returns Filtered array of objects
   */
  export function applyFilter<T>(data: T[], options: FilterOptions): T[] {
    if (!data || !data.length) return [];
    
    if (!options.and.length && !options.or.length && !options.not.length) {
      return data;
    }
    
    return data.filter(item => {
      // Convert item to a searchable string
      const searchText = JSON.stringify(item).toLowerCase();
      
      // Handle NOT conditions first (exclusions)
      for (const term of options.not) {
        if (searchText.includes(term.toLowerCase())) {
          return false; // Exclude this item
        }
      }
      
      // If we have AND terms, all must match
      if (options.and.length) {
        for (const term of options.and) {
          if (!searchText.includes(term.toLowerCase())) {
            return false;
          }
        }
      }
      
      // If we have OR terms, at least one must match (only checked if there are no AND terms or all AND terms matched)
      if (options.or.length) {
        // If we don't have any AND terms, we need at least one OR term to match
        if (options.and.length === 0) {
          return options.or.some(term => searchText.includes(term.toLowerCase()));
        }
        // If we have AND terms and they all matched, OR terms are optional bonuses
        return true;
      }
      
      // If we have AND terms and they all matched, or we have no terms at all
      return options.and.length > 0 || options.not.length > 0;
    });
  }