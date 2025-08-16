import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import FrameExtractor from '../../../src/components/FrameExtractor';

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
    // Mock FFmpeg as not loaded
    vi.doMock('../../../src/FFmpegCore', () => ({
      FfmpegProvider: ({ children }: { children: any }) => children,
      useFFmpeg: () => ({
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
      }),
    }));

    render(<FrameExtractor />);
    expect(screen.getByText('Loading video processing engine...')).toBeInTheDocument();
  });

  it('transitions to extracting view when file is selected', async () => {
    render(<FrameExtractor />);
    
    const fileInput = screen.getByLabelText(/Select your video/i);
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText('Extract Frames')).toBeInTheDocument();
    });
  });

  it('shows default values for single time mode', async () => {
    render(<FrameExtractor />);
    
    const fileInput = screen.getByLabelText(/Select your video/i);
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
    
    const fileInput = screen.getByLabelText(/Select your video/i);
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
      const endTimeInput = screen.getByDisplayValue('1');
      expect(startTimeInput).toBeInTheDocument();
      expect(endTimeInput).toBeInTheDocument();
    });
  });

  it('does not show interval input in range mode', async () => {
    render(<FrameExtractor />);
    
    const fileInput = screen.getByLabelText(/Select your video/i);
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      const rangeButton = screen.getByText('Time Range');
      fireEvent.click(rangeButton);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Interval/i)).not.toBeInTheDocument();
      expect(screen.getByText('Frames will be extracted every 1 second in the specified range')).toBeInTheDocument();
    });
  });

  it('has both reset and close buttons', async () => {
    render(<FrameExtractor />);
    
    const fileInput = screen.getByLabelText(/Select your video/i);
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText('Reset')).toBeInTheDocument();
      expect(screen.getByTitle('Close')).toBeInTheDocument();
    });
  });

  it('resets to default values when reset button is clicked', async () => {
    render(<FrameExtractor />);
    
    const fileInput = screen.getByLabelText(/Select your video/i);
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
      expect(screen.getByText('Select your video')).toBeInTheDocument();
    });
  });

  it('rejects non-video files', () => {
    render(<FrameExtractor />);
    
    const fileInput = screen.getByLabelText(/Select your video/i);
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
    
    const fileInput = screen.getByLabelText(/Select your video/i);
    const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      // Switch to range mode
      const rangeButton = screen.getByText('Time Range');
      fireEvent.click(rangeButton);
    });

    await waitFor(() => {
      // Set invalid range (start > end)
      const startTimeInput = screen.getByDisplayValue('0');
      const endTimeInput = screen.getByDisplayValue('1');
      
      fireEvent.change(startTimeInput, { target: { value: '5' } });
      fireEvent.change(endTimeInput, { target: { value: '3' } });
      
      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Try to extract frames
      const extractButton = screen.getByText('Extract Frames');
      fireEvent.click(extractButton);
      
      expect(alertSpy).toHaveBeenCalledWith('Start time must be less than end time');
      
      alertSpy.mockRestore();
    });
  });

  it('supports both PNG and JPG formats', async () => {
    render(<FrameExtractor />);
    
    const fileInput = screen.getByLabelText(/Select your video/i);
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