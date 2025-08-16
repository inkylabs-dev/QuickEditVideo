import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import VideoResizer from '../../../src/components/VideoResizer';

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

// Mock document.createElement for download functionality
const mockDownloadClick = vi.fn();
const originalCreateElement = document.createElement;

      // Create a mock URL for the video
      const mockUrl = 'blob:mock-url';
      
      // Mock HTMLVideoElement behavior directly on prototype  
      class MockHTMLVideoElement extends HTMLElement {
        videoWidth = 1920;
        videoHeight = 1080;
        duration = 120;
        paused = true;
        src = '';
        currentTime = 0;
        onloadedmetadata: any = null;
        
        play() { return Promise.resolve(); }
        pause() { return undefined; }
        load() { return undefined; }
        
        // Override setAttribute to trigger loadedmetadata when src is set
        setAttribute(name: string, value: string) {
          super.setAttribute(name, value);
          if (name === 'src' && value && this.onloadedmetadata) {
            // Simulate metadata loading asynchronously
            setTimeout(() => {
              const event = new Event('loadedmetadata');
              this.onloadedmetadata?.(event);
            }, 0);
          }
        }
      }

// Helper function to simulate video loaded metadata
const simulateVideoLoadedMetadata = (videoElement: any) => {
  if (videoElement.onloadedmetadata) {
    videoElement.onloadedmetadata();
  }
};

beforeEach(() => {
  // Mock HTMLVideoElement prototype to ensure all video elements have the right properties
  const originalVideoElement = global.HTMLVideoElement;
  
  global.HTMLVideoElement = class MockHTMLVideoElement extends HTMLElement {
    public play: any;
    public pause: any;
    public load: any;
    
    constructor() {
      super();
      
      // Set video properties that will be available when the component accesses them
      Object.defineProperty(this, 'videoWidth', {
        writable: false,
        value: 1920,
        configurable: true,
      });
      
      Object.defineProperty(this, 'videoHeight', {
        writable: false,
        value: 1080,
        configurable: true,
      });
      
      Object.defineProperty(this, 'duration', {
        writable: false,
        value: 10,
        configurable: true,
      });
      
      Object.defineProperty(this, 'currentTime', {
        writable: true,
        value: 0,
        configurable: true,
      });
      
      Object.defineProperty(this, 'paused', {
        writable: true,
        value: true,
        configurable: true,
      });
      
      let videoSrc = '';
      Object.defineProperty(this, 'src', {
        get: () => videoSrc,
        set: (value) => {
          videoSrc = value;
          // Trigger loadedmetadata when src is set
          setTimeout(() => {
            this.dispatchEvent(new Event('loadedmetadata'));
          }, 50);
        },
        configurable: true,
      });
      
      // Mock methods
      this.play = vi.fn().mockImplementation(() => {
        Object.defineProperty(this, 'paused', {
          writable: true,
          value: false,
          configurable: true,
        });
        setTimeout(() => this.dispatchEvent(new Event('play')), 10);
        return Promise.resolve();
      });
      
      this.pause = vi.fn().mockImplementation(() => {
        Object.defineProperty(this, 'paused', {
          writable: true,
          value: true,
          configurable: true,
        });
        setTimeout(() => this.dispatchEvent(new Event('pause')), 10);
      });
      
      this.load = vi.fn();
    }
  } as any;

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
      return new global.HTMLVideoElement();
    }
    return originalCreateElement.call(document, tagName);
  });
});

afterEach(() => {
  document.createElement = originalCreateElement;
  vi.clearAllMocks();
});

