/**
 * RelevanceUtils - Calculate relevance scores for bookmarks based on usage patterns and time decay
 */

import type { Bookmark } from '$lib/bookmarks';

export interface RelevanceConfig {
  /** Weight for click count in relevance calculation (0-1) */
  clickWeight: number;
  /** Weight for recency in relevance calculation (0-1) */
  recencyWeight: number;
  /** Days after which relevance starts to decay significantly */
  decayThresholdDays: number;
  /** Rate of decay (higher = faster decay) */
  decayRate: number;
  /** Minimum relevance score to prevent complete irrelevance */
  minRelevanceScore: number;
  /** Maximum relevance boost for recently added items */
  newItemBoost: number;
  /** Days to consider an item "new" */
  newItemThresholdDays: number;
}

export const DEFAULT_RELEVANCE_CONFIG: RelevanceConfig = {
  clickWeight: 0.7,
  recencyWeight: 0.3,
  decayThresholdDays: 30,
  decayRate: 0.02,
  minRelevanceScore: 0.1,
  newItemBoost: 0.2,
  newItemThresholdDays: 7
};

/**
 * Calculate a relevance score for a bookmark based on usage patterns and time decay
 * @param bookmark The bookmark to score
 * @param config Configuration for relevance calculation
 * @returns A relevance score between 0 and 1+ (can exceed 1 with boosts)
 */
export function calculateRelevanceScore(
  bookmark: Bookmark, 
  config: RelevanceConfig = DEFAULT_RELEVANCE_CONFIG
): number {
  const now = new Date();
  
  // Base click score - normalize by maximum reasonable clicks (e.g., 100)
  const maxReasonableClicks = 100;
  const clickScore = Math.min(bookmark.clicked / maxReasonableClicks, 1);
  
  // Calculate recency score based on last visit
  let recencyScore = 0;
  if (bookmark.last) {
    const daysSinceLastVisit = (now.getTime() - new Date(bookmark.last).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastVisit <= config.decayThresholdDays) {
      // Recent visits get full recency score with gradual decay
      recencyScore = Math.exp(-config.decayRate * daysSinceLastVisit);
    } else {
      // Older visits get exponentially decaying score
      const excessDays = daysSinceLastVisit - config.decayThresholdDays;
      recencyScore = Math.exp(-config.decayRate * config.decayThresholdDays) * 
                    Math.exp(-config.decayRate * 2 * excessDays);
    }
  } else if (bookmark.clicked === 0) {
    // Never clicked items get a small recency bonus based on when they were added
    const daysSinceAdded = (now.getTime() - new Date(bookmark.added).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAdded <= config.newItemThresholdDays) {
      recencyScore = config.newItemBoost * (1 - daysSinceAdded / config.newItemThresholdDays);
    }
  }
  
  // Combine scores with weights
  const baseScore = (clickScore * config.clickWeight) + (recencyScore * config.recencyWeight);
  
  // Apply minimum relevance threshold
  const finalScore = Math.max(baseScore, config.minRelevanceScore);
  
  // Apply new item boost for recently added bookmarks
  if (bookmark.clicked === 0) {
    const daysSinceAdded = (now.getTime() - new Date(bookmark.added).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceAdded <= config.newItemThresholdDays) {
      return finalScore + (config.newItemBoost * (1 - daysSinceAdded / config.newItemThresholdDays));
    }
  }
  
  return finalScore;
}

/**
 * Sort bookmarks by relevance score in descending order
 * @param bookmarks Array of bookmarks to sort
 * @param config Configuration for relevance calculation
 * @returns Sorted array of bookmarks (does not mutate original)
 */
export function sortBookmarksByRelevance(
  bookmarks: Bookmark[], 
  config: RelevanceConfig = DEFAULT_RELEVANCE_CONFIG
): Bookmark[] {
  return [...bookmarks].sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, config);
    const scoreB = calculateRelevanceScore(b, config);
    
    // Sort by relevance score (descending)
    const scoreDiff = scoreB - scoreA;
    if (scoreDiff !== 0) return scoreDiff;
    
    // Tie-breaker 1: More clicks wins
    const clickDiff = b.clicked - a.clicked;
    if (clickDiff !== 0) return clickDiff;
    
    // Tie-breaker 2: More recent visit wins
    const aLast = a.last ? new Date(a.last).getTime() : 0;
    const bLast = b.last ? new Date(b.last).getTime() : 0;
    const lastDiff = bLast - aLast;
    if (lastDiff !== 0) return lastDiff;
    
    // Tie-breaker 3: More recently added wins
    const addedDiff = new Date(b.added).getTime() - new Date(a.added).getTime();
    return addedDiff;
  });
}

