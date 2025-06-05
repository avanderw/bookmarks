export interface FilterOptions {
  and: string[];
  or: string[];
  not: string[];
}

export interface FilterResult<T = any> {
  data: T[];
  options: FilterOptions;
  query: string;
  scores: Map<T, number>;
}

/**
 * Parses a search query string into filter options
 * 
 * @private Internal helper function
 */
function parseFilterQuery(query: string): FilterOptions {
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
    } else if (term.startsWith('+')) {
      options.and.push(cleanTerm.substring(1));
    } else if (term.startsWith('|')) {
      options.or.push(cleanTerm.substring(1));
    } else {
      // Words without prefixes are OR terms
      options.or.push(cleanTerm);
    }
  });
  
  return options;
}

/**
 * Filters data based on a search query string with relevance ranking
 * 
 * Syntax:
 * - Words without special characters are treated as OR terms (default behavior)
 * - Words prefixed with '+' are explicitly AND terms (e.g., '+term')
 * - Words prefixed with '|' are explicitly OR terms (e.g., '|term')
 * - Words prefixed with '-' are NOT terms/exclusions (e.g., '-term')
 * - Quoted phrases like "exact match" are treated as a single term
 * 
 * Examples:
 * - 'apple banana' → finds items containing 'apple' OR 'banana' (ranked by matches)
 * - '+apple banana' → finds items containing 'apple' AND possibly 'banana'
 * - 'apple -banana' → finds items containing 'apple' but NOT 'banana'
 * 
 * @param data The array of objects to filter
 * @param query The search query string
 * @returns FilterResult containing filtered data, options, and relevance scores
 */
export function applyFilter<T>(data: T[], query: string): FilterResult<T> {
  // Parse the query into filter options
  const options = parseFilterQuery(query);
  
  if (!data || !data.length) {
    return { 
      data: [], 
      options, 
      query, 
      scores: new Map<T, number>() 
    };
  }
  
  // If query is empty, return all data
  if (!options.and.length && !options.or.length && !options.not.length) {
    return { 
      data, 
      options, 
      query, 
      scores: new Map<T, number>() 
    };
  }
  
  // Store scores for ranking
  const scores = new Map<T, number>();
  
  // Filter the data
  const filteredData = data.filter(item => {
    // Convert item to a searchable string
    const searchText = JSON.stringify(item).toLowerCase();
    let score = 0;
    
    // Handle NOT conditions first (exclusions)
    for (const term of options.not) {
      if (searchText.includes(term.toLowerCase())) {
        return false; // Exclude this item
      }
    }
    
    // Check AND terms - all must match
    for (const term of options.and) {
      if (!searchText.includes(term.toLowerCase())) {
        return false; // Require all AND terms
      }
      score += 2; // AND terms get higher weight
    }
    
    // Check OR terms - at least one must match if we have no AND terms
    let orMatches = 0;
    for (const term of options.or) {
      if (searchText.includes(term.toLowerCase())) {
        orMatches++;
        score += 1; // OR terms get base weight
      }
    }
    
    // If we have OR terms but no AND terms, require at least one OR match
    if (options.or.length > 0 && options.and.length === 0 && orMatches === 0) {
      return false;
    }
    
    // Store the score for this item
    scores.set(item, score);
    
    return true;
  });
  
  // Sort results by score (highest first)
  filteredData.sort((a, b) => {
    const scoreA = scores.get(a) || 0;
    const scoreB = scores.get(b) || 0;
    return scoreB - scoreA;
  });
  
  return { 
    data: filteredData, 
    options, 
    query, 
    scores 
  };
}

/**
 * Helper function to calculate what percentage of search terms matched
 * Used for more advanced UI features like showing match strength
 */
export function calculateMatchPercentage<T>(item: T, result: FilterResult<T>): number {
  if (!result.scores.has(item)) return 0;
  
  const options = result.options;
  const totalTerms = options.and.length + options.or.length;
  
  if (totalTerms === 0) return 100;
  
  // Get score and calculate percentage based on maximum possible score
  const score = result.scores.get(item) || 0;
  const maxPossibleScore = (options.and.length * 2) + options.or.length;
  
  return Math.round((score / maxPossibleScore) * 100);
}