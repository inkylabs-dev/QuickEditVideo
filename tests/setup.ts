import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Setup for Astro component testing
globalThis.process = process;

// Fix TextEncoder/TextDecoder for esbuild
if (typeof global !== 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Ensure Uint8Array works correctly
if (typeof global !== 'undefined' && !global.Uint8Array) {
  global.Uint8Array = Uint8Array;
}

// Mock browser APIs for Astro component testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock fetch for any external requests in Astro components
global.fetch = vi.fn();

// Mock URL.createObjectURL and revokeObjectURL for video components
global.URL = global.URL || {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
};