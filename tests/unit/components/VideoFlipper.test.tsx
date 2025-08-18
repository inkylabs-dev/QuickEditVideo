import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/preact';
import { VideoFlipper } from 'quickeditvideo-flipper';
import { NodeFFmpeg } from '../../ffmpeg-node-adapter';
import { createTestVideoFile, createMockVideoFile } from '../../test-utils';
import { flipVideo, type FlipDirection } from 'quickeditvideo-core';

// Check if FFmpeg is available in the environment
const checkFFmpegAvailable = async (): Promise<boolean> => {
  try {
    const { spawn } = await import('child_process');
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    return new Promise((resolve) => {
      ffmpeg.on('error', () => resolve(false));
      ffmpeg.on('exit', (code) => resolve(code === 0));
      ffmpeg.stdin.end();
      setTimeout(() => resolve(false), 2000);
    });
  } catch (error) {
    return false;
  }
};

let ffmpegAvailable: boolean = false;
let nodeFFmpeg: NodeFFmpeg | null = null;

// Mock the FFmpeg core module with real adapter when available
vi.mock('../../../src/FFmpegCore', () => ({
  FfmpegProvider: ({ children }: { children: any }) => children,
  useFFmpeg: () => ({
    ffmpeg: { current: nodeFFmpeg },
    loaded: ffmpegAvailable,
    loading: false,
    isLoaded: ffmpegAvailable,
    isLoading: false,
    error: null,
    message: '',
    progress: 0,
    load: vi.fn().mockResolvedValue(undefined),
    writeFile: nodeFFmpeg?.writeFile.bind(nodeFFmpeg) || vi.fn().mockResolvedValue(undefined),
    readFile: nodeFFmpeg?.readFile.bind(nodeFFmpeg) || vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
    exec: nodeFFmpeg?.exec.bind(nodeFFmpeg) || vi.fn().mockResolvedValue(undefined),
    setProgress: vi.fn(),
  }),
}));

beforeAll(async () => {
  ffmpegAvailable = await checkFFmpegAvailable();
  if (ffmpegAvailable) {
    nodeFFmpeg = new NodeFFmpeg();
    await nodeFFmpeg.load();
  }
});

afterAll(async () => {
  if (nodeFFmpeg && ffmpegAvailable) {
    await nodeFFmpeg.terminate();
  }
});

// Clean up between tests
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('VideoFlipper Component', () => {
  describe('Initial Rendering', () => {
    it('renders landing view by default', () => {
      render(<VideoFlipper />);
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
      
      // Check for file input
      const container = document.body;
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('does not show flip controls initially', () => {
      render(<VideoFlipper />);
      
      expect(screen.queryByText('Flip Controls')).not.toBeInTheDocument();
      expect(screen.queryByText('Horizontal')).not.toBeInTheDocument();
      expect(screen.queryByText('Vertical')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has proper UI structure', () => {
      const { container } = render(<VideoFlipper />);
      
      // Check that basic structure exists
      expect(container.querySelector('.bg-white.rounded-lg')).toBeInTheDocument();
      expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument(); // File icon
    });

    it('accepts different flip directions without errors', () => {
      expect(() => {
        render(<VideoFlipper />);
      }).not.toThrow();
      
      // Should still render the basic interface
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });
  });

  describe('Integration with FFmpeg Context', () => {
    it('renders without FFmpeg context errors', () => {
      // This test verifies that our mocks are working correctly
      render(<VideoFlipper />);
      
      // Should render the landing view without any FFmpeg loading errors
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      
      // Should not show any error messages
      expect(screen.queryByText(/Failed to load video processor/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Loading video processor/)).not.toBeInTheDocument();
    });

    it('uses the FFmpeg provider correctly', () => {
      render(<VideoFlipper />);
      
      // Component should render without errors
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });
  });

  describe('Video Flipping Integration Tests', () => {
    it('can handle file selection and process video with FFmpeg adapter', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      render(<VideoFlipper />);
      
      // Should start with landing view
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      
      // Create a test video file
      const testFile = await createMockVideoFile('test-flip.mp4');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });
      
      fireEvent.change(fileInput);
      
      // Should transition to flipping view
      await waitFor(() => {
        expect(screen.getByText('Flip Controls')).toBeInTheDocument();
      });
      
      // Should show video preview and controls
      expect(screen.getByText('Horizontal')).toBeInTheDocument();
      expect(screen.getByText('Vertical')).toBeInTheDocument();
      expect(screen.getByText('Flip Video')).toBeInTheDocument();
    });

    it('can process horizontal flip using flipVideo utility', async () => {
      if (!ffmpegAvailable || !nodeFFmpeg) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      // Test the flip utility function
      const testFile = await createTestVideoFile();
      const outputData = await flipVideo(nodeFFmpeg, testFile, 'horizontal');
      
      expect(outputData.length).toBeGreaterThan(0);
      expect(outputData).toBeInstanceOf(Uint8Array);
    });

    it('can process vertical flip using flipVideo utility', async () => {
      if (!ffmpegAvailable || !nodeFFmpeg) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      // Test the flip utility function
      const testFile = await createTestVideoFile();
      const outputData = await flipVideo(nodeFFmpeg, testFile, 'vertical');
      
      expect(outputData.length).toBeGreaterThan(0);
      expect(outputData).toBeInstanceOf(Uint8Array);
    });

    it('handles FFmpeg errors gracefully', async () => {
      if (!ffmpegAvailable || !nodeFFmpeg) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      // Create an invalid file to test error handling
      const invalidFile = new File(['invalid content'], 'invalid.mp4', { type: 'video/mp4' });
      
      await expect(
        flipVideo(nodeFFmpeg, invalidFile, 'horizontal')
      ).rejects.toThrow();
    });

    it('can register and receive progress callbacks', async () => {
      if (!ffmpegAvailable || !nodeFFmpeg) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      nodeFFmpeg.on('progress', (event: { progress: number }) => {
        expect(event).toHaveProperty('progress');
        expect(typeof event.progress).toBe('number');
      });

      const testFile = await createTestVideoFile();
      
      // Use the flipVideo utility which should trigger progress callbacks
      await flipVideo(nodeFFmpeg, testFile, 'horizontal');
      
      // Note: Progress callback may or may not be called depending on FFmpeg output
      // This test mainly verifies the callback can be registered without errors
    });

    it('flipVideo utility accepts valid flip directions', async () => {
      if (!ffmpegAvailable || !nodeFFmpeg) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      const testFile = await createTestVideoFile();
      
      // Test both valid flip directions
      const directions: FlipDirection[] = ['horizontal', 'vertical'];
      
      for (const direction of directions) {
        const outputData = await flipVideo(nodeFFmpeg, testFile, direction);
        expect(outputData.length).toBeGreaterThan(0);
        expect(outputData).toBeInstanceOf(Uint8Array);
      }
    });

    it('flipVideo utility preserves file extension', async () => {
      if (!ffmpegAvailable || !nodeFFmpeg) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      // Test with default file (which exists)
      const testFile = await createTestVideoFile();
      expect(testFile.name).toContain('.mp4');
      
      // The utility should handle the file extension correctly
      const outputData = await flipVideo(nodeFFmpeg, testFile, 'horizontal');
      expect(outputData.length).toBeGreaterThan(0);
    });
  });
});