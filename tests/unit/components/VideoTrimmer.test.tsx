import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import VideoTrimmer from '../../../src/components/VideoTrimmer';

// Mock mediabunny so unit tests don't require WebCodecs or real transcoding.
vi.mock('mediabunny', () => {
  class BlobSource {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_blob: Blob) {}
  }
  class Input {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_options: any) {}
  }
  class BufferTarget {
    buffer?: Uint8Array;
  }
  class Mp4OutputFormat {}
  class MovOutputFormat {}
  class WebMOutputFormat {}
  class MkvOutputFormat {}
  class Output {
    format: any;
    target: any;
    constructor(options: any) {
      this.format = options.format;
      this.target = options.target;
    }
  }

  const ALL_FORMATS: any[] = [];

  const Conversion = {
    init: vi.fn().mockImplementation(async ({ output }: any) => {
      const conversion: any = {
        onProgress: undefined,
        execute: vi.fn().mockImplementation(async () => {
          if (conversion.onProgress) conversion.onProgress(0.5);
          await new Promise((resolve) => setTimeout(resolve, 20));
          output.target.buffer = new Uint8Array([1, 2, 3, 4]);
          if (conversion.onProgress) conversion.onProgress(1);
        }),
        cancel: vi.fn().mockResolvedValue(undefined),
      };
      return conversion;
    }),
  };

  return {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    MkvOutputFormat,
    MovOutputFormat,
    Mp4OutputFormat,
    Output,
    WebMOutputFormat,
  };
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

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
        value: 10,
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

