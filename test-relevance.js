// Test file for RelevanceUtils functionality
// Run with: node test-relevance.js

console.log('🧪 Testing Relevance Algorithm...\n');

// Simplified relevance configuration
const DEFAULT_RELEVANCE_CONFIG = {
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
 */
function calculateRelevanceScore(bookmark, config = DEFAULT_RELEVANCE_CONFIG) {
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
 */
function sortBookmarksByRelevance(bookmarks, config = DEFAULT_RELEVANCE_CONFIG) {
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
 */
function explainRelevanceScore(bookmark, config = DEFAULT_RELEVANCE_CONFIG) {
  const score = calculateRelevanceScore(bookmark, config);
  const now = new Date();
  
  const factors = [];
  
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

// Test data
const now = new Date();
const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

const testBookmarks = [
  {
    url: 'https://example.com/frequently-used',
    title: 'Frequently Used Site',
    description: null,
    tags: [],
    notes: null,
    added: oneMonthAgo,
    clicked: 25,
    last: oneWeekAgo
  },
  {
    url: 'https://example.com/never-used',
    title: 'Never Used Bookmark',
    description: null,
    tags: [],
    notes: null,
    added: threeMonthsAgo,
    clicked: 0,
    last: null
  },
  {
    url: 'https://example.com/stale',
    title: 'Stale Bookmark',
    description: null,
    tags: [],
    notes: null,
    added: threeMonthsAgo,
    clicked: 10,
    last: threeMonthsAgo
  },
  {
    url: 'https://example.com/new',
    title: 'New Bookmark',
    description: null,
    tags: [],
    notes: null,
    added: new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000)), // 2 days ago
    clicked: 0,
    last: null
  },
  {
    url: 'https://example.com/heavy-user',
    title: 'Heavy User Bookmark',
    description: null,
    tags: [],
    notes: null,
    added: oneMonthAgo,
    clicked: 50,
    last: new Date(now.getTime() - (24 * 60 * 60 * 1000)) // yesterday
  }
];

// Test 1: Calculate relevance scores
console.log('📊 Relevance Scores:');
testBookmarks.forEach(bookmark => {
  const score = calculateRelevanceScore(bookmark);
  console.log(`  ${bookmark.title}: ${score.toFixed(3)}`);
  console.log(`    ${explainRelevanceScore(bookmark)}`);
});

console.log('\n📈 Sorted by Relevance:');
const sortedBookmarks = sortBookmarksByRelevance(testBookmarks);
sortedBookmarks.forEach((bookmark, index) => {
  const score = calculateRelevanceScore(bookmark);
  console.log(`  ${index + 1}. ${bookmark.title} (${score.toFixed(3)})`);
});

console.log('\n✅ RelevanceUtils algorithm test completed!');
