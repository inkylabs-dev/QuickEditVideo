import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import VideoSpeedComponent from '../../../src/components/VideoSpeed';

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
    isLoaded: true,
    progress: 0,
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

// Mock FFmpegUtils
vi.mock('../../../src/FFmpegUtils', () => ({
  changeVideoSpeed: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  downloadVideo: vi.fn(),
}));

// Mock document.createElement for download functionality
const mockDownloadClick = vi.fn();
const originalCreateElement = document.createElement;

beforeEach(() => {
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
      Object.defineProperty(videoElement, 'duration', { writable: true, value: 60 });
      Object.defineProperty(videoElement, 'playbackRate', { writable: true, value: 1.0 });
      
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
      render(<VideoSpeedComponent />);
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });

    it('displays supported formats information', () => {
      render(<VideoSpeedComponent />);
      
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
    });

    it('has file input with correct attributes', () => {
      render(<VideoSpeedComponent />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'video/*');
    });
  });

  describe('File Selection', () => {
    it('accepts valid video files and switches to editing view', async () => {
      render(<VideoSpeedComponent />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Speed Controls')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays video filename after selection', async () => {
      render(<VideoSpeedComponent />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test-video.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('test-video.mp4')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Speed Controls Interface', () => {
    beforeEach(async () => {
      render(<VideoSpeedComponent />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Speed Controls')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays speed slider with correct attributes', () => {
      const speedSlider = screen.getByRole('slider');
      expect(speedSlider).toBeInTheDocument();
      expect(speedSlider).toHaveAttribute('min', '0.01');
      expect(speedSlider).toHaveAttribute('max', '4');
      expect(speedSlider).toHaveAttribute('step', '0.01');
    });

    it('shows current speed value', () => {
      expect(screen.getByText('Speed: 1x')).toBeInTheDocument();
    });

    it('displays all speed presets', () => {
      const presets = ['0.25x', '0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x', '4x'];
      
      // Get the preset buttons container to avoid conflicts with ruler labels
      const presetsContainer = screen.getByText('Quick presets').parentElement;
      expect(presetsContainer).toBeInTheDocument();
      
      presets.forEach(preset => {
        // Use getAllByText and filter to find buttons specifically
        const elements = screen.getAllByText(preset);
        const presetButton = elements.find(element => element.tagName === 'BUTTON');
        expect(presetButton).toBeInTheDocument();
      });
    });

    it('shows download button with speed indication', () => {
      expect(screen.getByText('Download 1x Speed Video')).toBeInTheDocument();
    });

    it('shows play preview button', () => {
      expect(screen.getByText('Play Preview')).toBeInTheDocument();
    });
  });

  describe('Speed Adjustment', () => {
    beforeEach(async () => {
      render(<VideoSpeedComponent />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Speed Controls')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('updates speed display when slider changes', async () => {
      const speedSlider = screen.getByRole('slider');
      
      await act(async () => {
        fireEvent.change(speedSlider, { target: { value: '2' } });
      });
      
      expect(screen.getByText('Speed: 2x')).toBeInTheDocument();
    });

    it('updates download button text when speed changes', async () => {
      const speedSlider = screen.getByRole('slider');
      
      await act(async () => {
        fireEvent.change(speedSlider, { target: { value: '2' } });
      });
      
      expect(screen.getByText('Download 2x Speed Video')).toBeInTheDocument();
    });

    it('shows interpolation option for slow speeds', async () => {
      const speedSlider = screen.getByRole('slider');
      
      await act(async () => {
        fireEvent.change(speedSlider, { target: { value: '0.5' } });
      });
      
      expect(screen.getByText('Use motion interpolation')).toBeInTheDocument();
    });

    it('hides interpolation option for normal/fast speeds', async () => {
      const speedSlider = screen.getByRole('slider');
      
      await act(async () => {
        fireEvent.change(speedSlider, { target: { value: '1.5' } });
      });
      
      expect(screen.queryByText('Use motion interpolation')).not.toBeInTheDocument();
    });
  });

  describe('Reset and Close Functionality', () => {
    beforeEach(async () => {
      render(<VideoSpeedComponent />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Speed Controls')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('has reset button with correct tooltip', () => {
      expect(screen.getByTitle('Reset to normal speed')).toBeInTheDocument();
    });

    it('has close button with correct tooltip', () => {
      expect(screen.getByTitle('Choose different video')).toBeInTheDocument();
    });

    it('resets speed to 1x when reset button is clicked', async () => {
      const speedSlider = screen.getByRole('slider');
      
      // Change speed first
      await act(async () => {
        fireEvent.change(speedSlider, { target: { value: '2' } });
      });
      
      expect(screen.getByText('Speed: 2x')).toBeInTheDocument();
      
      // Reset
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
      }, { timeout: 3000 });
    });
  });
});
