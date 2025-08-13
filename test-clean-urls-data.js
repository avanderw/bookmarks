/**
 * Test data for URL cleaning functionality
 */

const testBookmarksCleanUrls = [
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

module.exports = { testBookmarksCleanUrls };