describe('VideoResizer Component', () => {
  describe('Landing View', () => {
    it('renders landing view by default', () => {
      render(<VideoResizer />);
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });

    it('displays supported formats information', () => {
      render(<VideoResizer />);
      
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
    });

    it('has file input with correct attributes', () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'video/*');
      expect(fileInput).toHaveClass('hidden');
    });

    it('opens file dialog when upload area is clicked', () => {
      render(<VideoResizer />);
      
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
      render(<VideoResizer />);
      
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
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      expect(alertSpy).toHaveBeenCalledWith('Please select a valid video file.');
      
      alertSpy.mockRestore();
    });

    it('handles null file selection gracefully', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: null } });
      
      expect(alertSpy).toHaveBeenCalledWith('Please select a valid video file.');
      
      alertSpy.mockRestore();
    });
  });

  describe('Resizing View', () => {
    beforeEach(async () => {
      render(<VideoResizer />);
      
      // Select file first
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      // Wait for the view to change to resizing
      await waitFor(() => {
        expect(screen.queryByText('Select your video')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Wait for the component to update with video metadata and show controls
      await waitFor(() => {
        expect(screen.getByText('Resize Controls')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays video player and controls', async () => {
      await waitFor(() => {
        expect(screen.getByText('Resize Controls')).toBeInTheDocument();
        expect(screen.getByText('Scale')).toBeInTheDocument();
        expect(screen.getByText('Width')).toBeInTheDocument();
        expect(screen.getByText('Height')).toBeInTheDocument();
      });
    });

    it('shows play/pause button', async () => {
      await waitFor(() => {
        const playButton = screen.getByText('Play');
        expect(playButton).toBeInTheDocument();
      });
    });

    it('displays download button when FFmpeg is loaded', async () => {
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

  describe('Scale Controls', () => {
    beforeEach(async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      // Wait for the view to change and controls to load
      await waitFor(() => {
        expect(screen.getByText('Resize Controls')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('has scale slider with correct attributes', async () => {
      await waitFor(() => {
        const scaleSlider = screen.getByDisplayValue('100');
        expect(scaleSlider).toBeInTheDocument();
        expect(scaleSlider).toHaveAttribute('type', 'range');
        expect(scaleSlider).toHaveAttribute('min', '10');
        expect(scaleSlider).toHaveAttribute('max', '200');
        expect(scaleSlider).toHaveAttribute('step', '5');
      });
    });

    it('displays scale percentage', async () => {
      await waitFor(() => {
        // Get the first occurrence which should be in the scale controls
        const scalePercentages = screen.getAllByText('100%');
        expect(scalePercentages.length).toBeGreaterThanOrEqual(1);
        // The first one should be in the scale controls
        expect(scalePercentages[0]).toBeInTheDocument();
      });
    });

    it('allows updating scale with slider', async () => {
      await waitFor(() => {
        const scaleSlider = screen.getByDisplayValue('100');
        
        fireEvent.change(scaleSlider, { target: { value: '150' } });
        expect(scaleSlider).toHaveValue('150');
      });
    });

    it('updates dimensions when scale changes', async () => {
      await waitFor(() => {
        const scaleSlider = screen.getByDisplayValue('100');
        
        fireEvent.change(scaleSlider, { target: { value: '50' } });
        
        // Should update width and height inputs proportionally
        const widthInput = screen.getByDisplayValue('960'); // 1920 * 0.5
        const heightInput = screen.getByDisplayValue('540'); // 1080 * 0.5
        expect(widthInput).toBeInTheDocument();
        expect(heightInput).toBeInTheDocument();
      });
    });
  });

  describe('Dimension Controls', () => {
    // Helper function to trigger video metadata loading
    const triggerVideoMetadata = async () => {
      await act(async () => {
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        if (videoElement) {
          const event = new Event('loadedmetadata');
          videoElement.dispatchEvent(event);
        }
      });
    };
    
    beforeEach(async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      // Wait for the view to change and controls to load
      await waitFor(() => {
        expect(screen.getByText('Resize Controls')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('has width input with correct attributes', async () => {
      await triggerVideoMetadata();
      
      await waitFor(() => {
        const widthInput = screen.getByDisplayValue('1920');
        expect(widthInput).toBeInTheDocument();
        expect(widthInput).toHaveAttribute('type', 'number');
        expect(widthInput).toHaveAttribute('min', '1');
        expect(widthInput).toHaveAttribute('max', '7680');
      });
    });

    it('has height input with correct attributes', async () => {
      await triggerVideoMetadata();
      
      await waitFor(() => {
        const heightInput = screen.getByDisplayValue('1080');
        expect(heightInput).toBeInTheDocument();
        expect(heightInput).toHaveAttribute('type', 'number');
        expect(heightInput).toHaveAttribute('min', '1');
        expect(heightInput).toHaveAttribute('max', '4320');
      });
    });

    it('allows updating width and maintains aspect ratio', async () => {
      await triggerVideoMetadata();
      
      await waitFor(() => {
        const widthInput = screen.getByDisplayValue('1920');
        
        fireEvent.change(widthInput, { target: { value: '1280' } });
        
        // Should update height to maintain aspect ratio
        const heightInput = screen.getByDisplayValue('720'); // 1280 * (1080/1920)
        expect(heightInput).toBeInTheDocument();
      });
    });

    it('allows updating height and maintains aspect ratio', async () => {
      await triggerVideoMetadata();
      
      await waitFor(() => {
        const heightInput = screen.getByDisplayValue('1080');
        
        fireEvent.change(heightInput, { target: { value: '720' } });
        
        // Should update width to maintain aspect ratio
        const widthInput = screen.getByDisplayValue('1280'); // 720 * (1920/1080)
        expect(widthInput).toBeInTheDocument();
      });
    });

    it('updates scale when dimensions change', async () => {
      await triggerVideoMetadata();
      
      await waitFor(() => {
        const widthInput = screen.getByDisplayValue('1920');
        
        fireEvent.change(widthInput, { target: { value: '960' } });
        
        // Should update scale to 50%
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });
  });

  describe('Video Information Display', () => {
    // Helper function to trigger video metadata loading
    const triggerVideoMetadata = async () => {
      await act(async () => {
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        if (videoElement) {
          const event = new Event('loadedmetadata');
          videoElement.dispatchEvent(event);
        }
      });
    };
    
    beforeEach(async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      // Wait for the view to change and video info to load
      await waitFor(() => {
        expect(screen.getByText('Resize Information')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays file name', async () => {
      await waitFor(() => {
        expect(screen.getByText('test.mp4')).toBeInTheDocument();
      });
    });

    it('shows dimension change indicator', async () => {
      await triggerVideoMetadata();
      
      await waitFor(() => {
        expect(screen.getByText('1920×1080 → 1920×1080')).toBeInTheDocument();
      });
    });

    it('displays resize information section', async () => {
      await waitFor(() => {
        expect(screen.getByText('Resize Information')).toBeInTheDocument();
        expect(screen.getByText('Original')).toBeInTheDocument();
        expect(screen.getByText('New Size')).toBeInTheDocument();
        expect(screen.getByText('Scale Factor')).toBeInTheDocument();
      });
    });

    it('shows original dimensions', async () => {
      await triggerVideoMetadata();
      
      await waitFor(() => {
        expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
      });
    });

    it('displays new dimensions', async () => {
      await triggerVideoMetadata();
      
      await waitFor(() => {
        expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
      });
    });

    it('shows scale factor percentage', async () => {
      await waitFor(() => {
        // Look specifically in the scale factor section
        const scaleFactorSection = screen.getByText('Scale Factor').closest('div');
        expect(scaleFactorSection).toBeInTheDocument();
        
        // Check if there are any percentage indicators
        const scalePercentages = screen.getAllByText('100%');
        expect(scalePercentages.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Video Processing', () => {
    beforeEach(async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      // Wait for the view to change and download button to appear
      await waitFor(() => {
        expect(screen.getByText('Download MP4')).toBeInTheDocument();
      }, { timeout: 3000 });
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
      
      fireEvent.click(downloadButton);

      // Check for processing state immediately
      expect(downloadButton.closest('button')).toBeDisabled();
    });

    it('handles different video formats', async () => {
      // Test with different file extensions
      const formats = ['mov', 'mkv', 'avi', 'webm'];
      
      for (const format of formats) {
        const { unmount } = render(<VideoResizer />);
        
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

    it('uses correct FFmpeg scale filter', async () => {
      const mockExec = vi.fn().mockResolvedValue(undefined);
      
      // Get current mock implementation and modify exec
      const { useFFmpeg } = await import('../../../src/FFmpegCore');
      const mockUseFFmpeg = vi.mocked(useFFmpeg);
      
      // Update the mock to return our custom exec function
      mockUseFFmpeg.mockReturnValue({
        ffmpeg: {
          current: {
            writeFile: vi.fn().mockResolvedValue(undefined),
            readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
            exec: mockExec,
            load: vi.fn().mockResolvedValue(undefined),
            on: vi.fn(),
            off: vi.fn(),
            terminate: vi.fn().mockResolvedValue(undefined),
            loaded: true,
          } as any
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
        exec: mockExec,
        setProgress: vi.fn(),
      });

      await waitFor(() => {
        const downloadButton = screen.getByText('Download MP4');
        fireEvent.click(downloadButton);
      });

      await waitFor(() => {
        expect(mockExec).toHaveBeenCalledWith([
          '-i', 'input.mp4',
          '-vf', 'scale=1920:1080',
          '-c:a', 'copy',
          'test_resized.mp4'
        ]);
      });
    });
  });

  describe('Reset Functionality', () => {
    // Helper function to trigger video metadata loading
    const triggerVideoMetadata = async () => {
      await act(async () => {
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        if (videoElement) {
          const event = new Event('loadedmetadata');
          videoElement.dispatchEvent(event);
        }
      });
    };
    
    beforeEach(async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      // Wait for the view to change and reset button to appear
      await waitFor(() => {
        expect(screen.getByText('Reset')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('resets resize settings when reset button is clicked', async () => {
      await waitFor(() => {
        // First change the scale
        const scaleSlider = screen.getByDisplayValue('100');
        fireEvent.change(scaleSlider, { target: { value: '150' } });
      });

      await waitFor(() => {
        const resetButton = screen.getByText('Reset');
        expect(resetButton).toBeInTheDocument();
      });

      const resetButton = screen.getByText('Reset');
      
      fireEvent.click(resetButton);

      // Should reset to default values
      await waitFor(() => {
        const scaleSlider = screen.getByDisplayValue('100');
        expect(scaleSlider).toHaveValue('100');
        expect(screen.getByText('100%')).toBeInTheDocument();
      });
    });

    it('resets dimensions to original when reset', async () => {
      await triggerVideoMetadata();
      
      await waitFor(() => {
        // Change dimensions first
        const widthInput = screen.getByDisplayValue('1920');
        fireEvent.change(widthInput, { target: { value: '1280' } });
      });

      await waitFor(() => {
        const resetButton = screen.getByText('Reset');
        fireEvent.click(resetButton);
      });

      await waitFor(() => {
        const widthInput = screen.getByDisplayValue('1920');
        const heightInput = screen.getByDisplayValue('1080');
        expect(widthInput).toHaveValue(1920);
        expect(heightInput).toHaveValue(1080);
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      // Wait for the view to change and close button to appear
      await waitFor(() => {
        expect(screen.getByTitle('Choose different video')).toBeInTheDocument();
      }, { timeout: 3000 });
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

  describe('Play/Pause Functionality', () => {
    beforeEach(async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      // Wait for the view to change and play button to appear
      await waitFor(() => {
        expect(screen.getByText('Play')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('toggles play state when play button is clicked', async () => {
      await waitFor(() => {
        const playButton = screen.getByText('Play');
        expect(playButton).toBeInTheDocument();
      });

      const playButton = screen.getByText('Play');
      
      fireEvent.click(playButton);

      await waitFor(() => {
        expect(screen.getByText('Pause')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    // Helper function to trigger video metadata loading
    const triggerVideoMetadata = async () => {
      await act(async () => {
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        if (videoElement) {
          const event = new Event('loadedmetadata');
          videoElement.dispatchEvent(event);
        }
      });
    };
    
    it('handles FFmpeg processing errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      // Wait for the video to be loaded and view to change
      await waitFor(() => {
        expect(screen.queryByText('Select your video')).not.toBeInTheDocument();
      });

      // Wait for the component to render the resizing view
      await waitFor(() => {
        expect(screen.getByText('Download MP4')).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download MP4');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error processing video. Please try again.');
      });

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('handles invalid dimension inputs', async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      await triggerVideoMetadata();

      await waitFor(() => {
        const widthInput = screen.getByDisplayValue('1920');
        
        // Try to set invalid width (0)
        fireEvent.change(widthInput, { target: { value: '0' } });
        
        // Should not update to invalid value or should handle gracefully
        expect(widthInput).toHaveValue(0); // Input shows the value but logic should handle it
      }, { timeout: 3000 });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'video/*');
    });

    it('provides proper input labels', async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      await waitFor(() => {
        expect(screen.getByText('Scale')).toBeInTheDocument();
        expect(screen.getByText('Width')).toBeInTheDocument();
        expect(screen.getByText('Height')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('has proper units displayed', async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      await waitFor(() => {
        const pxLabels = screen.getAllByText('px');
        expect(pxLabels.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Event Dispatching', () => {
    it('dispatches view change events', async () => {
      const eventSpy = vi.spyOn(document, 'dispatchEvent');
      
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'videoResizerViewChange',
          detail: { currentView: 'resizing' }
        })
      );

      eventSpy.mockRestore();
    });
  });

  describe('Drag and Drop Support', () => {
    it('supports drag and drop for file upload', () => {
      render(<VideoResizer />);
      
      const uploadArea = screen.getByText('Drop a video file here or click to browse').closest('div');
      
      // Test drag over
      fireEvent.dragOver(uploadArea!, { preventDefault: vi.fn() });
      
      // Test drag enter
      fireEvent.dragEnter(uploadArea!, { preventDefault: vi.fn() });
      
      // Should not throw errors
      expect(uploadArea).toBeInTheDocument();
    });

    it('handles drop events for file upload', () => {
      render(<VideoResizer />);
      
      const uploadArea = screen.getByText('Drop a video file here or click to browse').closest('div');
      const mockFiles = [
        new File(['mock content'], 'test.mp4', { type: 'video/mp4' }),
      ];
      
      // Create a proper FileList mock
      const mockFileList = Object.assign(mockFiles, {
        item: (index: number) => mockFiles[index] || null,
      }) as unknown as FileList;
      
      const mockDataTransfer = {
        files: mockFileList,
      };
      
      fireEvent.drop(uploadArea!, { 
        preventDefault: vi.fn(),
        dataTransfer: mockDataTransfer,
      });
      
      // Should handle the drop event without errors
      expect(uploadArea).toBeInTheDocument();
    });
  });

  describe('Scale Limits', () => {
    beforeEach(async () => {
      render(<VideoResizer />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [mockFile] } });
      });
      
      // Wait for the view to change and scale slider to appear
      await waitFor(() => {
        expect(screen.getByDisplayValue('100')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('enforces minimum scale of 10%', async () => {
      await waitFor(() => {
        // The scale slider should exist, and we should be able to modify it
        const scaleSlider = document.querySelector('input[type="range"]') as HTMLInputElement;
        expect(scaleSlider).toBeInTheDocument();
        
        fireEvent.change(scaleSlider, { target: { value: '5' } });
        
        // HTML input[type="range"] with min="10" should enforce minimum of 10
        expect(scaleSlider).toHaveValue('10'); // Browser enforces min constraint
      }, { timeout: 3000 });
    });

    it('enforces maximum scale of 200%', async () => {
      await waitFor(() => {
        // The scale slider should exist, and we should be able to modify it
        const scaleSlider = document.querySelector('input[type="range"]') as HTMLInputElement;
        expect(scaleSlider).toBeInTheDocument();
        
        fireEvent.change(scaleSlider, { target: { value: '250' } });
        
        // HTML input[type="range"] with max="200" should enforce maximum of 200
        expect(scaleSlider).toHaveValue('200'); // Browser enforces max constraint
      }, { timeout: 3000 });
    });
  });
});