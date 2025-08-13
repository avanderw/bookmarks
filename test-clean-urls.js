/**
 * Test the cleanInvalidUrls function to ensure it properly identifies and removes invalid URLs
 */

// Mock browser environment for Node.js testing
global.browser = true;
global.Blob = class Blob {
  constructor(array, options) {
    this.size = JSON.stringify(array[0]).length;
  }
};

// Import the function to test
const { cleanInvalidUrls } = require('./src/lib/storage.ts');

// Test data with mixed valid and invalid URLs
const testBookmarks = [
  {
    url: 'https://example.com',
    title: 'Valid HTTPS URL',
    description: null,
    tags: [],
    notes: null,
    added: new Date('2023-01-01'),
    clicked: 0,
    last: null
  },
  {
    url: 'http://test.org',
    title: 'Valid HTTP URL',
    description: null,
    tags: [],
    notes: null,
    added: new Date('2023-01-02'),
    clicked: 5,
    last: new Date('2023-01-10')
  },
  {
    url: '',
    title: 'Empty URL',
    description: null,
    tags: [],
    notes: null,
    added: new Date('2023-01-03'),
    clicked: 0,
    last: null
  },
  {
    url: 'invalid url with spaces',
    title: 'URL with spaces',
    description: null,
    tags: [],
    notes: null,
    added: new Date('2023-01-04'),
    clicked: 0,
    last: null
  },
  {
    url: 'ftp://files.example.com',
    title: 'FTP URL (invalid protocol)',
    description: null,
    tags: [],
    notes: null,
    added: new Date('2023-01-05'),
    clicked: 0,
    last: null
  },
  {
    url: 'https://valid-domain.co.uk/path?param=value',
    title: 'Complex valid URL',
    description: 'A complex URL with path and parameters',
    tags: ['test', 'complex'],
    notes: 'This should pass validation',
    added: new Date('2023-01-06'),
    clicked: 10,
    last: new Date('2023-01-15')
  },
  {
    url: '..invalid',
    title: 'Malformed URL with dots',
    description: null,
    tags: [],
    notes: null,
    added: new Date('2023-01-07'),
    clicked: 0,
    last: null
  },
  {
    url: null,
    title: 'Null URL',
    description: null,
    tags: [],
    notes: null,
    added: new Date('2023-01-08'),
    clicked: 0,
    last: null
  }
];

console.log('🧪 Testing cleanInvalidUrls function...\n');

console.log('📊 Input data:');
testBookmarks.forEach((bookmark, index) => {
  console.log(`${index + 1}. "${bookmark.title}" - URL: "${bookmark.url}"`);
});

console.log('\n🔍 Running cleanInvalidUrls...');
const result = cleanInvalidUrls(testBookmarks, false); // Silent mode for testing

console.log('\n📈 Results:');
console.log(`Original bookmarks: ${testBookmarks.length}`);
console.log(`Valid bookmarks: ${result.cleanedBookmarks.length}`);
console.log(`Removed bookmarks: ${result.removedCount}`);

console.log('\n✅ Valid bookmarks:');
result.cleanedBookmarks.forEach((bookmark, index) => {
  console.log(`${index + 1}. "${bookmark.title}" - URL: "${bookmark.url}"`);
});

console.log('\n❌ Removed bookmarks:');
result.removedBookmarks.forEach((bookmark, index) => {
  console.log(`${index + 1}. "${bookmark.title}" - URL: "${bookmark.url}"`);
});

// Verify expected results
const expectedValidCount = 3; // https://example.com, http://test.org, https://valid-domain.co.uk/path?param=value
const expectedRemovedCount = 5; // empty, spaces, ftp, malformed, null

console.log('\n🎯 Validation:');
console.log(`Expected valid: ${expectedValidCount}, Got: ${result.cleanedBookmarks.length} - ${result.cleanedBookmarks.length === expectedValidCount ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Expected removed: ${expectedRemovedCount}, Got: ${result.removedCount} - ${result.removedCount === expectedRemovedCount ? '✅ PASS' : '❌ FAIL'}`);

// Verify no valid URLs were incorrectly removed
const validUrls = ['https://example.com', 'http://test.org', 'https://valid-domain.co.uk/path?param=value'];
const resultUrls = result.cleanedBookmarks.map(b => b.url);
const allValidPresent = validUrls.every(url => resultUrls.includes(url));
console.log(`All valid URLs preserved: ${allValidPresent ? '✅ PASS' : '❌ FAIL'}`);

// Verify no invalid URLs were kept
const invalidUrls = ['', 'invalid url with spaces', 'ftp://files.example.com', '..invalid', null];
const anyInvalidPresent = invalidUrls.some(url => resultUrls.includes(url));
console.log(`No invalid URLs kept: ${!anyInvalidPresent ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n🏁 Test completed!');

if (result.cleanedBookmarks.length === expectedValidCount && 
    result.removedCount === expectedRemovedCount && 
    allValidPresent && 
    !anyInvalidPresent) {
  console.log('🎉 All tests PASSED!');
  process.exit(0);
} else {
  console.log('💥 Some tests FAILED!');
  process.exit(1);
}
