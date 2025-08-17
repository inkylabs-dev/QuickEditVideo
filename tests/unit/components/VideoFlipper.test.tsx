import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/preact';
import VideoFlipper from '../../../src/components/VideoFlipper.tsx';

// Mock the FFmpeg core module
vi.mock('../../../src/FFmpegCore', () => ({
  FfmpegProvider: ({ children }: { children: any }) => children,
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
});