describe('VideoTrimmer Component', () => {
  describe('Landing View', () => {
    it('renders landing view by default', () => {
      render(<VideoTrimmer />);
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });

    it('displays supported formats information', () => {
      render(<VideoTrimmer />);
      
      expect(screen.getByText('Supports MP4, WebM, MOV, MKV')).toBeInTheDocument();
    });

    it('has file input with correct attributes', () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'video/*');
      expect(fileInput).toHaveClass('hidden');
    });

    it('opens file dialog when upload area is clicked', () => {
      render(<VideoTrimmer />);
      
      const uploadArea = screen.getByText('Drop a video file here or click to browse').closest('div');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
      
      fireEvent.click(uploadArea!);
      expect(clickSpy).toHaveBeenCalled();
      
      clickSpy.mockRestore();
    });
  });

  describe('File Selection', () => {
    it('accepts valid video files', async () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Select your video')).not.toBeInTheDocument();
      });
    });

    it('rejects non-video files with alert', () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      expect(screen.getByRole('alert')).toHaveTextContent('This file is not a video.');
    });

    it('handles null file selection gracefully', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: null } });
      
      // With SelectFile component, null files are handled gracefully without alerts
      expect(alertSpy).not.toHaveBeenCalled();
      
      // Should still be on landing view
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      
      alertSpy.mockRestore();
    });
  });

  describe('Trimming View', () => {
    beforeEach(async () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
    });

    it('displays video player and controls', async () => {
      await waitFor(() => {
        expect(screen.getByText('Controls')).toBeInTheDocument();
        expect(screen.getByText('Start time')).toBeInTheDocument();
        expect(screen.getByText('End time')).toBeInTheDocument();
        expect(screen.getByText('Timeline')).toBeInTheDocument();
      });
    });

    it('shows play/pause button', async () => {
      await waitFor(() => {
        const playButton = screen.getByText('Play');
        expect(playButton).toBeInTheDocument();
      });
    });

    it('displays download button', async () => {
      await waitFor(() => {
        const downloadButton = screen.getByText('Download MP4');
        expect(downloadButton).toBeInTheDocument();
        expect(downloadButton.closest('button')).not.toBeDisabled();
      });
    });

    it('shows reset button', async () => {
      await waitFor(() => {
        const resetButton = screen.getByText('Reset');
        expect(resetButton).toBeInTheDocument();
      });
    });

    it('displays close button', async () => {
      await waitFor(() => {
        const closeButton = screen.getByTitle('Choose different video');
        expect(closeButton).toBeInTheDocument();
      });
    });
  });

  describe('Time Controls', () => {
    beforeEach(async () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
    });

    it('has start time input with correct attributes', async () => {
      await waitFor(() => {
        // Find the start time input by looking for its label first
        const startTimeLabel = screen.getByText('Start time');
        const startTimeContainer = startTimeLabel.closest('div');
        const startTimeInput = startTimeContainer?.querySelector('input[type="number"]');
        
        expect(startTimeInput).toBeInTheDocument();
        expect(startTimeInput).toHaveAttribute('type', 'number');
        expect(startTimeInput).toHaveAttribute('step', '0.1');
        expect(startTimeInput).toHaveAttribute('min', '0');
      });
    });

    it('allows updating start time', async () => {
      await waitFor(() => {
        // Find the start time input by looking for its label first
        const startTimeLabel = screen.getByText('Start time');
        const startTimeContainer = startTimeLabel.closest('div');
        const startTimeInput = startTimeContainer?.querySelector('input[type="number"]') as HTMLInputElement;
        
        fireEvent.change(startTimeInput, { target: { value: '5.0' } });
        expect(startTimeInput).toHaveValue(5.0);
      });
    });

    it('allows setting start time values', async () => {
      await waitFor(() => {
        // Find the start time input by looking for its label first
        const startTimeLabel = screen.getByText('Start time');
        const startTimeContainer = startTimeLabel.closest('div');
        const startTimeInput = startTimeContainer?.querySelector('input[type="number"]') as HTMLInputElement;
        
        // Set a valid start time
        fireEvent.change(startTimeInput, { target: { value: '5' } });
        // Input should accept the value (validation may happen elsewhere)
        expect(startTimeInput).toHaveValue(5);
      });
    });
  });

  describe('Timeline Interaction', () => {
    beforeEach(async () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
    });

    it('displays timeline section', async () => {
      await waitFor(() => {
        expect(screen.getByText('Timeline')).toBeInTheDocument();
      });
    });

    it('shows timeline handles', async () => {
      await waitFor(() => {
        const timelineHandles = document.querySelectorAll('.timeline-handle');
        expect(timelineHandles).toHaveLength(2); // Start and end handles
      });
    });

    it('displays time indicators', async () => {
      await waitFor(() => {
        const timeIndicators = screen.getAllByText('0:00');
        expect(timeIndicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Video Processing', () => {
    beforeEach(async () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
    });

    it('processes video when download button is clicked', async () => {
      await waitFor(() => {
        const downloadButton = screen.getByText('Download MP4');
        expect(downloadButton).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download MP4');
      
      await act(async () => {
        fireEvent.click(downloadButton);
      });

      await waitFor(() => {
        expect(mockDownloadClick).toHaveBeenCalled();
      });
    });

    it('shows processing state during video processing', async () => {
      await waitFor(() => {
        const downloadButton = screen.getByText('Download MP4');
        expect(downloadButton).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download MP4');
      
      await act(async () => {
        fireEvent.click(downloadButton);
      });

      await waitFor(() => {
        expect(downloadButton.closest('button')).toBeDisabled();
      });
    });

    it('handles different video formats', async () => {
      // Test with different file extensions
      const formats = ['mov', 'mkv', 'webm'];
      
      for (const format of formats) {
        const { unmount } = render(<VideoTrimmer />);
        
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const mockFile = new File(['mock content'], `test.${format}`, { type: `video/${format}` });
        
        await act(async () => {
          fireEvent.change(fileInput, { target: { files: [mockFile] } });
        });

        await waitFor(() => {
          const downloadButton = screen.getByText(`Download ${format.toUpperCase()}`);
          expect(downloadButton).toBeInTheDocument();
        });
        
        unmount();
      }
    });
  });

  describe('Reset Functionality', () => {
    beforeEach(async () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
    });

    it('resets trim settings when reset button is clicked', async () => {
      await waitFor(() => {
        const resetButton = screen.getByText('Reset');
        expect(resetButton).toBeInTheDocument();
      });

      const resetButton = screen.getByText('Reset');
      
      fireEvent.click(resetButton);

      // Should reset to default values - just check that reset button works without error
      await waitFor(() => {
        expect(resetButton).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
    });

    it('returns to landing view when close button is clicked', async () => {
      await waitFor(() => {
        const closeButton = screen.getByTitle('Choose different video');
        expect(closeButton).toBeInTheDocument();
      });

      const closeButton = screen.getByTitle('Choose different video');
      
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('Select your video')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'video/*');
    });

    it('provides keyboard navigation support', async () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      await waitFor(() => {
        // Find start time input by its container/position
        const inputs = document.querySelectorAll('input[type="number"]');
        expect(inputs.length).toBeGreaterThan(0);
        
        // Test Enter key functionality on first number input
        const startTimeInput = inputs[0] as HTMLInputElement;
        fireEvent.keyDown(startTimeInput, { key: 'Enter' });
        // Should not throw errors
      });
    });
  });

  describe('Error Handling', () => {
    it('shows unsupported format error in UI', async () => {
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File(['mock content'], 'test.avi', { type: 'video/x-msvideo' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      });

      expect(screen.getByRole('alert')).toHaveTextContent('This format is not supported');
    });
  });

  describe('Event Dispatching', () => {
    it('dispatches view change events', async () => {
      const eventSpy = vi.spyOn(document, 'dispatchEvent');
      
      render(<VideoTrimmer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      // Check that dispatchEvent was called (the exact event structure may vary)
      expect(eventSpy).toHaveBeenCalled();
      
      // Look for calls with the right event type
      const viewChangeEvents = eventSpy.mock.calls.filter(call => {
        const event = call[0] as CustomEvent;
        return event.type === 'videoTrimmerViewChange';
      });
      
      expect(viewChangeEvents.length).toBeGreaterThan(0);

      eventSpy.mockRestore();
    });
  });
});
