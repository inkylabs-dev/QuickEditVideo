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

// Mock FFmpeg for Node.js compatibility
vi.mock('@ffmpeg/ffmpeg', () => {
  const mockFFmpeg = vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    exec: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
    terminate: vi.fn().mockResolvedValue(undefined),
  }));

  return {
    FFmpeg: mockFFmpeg,
  };
});

// Mock FFmpeg util functions
vi.mock('@ffmpeg/util', () => ({
  toBlobURL: vi.fn().mockResolvedValue('blob:mock-ffmpeg-url'),
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
}));

// Mock the FFmpegProvider to always be in loaded state for tests
vi.mock('../src/FFmpegCore/FfmpegProvider.tsx', () => ({
  FfmpegProvider: ({ children }: { children: any }) => children,
}));

// Mock the useFFmpeg hook to provide a ready state
vi.mock('../src/FFmpegCore/useFFmpeg.ts', () => ({
  useFFmpeg: () => ({
    ffmpeg: { current: {
      load: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      exec: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      off: vi.fn(),
    }},
    loaded: true,
    loading: false,
    isLoaded: true,
    isLoading: false,
    error: null,
    message: '',
    progress: 0,
    load: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    exec: vi.fn().mockResolvedValue(undefined),
    setProgress: vi.fn(),
  }),
}));

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

// Mock alert for tests
global.alert = vi.fn();

// Mock HTMLVideoElement methods that might be called in tests
Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(HTMLVideoElement.prototype, 'duration', {
  writable: true,
  value: 60, // Mock 60 second duration
});

Object.defineProperty(HTMLVideoElement.prototype, 'paused', {
  writable: true,
  value: true,
});

// Mock document.dispatchEvent for custom events
const originalDispatchEvent = document.dispatchEvent;
document.dispatchEvent = vi.fn(originalDispatchEvent);