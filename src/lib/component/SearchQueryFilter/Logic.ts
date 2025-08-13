export interface FilterOptions {
  and: string[];
  or: string[];
  not: string[];
  special: SpecialFilter[];
}

export interface SpecialFilter {
  type: 'never-clicked' | 'unvisited' | 'old-unvisited' | 'stale' | 'device' | 'os' | 'browser' | 'added' | 'clicked';
  value?: string;
  operator?: '>' | '<' | '=' | '>=' | '<=';
  duration?: number; // in days
}

export interface FilterResult<T = any> {
  data: T[];
  options: FilterOptions;
  query: string;
  scores: Map<T, number>;
}

/**
 * Applies a special filter to an item
 * 
 * @private Internal helper function
 */
function applySpecialFilter<T>(item: T, filter: SpecialFilter): boolean {
  // Type assertion to access bookmark properties
  const bookmark = item as any;
  
  switch (filter.type) {
    case 'never-clicked':
    case 'unvisited':
      return bookmark.clicked === 0;
      
    case 'old-unvisited':
      if (bookmark.clicked > 0) return false;
      if (!filter.duration || !bookmark.added) return true;
      const addedDate = new Date(bookmark.added);
      const daysAgo = (Date.now() - addedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo > filter.duration;
      
    case 'stale':
      if (!filter.duration) return true;
      if (bookmark.clicked === 0) return false; // Never clicked items aren't "stale"
      const lastDate = bookmark.last ? new Date(bookmark.last) : new Date(bookmark.added);
      const daysSinceLastClick = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLastClick > filter.duration;
      
    case 'device':
      if (!bookmark.device || !filter.value) return false;
      return bookmark.device.toLowerCase().includes(filter.value.toLowerCase());
      
    case 'os':
      if (!bookmark.os || !filter.value) return false;
      return bookmark.os.toLowerCase().includes(filter.value.toLowerCase());
      
    case 'browser':
      if (!bookmark.browser || !filter.value) return false;
      return bookmark.browser.toLowerCase().includes(filter.value.toLowerCase());
      
    case 'added':
      if (!filter.duration || !filter.operator || !bookmark.added) return true;
      const addedTime = new Date(bookmark.added);
      const daysFromAdded = (Date.now() - addedTime.getTime()) / (1000 * 60 * 60 * 24);
      return compareDate(daysFromAdded, filter.operator, filter.duration);
      
    case 'clicked':
      if (!filter.duration || !filter.operator) return true;
      if (bookmark.clicked === 0) return false; // Never clicked
      const clickedTime = bookmark.last ? new Date(bookmark.last) : new Date(bookmark.added);
      const daysFromClicked = (Date.now() - clickedTime.getTime()) / (1000 * 60 * 60 * 24);
      return compareDate(daysFromClicked, filter.operator, filter.duration);
      
    default:
      return true;
  }
}

/**
 * Compares dates based on operator
 * 
 * @private Internal helper function
 */
function compareDate(actualDays: number, operator: string, targetDays: number): boolean {
  switch (operator) {
    case '>': return actualDays > targetDays;
    case '<': return actualDays < targetDays;
    case '>=': return actualDays >= targetDays;
    case '<=': return actualDays <= targetDays;
    case '=': return Math.abs(actualDays - targetDays) < 1; // Within a day
    default: return true;
  }
}

/**
 * Parses special filter keywords and adds them to filter options
 * 
 * @private Internal helper function
 */
function parseSpecialFilter(term: string, options: FilterOptions): boolean {
  const lower = term.toLowerCase();
  
  // Usage-based filters
  if (lower === 'never-clicked' || lower === 'unvisited') {
    options.special.push({ type: 'never-clicked' });
    return true;
  }
  
  // Old unvisited filter: old-unvisited:30d
  const oldUnvisitedMatch = lower.match(/^old-unvisited:(\d+)d$/);
  if (oldUnvisitedMatch) {
    options.special.push({ 
      type: 'old-unvisited', 
      duration: parseInt(oldUnvisitedMatch[1]) 
    });
    return true;
  }
  
  // Stale filter: stale:90d
  const staleMatch = lower.match(/^stale:(\d+)d$/);
  if (staleMatch) {
    options.special.push({ 
      type: 'stale', 
      duration: parseInt(staleMatch[1]) 
    });
    return true;
  }
  
  // Device filter: device:mobile, device:desktop, device:tablet
  const deviceMatch = lower.match(/^device:(.+)$/);
  if (deviceMatch) {
    options.special.push({ type: 'device', value: deviceMatch[1] });
    return true;
  }
  
  // OS filter: os:windows, os:macos, etc.
  const osMatch = lower.match(/^os:(.+)$/);
  if (osMatch) {
    options.special.push({ type: 'os', value: osMatch[1] });
    return true;
  }
  
  // Browser filter: browser:chrome, browser:firefox, etc.
  const browserMatch = lower.match(/^browser:(.+)$/);
  if (browserMatch) {
    options.special.push({ type: 'browser', value: browserMatch[1] });
    return true;
  }
  
  // Date filters: added:>30d, added:<7d, clicked:>90d
  const dateMatch = lower.match(/^(added|clicked):([<>=]+)(\d+)d$/);
  if (dateMatch) {
    const [, type, operator, days] = dateMatch;
    options.special.push({ 
      type: type as 'added' | 'clicked',
      operator: operator as '>' | '<' | '=' | '>=' | '<=',
      duration: parseInt(days) 
    });
    return true;
  }
  
  return false;
}

/**
 * Parses a search query string into filter options
 * 
 * @private Internal helper function
 */
function parseFilterQuery(query: string): FilterOptions {
  if (!query || query.trim() === '') {
    return { and: [], or: [], not: [], special: [] };
  }

  const options: FilterOptions = {
    and: [],
    or: [],
    not: [],
    special: []
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
    
    // Check for special filter keywords
    if (parseSpecialFilter(cleanTerm, options)) {
      return; // Special filter was parsed, continue to next term
    }
    
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
 * Special Filters:
 * Usage-based filters:
 * - 'never-clicked' or 'unvisited' → bookmarks with 0 clicks
 * - 'old-unvisited:30d' → bookmarks added 30+ days ago with 0 clicks
 * - 'stale:90d' → bookmarks not clicked in 90+ days
 * 
 * Device/System filters:
 * - 'device:mobile', 'device:desktop', 'device:tablet'
 * - 'os:windows', 'os:macos', 'os:android', 'os:ios'
 * - 'browser:chrome', 'browser:firefox', 'browser:safari'
 * 
 * Date-based filters:
 * - 'added:>30d' → added more than 30 days ago
 * - 'added:<7d' → added in last 7 days
 * - 'clicked:>90d' → last clicked more than 90 days ago
 * 
 * Examples:
 * - 'apple banana' → finds items containing 'apple' OR 'banana' (ranked by matches)
 * - '+apple banana' → finds items containing 'apple' AND possibly 'banana'
 * - 'apple -banana' → finds items containing 'apple' but NOT 'banana'
 * - 'never-clicked device:mobile' → unvisited bookmarks from mobile devices
 * - 'old-unvisited:30d browser:chrome' → old unvisited Chrome bookmarks
 * - 'stale:90d +important' → bookmarks not clicked in 90+ days containing "important"
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
  if (!options.and.length && !options.or.length && !options.not.length && !options.special.length) {
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
    // Apply special filters first
    for (const specialFilter of options.special) {
      if (!applySpecialFilter(item, specialFilter)) {
        return false;
      }
    }
    
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