import { loadFromLocalStorage, saveToLocalStorage, exportBookmarks } from './src/lib/storage.js';

// Test loading demo data
import demoData from './demo-bookmarks.json' assert { type: 'json' };

console.log('🔍 Demo data has', demoData.bookmarks.length, 'bookmarks');

// Save demo data to localStorage
console.log('💾 Saving demo data to localStorage...');
saveToLocalStorage(demoData);

// Load back from localStorage
console.log('📖 Loading back from localStorage...');
const loaded = loadFromLocalStorage();
console.log('📖 Loaded', loaded.bookmarks.length, 'bookmarks');

// Test export functionality
console.log('📤 Testing export functionality...');
console.log('📤 Exporting with loaded data...');
exportBookmarks(loaded);

console.log('📤 Exporting without parameter (should use loadFromLocalStorage)...');  
exportBookmarks();
