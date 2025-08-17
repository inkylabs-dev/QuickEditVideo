import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import VideoSpeed from '../../../src/components/VideoSpeed';

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

// Mock FFmpegUtils
vi.mock('../../../src/FFmpegUtils', () => ({
  changeVideoSpeed: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  downloadVideo: vi.fn(),
}));

// Mock document.createElement for download functionality
const mockDownloadClick = vi.fn();
const originalCreateElement = document.createElement;

beforeEach(() => {
  // Mock video element creation and properties
  document.createElement = vi.fn().mockImplementation((tagName) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        click: mockDownloadClick,
        style: {},
      };
    }
    if (tagName === 'video') {
      const videoElement = originalCreateElement.call(document, tagName) as HTMLVideoElement;
      Object.defineProperty(videoElement, 'duration', {
        writable: true,
        value: 60,
      });
      Object.defineProperty(videoElement, 'currentTime', {
        writable: true,
        value: 0,
      });
      Object.defineProperty(videoElement, 'videoWidth', {
        writable: true,
        value: 1920,
      });
      Object.defineProperty(videoElement, 'videoHeight', {
        writable: true,
        value: 1080,
      });
      Object.defineProperty(videoElement, 'playbackRate', {
        writable: true,
        value: 1.0,
      });
      
      // Mock loadedmetadata event to fire immediately
      setTimeout(() => {
        const event = new Event('loadedmetadata');
        videoElement.dispatchEvent(event);
      }, 0);
      
      return videoElement;
    }
    return originalCreateElement.call(document, tagName);
  });
});

afterEach(() => {
  document.createElement = originalCreateElement;
  vi.clearAllMocks();
});

describe('VideoSpeed Component', () => {
  describe('Landing View', () => {
    it('renders landing view by default', () => {
      render(<VideoSpeed />);
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });

    it('displays supported formats information', () => {
      render(<VideoSpeed />);
      
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
    });

    it('has file input with correct attributes', () => {
      render(<VideoSpeed />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'video/*');
      expect(fileInput).toHaveClass('hidden');
    });
  });

  describe('File Selection', () => {
    it('accepts valid video files', async () => {
      render(<VideoSpeed />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Speed Controls')).toBeInTheDocument();
      });
    });

    it('shows video info after file selection', async () => {
      render(<VideoSpeed />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test-video.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
        expect(screen.getByText('1x speed')).toBeInTheDocument();
      });
    });
  });

  describe('Speed Controls', () => {
    beforeEach(async () => {
      render(<VideoSpeed />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test-video.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Speed Controls')).toBeInTheDocument();
      });
    });

    it('displays speed slider with correct range', () => {
      const speedSlider = screen.getByRole('slider');
      expect(speedSlider).toBeInTheDocument();
      expect(speedSlider).toHaveAttribute('min', '0.25');
      expect(speedSlider).toHaveAttribute('max', '4');
      expect(speedSlider).toHaveAttribute('step', '0.25');
    });

    it('displays current speed value', () => {
      expect(screen.getByText('Speed: 1x')).toBeInTheDocument();
    });

    it('updates speed when slider changes', async () => {
      const speedSlider = screen.getByRole('slider');
      
      await act(async () => {
        fireEvent.change(speedSlider, { target: { value: '2' } });
      });
      
      expect(screen.getByText('Speed: 2x')).toBeInTheDocument();
    });

    it('displays speed presets', () => {
      const presets = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];
      
      presets.forEach(preset => {
        expect(screen.getByText(`${preset}x`)).toBeInTheDocument();
      });
    });

    it('sets speed when preset button is clicked', async () => {
      const preset2x = screen.getByText('2x');
      
      await act(async () => {
        fireEvent.click(preset2x);
      });
      
      expect(screen.getByText('Speed: 2x')).toBeInTheDocument();
    });
  });

  describe('Interpolation Controls', () => {
    beforeEach(async () => {
      render(<VideoSpeed />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test-video.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Speed Controls')).toBeInTheDocument();
      });
    });

    it('shows interpolation option when speed is less than 1x', async () => {
      const speedSlider = screen.getByRole('slider');
      
      await act(async () => {
        fireEvent.change(speedSlider, { target: { value: '0.5' } });
      });
      
      expect(screen.getByText('Use motion interpolation')).toBeInTheDocument();
    });

    it('hides interpolation option when speed is 1x or greater', async () => {
      const speedSlider = screen.getByRole('slider');
      
      await act(async () => {
        fireEvent.change(speedSlider, { target: { value: '1.5' } });
      });
      
      expect(screen.queryByText('Use motion interpolation')).not.toBeInTheDocument();
    });
  });

  describe('Video Player Controls', () => {
    beforeEach(async () => {
      render(<VideoSpeed />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test-video.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Speed Controls')).toBeInTheDocument();
      });
    });

    it('shows play button initially', () => {
      expect(screen.getByText('Play Preview')).toBeInTheDocument();
    });

    it('displays download button with current speed', () => {
      expect(screen.getByText('Download 1x Speed Video')).toBeInTheDocument();
    });

    it('updates download button text when speed changes', async () => {
      const speedSlider = screen.getByRole('slider');
      
      await act(async () => {
        fireEvent.change(speedSlider, { target: { value: '2' } });
      });
      
      expect(screen.getByText('Download 2x Speed Video')).toBeInTheDocument();
    });
  });

  describe('Reset and Close Functions', () => {
    beforeEach(async () => {
      render(<VideoSpeed />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test-video.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Speed Controls')).toBeInTheDocument();
      });
    });

    it('resets speed to 1x when reset button is clicked', async () => {
      const speedSlider = screen.getByRole('slider');
      
      // Change speed to 2x
      await act(async () => {
        fireEvent.change(speedSlider, { target: { value: '2' } });
      });
      
      expect(screen.getByText('Speed: 2x')).toBeInTheDocument();
      
      // Click reset button
      const resetButton = screen.getByTitle('Reset to normal speed');
      await act(async () => {
        fireEvent.click(resetButton);
      });
      
      expect(screen.getByText('Speed: 1x')).toBeInTheDocument();
    });

    it('returns to landing view when close button is clicked', async () => {
      const closeButton = screen.getByTitle('Choose different video');
      
      await act(async () => {
        fireEvent.click(closeButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Select your video')).toBeInTheDocument();
      });
    });
  });
});