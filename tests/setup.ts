import { vi } from 'vitest';

// Mock browser APIs that might be used in the application
Object.defineProperty(window, 'localStorage', {
	value: {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
	},
	writable: true,
});

// Mock File System Access API
(globalThis as any).showSaveFilePicker = vi.fn();
(globalThis as any).showOpenFilePicker = vi.fn();

// Mock Blob for tests
(globalThis as any).Blob = class MockBlob {
	size: number;
	constructor(array: any[], _options?: any) {
		this.size = JSON.stringify(array[0]).length;
	}
};

// Mock crypto for hash functions if needed
Object.defineProperty(globalThis, 'crypto', {
	value: {
		subtle: {
			digest: vi.fn(),
		},
	},
});
