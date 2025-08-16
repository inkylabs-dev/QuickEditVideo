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

// Use real FFmpeg binary for Node.js testing instead of mocks
import { NodeFFmpeg } from './ffmpeg-node-adapter';

vi.mock('@ffmpeg/ffmpeg', () => {
  return {
    FFmpeg: NodeFFmpeg,
  };
});

// Use real fetchFile function from the adapter
import { fetchFile } from './ffmpeg-node-adapter';

vi.mock('@ffmpeg/util', () => ({
  toBlobURL: vi.fn().mockResolvedValue('blob:mock-ffmpeg-url'),
  fetchFile: fetchFile,
}));

// Update FFmpegProvider mock to use real FFmpeg
vi.mock('../src/FFmpegCore/FfmpegProvider.tsx', async () => {
  const { NodeFFmpeg } = await import('./ffmpeg-node-adapter');
  
  const FfmpegProvider = ({ children }: { children: any }) => {
    return children; // Just pass through children for tests
  };

  return {
    FfmpegProvider,
  };
});

// Update useFFmpeg hook to use real FFmpeg
vi.mock('../src/FFmpegCore/useFFmpeg.ts', async () => {
  const { NodeFFmpeg } = await import('./ffmpeg-node-adapter');
  
  const useFFmpeg = () => {
    const ffmpeg = { current: new NodeFFmpeg() };
    
    // Initialize FFmpeg in tests
    if (ffmpeg.current) {
      ffmpeg.current.load();
    }
    
    return {
      ffmpeg,
      loaded: true,
      loading: false,
      isLoaded: true,
      isLoading: false,
      error: null,
      message: '',
      progress: 0,
      load: async () => {
        if (ffmpeg.current) {
          await ffmpeg.current.load();
        }
      },
      writeFile: async (name: string, data: Uint8Array) => {
        if (ffmpeg.current) {
          await ffmpeg.current.writeFile(name, data);
        }
      },
      readFile: async (name: string) => {
        if (ffmpeg.current) {
          return await ffmpeg.current.readFile(name);
        }
        return new Uint8Array([1, 2, 3, 4]);
      },
      exec: async (args: string[]) => {
        if (ffmpeg.current) {
          await ffmpeg.current.exec(args);
        }
      },
      setProgress: vi.fn(),
    };
  };

  return {
    useFFmpeg,
  };
});

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

// Mock HTMLVideoElement creation to auto-trigger loadedmetadata event
const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName: string) => {
  const element = originalCreateElement.call(document, tagName);
  if (tagName === 'video') {
    // Set default video properties
    Object.defineProperty(element, 'duration', { value: 60, configurable: true });
    Object.defineProperty(element, 'videoWidth', { value: 1920, configurable: true });
    Object.defineProperty(element, 'videoHeight', { value: 1080, configurable: true });
    
    // Auto-trigger onloadedmetadata when src is set
    let _src = '';
    Object.defineProperty(element, 'src', {
      get: () => _src,
      set: (value: string) => {
        _src = value;
        // Trigger loadedmetadata event immediately
        if ((element as any).onloadedmetadata) {
          // Use a microtask to ensure it's truly async but immediate
          Promise.resolve().then(() => {
            if ((element as any).onloadedmetadata) {
              (element as any).onloadedmetadata();
            }
          });
        }
      },
      configurable: true
    });
  }
  return element;
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

Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
  writable: true,
  value: 1920,
});

Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
  writable: true,
  value: 1080,
});

// Mock getBoundingClientRect for crop overlay calculations
HTMLVideoElement.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 640,
  height: 360,
  top: 0,
  left: 0,
  bottom: 360,
  right: 640,
  x: 0,
  y: 0,
  toJSON: () => ({}),
}));

// Mock parent element for container calculations
Object.defineProperty(HTMLVideoElement.prototype, 'parentElement', {
  get: () => ({
    getBoundingClientRect: () => ({
      width: 640,
      height: 360,
      top: 0,
      left: 0,
      bottom: 360,
      right: 640,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
  }),
  configurable: true
});

// Mock document.dispatchEvent for custom events
const originalDispatchEvent = document.dispatchEvent;
document.dispatchEvent = vi.fn(originalDispatchEvent);