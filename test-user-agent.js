import { parseUserAgent, formatUserAgentInfo, getShortUserAgentSummary } from '../src/lib/utils/UserAgentUtils';

// Test various user agents
const testUserAgents = [
    // Chrome on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    
    // Firefox on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
    
    // Safari on iPhone
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
    
    // Edge on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    
    // Chrome on Android
    'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
];

console.log('User Agent Parsing Tests:');
console.log('========================');

testUserAgents.forEach((ua, index) => {
    const parsed = parseUserAgent(ua);
    console.log(`\nTest ${index + 1}:`);
    console.log(`Browser: ${parsed.browser}`);
    console.log(`OS: ${parsed.os}`);
    console.log(`Device: ${parsed.device}`);
    console.log(`Formatted: ${formatUserAgentInfo(parsed)}`);
    console.log(`Short: ${getShortUserAgentSummary(parsed)}`);
});
