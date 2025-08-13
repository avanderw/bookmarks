// Simple test file to verify URL validation
// This file can be run with: node test-url-validation.js

function isValidUrl(url) {
    if (!url || typeof url !== 'string' || url.trim() === '') {
        return false;
    }

    try {
        const urlObj = new URL(url.trim());
        // Check if it has a valid protocol (http or https)
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

// Test cases
const testCases = [
    // Valid URLs
    { url: 'https://example.com', expected: true },
    { url: 'http://example.com', expected: true },
    { url: 'https://sub.example.com/path', expected: true },
    { url: 'https://example.com:8080/path?query=1', expected: true },
    
    // Invalid URLs
    { url: '', expected: false },
    { url: null, expected: false },
    { url: undefined, expected: false },
    { url: 'not-a-url', expected: false },
    { url: 'ftp://example.com', expected: false },
    { url: '//example.com', expected: false },
    { url: 'javascript:alert("xss")', expected: false },
    { url: 'file:///path/to/file', expected: false },
    { url: '   ', expected: false },
];

console.log('Testing URL validation function...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    const result = isValidUrl(testCase.url);
    const status = result === testCase.expected ? 'PASS' : 'FAIL';
    
    if (result === testCase.expected) {
        passed++;
    } else {
        failed++;
    }
    
    console.log(`Test ${index + 1}: ${status} - URL: "${testCase.url}" | Expected: ${testCase.expected} | Got: ${result}`);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('✅ All tests passed!');
} else {
    console.log('❌ Some tests failed!');
    process.exit(1);
}
