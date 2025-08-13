// Simple test to demonstrate tag filtering issue
const fs = require('fs');
const path = require('path');

// Read the Logic.ts file and convert it to JS for testing
let content = fs.readFileSync(path.join(__dirname, 'src/lib/component/SearchQueryFilter/Logic.ts'), 'utf8');

// Simple conversion: remove type annotations and export/import syntax
content = content
  .replace(/export interface[^}]+}/gs, '')
  .replace(/export function/g, 'function')
  .replace(/import[^;]+;/g, '')
  .replace(/<T[^>]*>/g, '')
  .replace(/: [A-Za-z<>[\]|,\s]+/g, '')
  .replace(/\?\?/g, '||');

// Add the functions we need
eval(content);

// Test data similar to user's issue
const testData = [
  { 
    url: 'https://capitec1.com', 
    title: 'Capitec Bank',
    tags: ['capitec', 'bank', 'finance'],
    added: new Date(),
    clicked: 0
  },
  { 
    url: 'https://capitec2.com', 
    title: 'Capitec with NPR',
    tags: ['capitec', 'npr', 'finance'],
    added: new Date(),
    clicked: 0
  },
  { 
    url: 'https://npr1.com', 
    title: 'NPR News',
    tags: ['npr', 'news'],
    added: new Date(),
    clicked: 0
  },
  { 
    url: 'https://capitec3.com', 
    title: 'Pure Capitec',
    tags: ['capitec'],
    added: new Date(),
    clicked: 0
  }
];

console.log('=== Testing: tag:capitec -tag:npr ===');
console.log('Expected: Should return items with capitec tag but NOT npr tag');
console.log('Should return: capitec1.com, capitec3.com');
console.log('Should NOT return: capitec2.com (has both capitec AND npr)');
console.log('');

try {
  const result = applyFilter(testData, 'tag:capitec -tag:npr');
  console.log('Query:', result.query);
  console.log('Parsed options:', JSON.stringify(result.options, null, 2));
  console.log('');
  console.log('Results found:', result.data.length);
  result.data.forEach((item, i) => {
    console.log(`  ${i+1}. ${item.url} - tags: [${item.tags.join(', ')}]`);
  });
  
  // Verify the issue
  const hasCapitecWithNpr = result.data.some(item => 
    item.tags.includes('capitec') && item.tags.includes('npr')
  );
  
  if (hasCapitecWithNpr) {
    console.log('');
    console.log('🚨 ISSUE CONFIRMED: Results include items with BOTH capitec AND npr tags!');
  } else {
    console.log('');
    console.log('✅ Working correctly: No items with both capitec AND npr tags');
  }
  
} catch (error) {
  console.error('Error during test:', error.message);
}
