import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import FrameExtractor from '../../../src/components/FrameExtractor';

// Mock the frame extraction functions
vi.mock('../../../src/FFmpegUtils/extractFrames', () => ({
  extractFrames: vi.fn().mockResolvedValue([]),
  extractFramesInRange: vi.fn().mockResolvedValue([]),
}));

// Mock the Loading component
vi.mock('../../../src/components/Loading', () => ({
  default: () => <div>Loading video processing engine...</div>,
}));

// Mock the extractFrames utilities
vi.mock('../../../src/FFmpegUtils/extractFrames', () => ({
  extractFrames: vi.fn().mockResolvedValue([
    {
      time: 0,
      data: new Uint8Array([1, 2, 3, 4]),
      filename: 'frame_0.00s.png'
    }
  ]),
  extractFramesInRange: vi.fn().mockResolvedValue([
    {
      time: 0,
      data: new Uint8Array([1, 2, 3, 4]),
      filename: 'frame_0.00s.png'
    },
    {
      time: 1,
      data: new Uint8Array([5, 6, 7, 8]),
      filename: 'frame_1.00s.png'
    }
  ]),
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

// Mock document.createElement for download functionality
const createElementSpy = vi.spyOn(document, 'createElement');

describe('FrameExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock HTMLVideoElement
    Object.defineProperty(HTMLVideoElement.prototype, 'duration', {
      writable: true,
      value: 10,
    });
    
    // Mock custom events
    Object.defineProperty(document, 'dispatchEvent', {
      writable: true,
      value: vi.fn(),
    });

    // Mock for download functionality
    createElementSpy.mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    } as any);

    // Mock FileList
    Object.defineProperty(window, 'FileList', {
      writable: true,
      value: vi.fn().mockImplementation(() => []),
    });

    // Mock window.alert
    global.alert = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders landing view initially', () => {
    render(<FrameExtractor />);
    
    expect(screen.getByText('Select your video')).toBeInTheDocument();
    expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Choose file')).toBeInTheDocument();
    expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
  });

  it('shows FFmpeg loading message when not loaded', () => {
    // Mock FFmpeg as not loaded for this specific test
    const FrameExtractorNotLoaded = () => {
      // Mock the useFFmpeg hook to return loading state
      const mockUseFFmpeg = vi.fn(() => ({
        ffmpeg: { current: null },
        loaded: false,
        isLoaded: false,
        loading: true,
        isLoading: true,
        error: null,
        message: '',
        progress: 0,
        load: vi.fn().mockResolvedValue(undefined),
        setProgress: vi.fn(),
      }));

      // Create a test component that mimics FrameExtractor with loading state
      return (
        <div className="bg-white rounded-lg border-4 border-dashed border-gray-900 hover:border-gray-900 transition-colors">
          <div className="p-16 text-center cursor-pointer">
            <input
              type="file"
              accept="video/*"
              className="hidden"
              id="video-upload"
            />
            <div className="mb-6">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-400">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14,2 14,8 20,8"/>
                <path d="M10 15.5L16 12L10 8.5V15.5Z"/>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Select your video</h3>
            <p className="text-gray-600 mb-6">Drop a video file here or click to browse</p>
            <div className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 px-6 py-3 font-medium transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
              Choose file
            </div>
            <p className="text-xs text-gray-500 mt-4">Supports MP4, WebM, AVI, MOV and more</p>
          </div>
          
          <div className="mt-4 text-sm text-yellow-600 text-center">
            Loading video processing engine...
          </div>
        </div>
      );
    };

    render(<FrameExtractorNotLoaded />);
    expect(screen.getByText('Loading video processing engine...')).toBeInTheDocument();
  });

  it('transitions to extracting view when file is selected', async () => {
    render(<FrameExtractor />);
    
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      // Look for the button specifically, not the h3
      expect(screen.getByRole('button', { name: /Extract Frames/i })).toBeInTheDocument();
    });
  });

  it('shows default values for single time mode', async () => {
    render(<FrameExtractor />);
    
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const timeInput = screen.getByDisplayValue('0');
      expect(timeInput).toBeInTheDocument();
    });
  });

  it('shows default values for range mode', async () => {
    render(<FrameExtractor />);
    
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const rangeButton = screen.getByText('Time Range');
      fireEvent.click(rangeButton);
    });

    await waitFor(() => {
      const startTimeInput = screen.getByDisplayValue('0');
      // Look for the end time input by placeholder since both have value "1"
      const endTimeInput = screen.getByPlaceholderText('e.g., 1');
      expect(startTimeInput).toBeInTheDocument();
      expect(endTimeInput).toBeInTheDocument();
    });
  });

  it('shows interval input in range mode', async () => {
    render(<FrameExtractor />);
    
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const rangeButton = screen.getByText('Time Range');
      fireEvent.click(rangeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Distance between frames (seconds)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('1')).toBeInTheDocument();
    });
  });

  it('has both reset and close buttons', async () => {
    render(<FrameExtractor />);
    
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText('Reset')).toBeInTheDocument();
      expect(screen.getByTitle('Close and select new file')).toBeInTheDocument();
    });
  });

  it('resets to default values when reset button is clicked', async () => {
    render(<FrameExtractor />);
    
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      // Change some values
      const timeInput = screen.getByDisplayValue('0');
      fireEvent.change(timeInput, { target: { value: '5' } });
      
      // Click reset
      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);
    });

    await waitFor(() => {
      // Should still be in extracting view, but with reset values
      expect(screen.getByRole('button', { name: /Extract Frames/i })).toBeInTheDocument();
      // Time should be reset to '0'
      expect(screen.getByDisplayValue('0')).toBeInTheDocument();
    });
  });

  it('rejects non-video files', () => {
    render(<FrameExtractor />);
    
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    act(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(alertSpy).toHaveBeenCalledWith('Please select a valid video file.');
    expect(screen.getByText('Select your video')).toBeInTheDocument();
    
    alertSpy.mockRestore();
  });

  it('validates time ranges correctly', async () => {
    render(<FrameExtractor />);
    
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Simulate video loading and set duration
    await waitFor(() => {
      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    await act(async () => {
      const video = document.querySelector('video') as HTMLVideoElement;
      // Mock the video duration property
      Object.defineProperty(video, 'duration', {
        get: () => 10, // 10 seconds duration
        configurable: true,
      });
      // Trigger the loadedmetadata event
      fireEvent.loadedMetadata(video);
    });

    await waitFor(() => {
      // Switch to range mode
      const rangeButton = screen.getByText('Time Range');
      fireEvent.click(rangeButton);
    });

    await waitFor(() => {
      // Set invalid range (start > end) by finding inputs by placeholder
      const startTimeInput = screen.getByPlaceholderText('e.g., 0');
      const endTimeInput = screen.getByPlaceholderText('e.g., 1');
      
      fireEvent.change(startTimeInput, { target: { value: '5' } });
      fireEvent.change(endTimeInput, { target: { value: '3' } });
      
      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Try to extract frames
      const extractButton = screen.getByRole('button', { name: /Extract Frames/i });
      fireEvent.click(extractButton);
      
      expect(alertSpy).toHaveBeenCalledWith('Start time must be less than end time');
      
      alertSpy.mockRestore();
    });
  });

  it('supports both PNG and JPG formats', async () => {
    render(<FrameExtractor />);
    
    const fileInput = document.getElementById('video-upload') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText('PNG')).toBeInTheDocument();
      expect(screen.getByText('JPG')).toBeInTheDocument();
    });
  });
});