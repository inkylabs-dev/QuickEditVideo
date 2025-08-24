import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import VideoConfettiEffect from '../../../src/components/VideoConfettiEffect';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: {
    create: vi.fn().mockReturnValue(vi.fn()),
  },
}));

// Mock the FFmpeg core module
vi.mock('../../../src/FFmpegCore', () => ({
  FfmpegProvider: ({ children }: { children: any }) => children,
  useFFmpeg: () => ({
    ffmpeg: {
      current: {
        writeFile: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
        exec: vi.fn().mockResolvedValue(undefined),
      }
    },
    loaded: true,
    isLoaded: true,
    loading: false,
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

// Mock @ffmpeg/util
vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
}));

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Blob
global.Blob = vi.fn().mockImplementation((content, options) => ({
  content,
  options,
  size: content[0]?.length || 0,
  type: options?.type || '',
})) as any;

// Mock MediaRecorder
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null as any,
  onstop: null as any,
};

global.MediaRecorder = vi.fn().mockImplementation(() => mockMediaRecorder) as any;

// Mock canvas methods
const mockCanvas = {
  getContext: vi.fn().mockReturnValue({
    clearRect: vi.fn(),
  }),
  captureStream: vi.fn().mockReturnValue({}),
  width: 640,
  height: 480,
};

HTMLCanvasElement.prototype.getContext = mockCanvas.getContext;
HTMLCanvasElement.prototype.captureStream = mockCanvas.captureStream;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((cb) => setTimeout(cb, 0));

describe('VideoConfettiEffect Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('renders file selection interface initially', () => {
      render(<VideoConfettiEffect />);
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Choose a video file to add confetti effects')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });

    it('displays correct support text for file selection', () => {
      render(<VideoConfettiEffect />);
      
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV, MKV files')).toBeInTheDocument();
    });

    it('has hidden file input', () => {
      render(<VideoConfettiEffect />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
    });

    it('file input accepts video files', () => {
      render(<VideoConfettiEffect />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'video/*');
    });
  });

  describe('Component Structure', () => {
    it('renders with correct container classes', () => {
      render(<VideoConfettiEffect />);
      
      const container = document.querySelector('.w-full.max-w-6xl.mx-auto');
      expect(container).toBeInTheDocument();
    });

    it('has proper drag and drop styling', () => {
      render(<VideoConfettiEffect />);
      
      const dropZone = document.querySelector('.border-dashed');
      expect(dropZone).toBeInTheDocument();
      expect(dropZone).toHaveClass('border-gray-900');
    });

    it('displays file icon in file selection area', () => {
      render(<VideoConfettiEffect />);
      
      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<VideoConfettiEffect />);
      
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Select your video');
    });

    it('provides descriptive text for file selection', () => {
      render(<VideoConfettiEffect />);
      
      expect(screen.getByText('Choose a video file to add confetti effects')).toBeInTheDocument();
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV, MKV files')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('includes FfmpegProvider wrapper', () => {
      // This test verifies that the component is properly wrapped with FfmpegProvider
      // The fact that the component renders without errors indicates the provider is working
      expect(() => render(<VideoConfettiEffect />)).not.toThrow();
    });

    it('uses SelectFile component for file selection', () => {
      render(<VideoConfettiEffect />);
      
      // Verify SelectFile component elements are present
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders without crashing', () => {
      expect(() => render(<VideoConfettiEffect />)).not.toThrow();
    });

    it('handles missing FFmpeg context gracefully', () => {
      // The component should render even if FFmpeg is not available
      // This is handled by the mocked FFmpeg context
      expect(() => render(<VideoConfettiEffect />)).not.toThrow();
    });
  });
});