/**
 * Get a human-readable explanation of why a bookmark has a certain relevance score
 * @param bookmark The bookmark to explain
 * @param config Configuration for relevance calculation
 * @returns A descriptive string explaining the relevance factors
 */
export function explainRelevanceScore(
  bookmark: Bookmark, 
  config: RelevanceConfig = DEFAULT_RELEVANCE_CONFIG
): string {
  const score = calculateRelevanceScore(bookmark, config);
  const now = new Date();
  
  const factors: string[] = [];
  
  // Click factor
  if (bookmark.clicked > 0) {
    factors.push(`${bookmark.clicked} clicks`);
  } else {
    factors.push('never clicked');
  }
  
  // Recency factor
  if (bookmark.last) {
    const daysSinceLastVisit = (now.getTime() - new Date(bookmark.last).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastVisit < 1) {
      factors.push('visited today');
    } else if (daysSinceLastVisit < 7) {
      factors.push(`visited ${Math.floor(daysSinceLastVisit)} days ago`);
    } else if (daysSinceLastVisit < 30) {
      factors.push(`visited ${Math.floor(daysSinceLastVisit / 7)} weeks ago`);
    } else {
      factors.push(`visited ${Math.floor(daysSinceLastVisit / 30)} months ago`);
    }
  }
  
  // New item factor
  const daysSinceAdded = (now.getTime() - new Date(bookmark.added).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceAdded <= config.newItemThresholdDays && bookmark.clicked === 0) {
    factors.push('recently added');
  }
  
  return `Score: ${score.toFixed(3)} (${factors.join(', ')})`;
}

/**
 * Analyze the relevance distribution of a bookmark collection
 * @param bookmarks Array of bookmarks to analyze
 * @param config Configuration for relevance calculation
 * @returns Statistics about the relevance scores
 */
export interface RelevanceStats {
  averageScore: number;
  medianScore: number;
  highRelevanceCount: number; // score > 0.7
  mediumRelevanceCount: number; // score 0.3-0.7
  lowRelevanceCount: number; // score < 0.3
  staleCount: number; // not visited in 90+ days
  neverClickedCount: number;
}

export function analyzeRelevanceDistribution(
  bookmarks: Bookmark[], 
  config: RelevanceConfig = DEFAULT_RELEVANCE_CONFIG
): RelevanceStats {
  if (bookmarks.length === 0) {
    return {
      averageScore: 0,
      medianScore: 0,
      highRelevanceCount: 0,
      mediumRelevanceCount: 0,
      lowRelevanceCount: 0,
      staleCount: 0,
      neverClickedCount: 0
    };
  }
  
  const scores = bookmarks.map(b => calculateRelevanceScore(b, config));
  const sortedScores = [...scores].sort((a, b) => a - b);
  const now = new Date();
  
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const medianScore = sortedScores[Math.floor(sortedScores.length / 2)];
  
  let highRelevanceCount = 0;
  let mediumRelevanceCount = 0;
  let lowRelevanceCount = 0;
  let staleCount = 0;
  let neverClickedCount = 0;
  
  bookmarks.forEach((bookmark, index) => {
    const score = scores[index];
    
    if (score > 0.7) highRelevanceCount++;
    else if (score >= 0.3) mediumRelevanceCount++;
    else lowRelevanceCount++;
    
    if (bookmark.clicked === 0) {
      neverClickedCount++;
    } else if (bookmark.last) {
      const daysSinceLastVisit = (now.getTime() - new Date(bookmark.last).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastVisit >= 90) {
        staleCount++;
      }
    }
  });
  
  return {
    averageScore,
    medianScore,
    highRelevanceCount,
    mediumRelevanceCount,
    lowRelevanceCount,
    staleCount,
    neverClickedCount
  };
}
