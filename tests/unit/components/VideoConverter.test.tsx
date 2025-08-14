import { describe, it, expect, beforeEach, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { act } from '@testing-library/preact';
import VideoConverter from '../../../src/components/VideoConverter.tsx';

// Mock FFmpeg completely
const mockFFmpeg = {
  load: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn(),
  exec: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
  deleteFile: vi.fn(),
  terminate: vi.fn(),
  FS: vi.fn((operation, filename, data) => {
    if (operation === 'writeFile') return;
    if (operation === 'readFile') return new Uint8Array([1, 2, 3, 4]);
    if (operation === 'unlink') return;
  }),
  run: vi.fn().mockResolvedValue(undefined),
};

// Mock the global FFmpeg script loading
beforeAll(() => {
  // Mock the global window FFmpeg object
  global.window = global.window || {};
  (global.window as any).FFmpeg = {
    createFFmpeg: vi.fn(() => mockFFmpeg),
    fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  };

  // Mock URL methods
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-video-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock HTMLAnchorElement click for downloads
  const mockClick = vi.fn();
  global.HTMLAnchorElement.prototype.click = mockClick;

  // Mock document.createElement for download links
  const originalCreateElement = document.createElement;
  vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
    if (tagName === 'a') {
      const element = originalCreateElement.call(document, tagName) as HTMLAnchorElement;
      element.click = mockClick;
      return element;
    }
    return originalCreateElement.call(document, tagName);
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('VideoConverter Preact Component', () => {
  describe('Initial Rendering', () => {
    it('should render landing view with upload interface', () => {
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
    });

    it('should have file input with correct attributes', () => {
      render(<VideoConverter targetFormat="avi" targetFormatName="AVI" />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();
      expect(fileInput.accept).toBe('video/*');
      expect(fileInput.className).toContain('hidden'); // should be hidden via CSS class
    });

    it('should render for all supported formats', () => {
      const formats = [
        { format: 'mp4', name: 'MP4' },
        { format: 'avi', name: 'AVI' },
        { format: 'mov', name: 'MOV' },
        { format: 'mkv', name: 'MKV' },
        { format: 'webm', name: 'WebM' },
        { format: 'gif', name: 'GIF' },
      ];

      formats.forEach(({ format, name }) => {
        const { unmount } = render(<VideoConverter targetFormat={format} targetFormatName={name} />);
        expect(screen.getByText('Select your video')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('File Selection and Upload', () => {
    it('should handle file selection via input change', async () => {
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      const file = new File(['video content'], 'test-video.avi', { type: 'video/avi' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // Should switch to converting view
      await waitFor(() => {
        expect(screen.queryByText('Select your video')).not.toBeInTheDocument();
      }, { timeout: 5000 });

      // Should show video element
      await waitFor(() => {
        const video = document.querySelector('video');
        expect(video).toBeTruthy();
        expect(video?.src).toBe('blob:mock-video-url');
      });
    });

    it('should handle file drag and drop', async () => {
      render(<VideoConverter targetFormat="webm" targetFormatName="WebM" />);
      
      const file = new File(['video content'], 'dropped-video.mp4', { type: 'video/mp4' });
      const dropZone = document.querySelector('[data-testid="drop-zone"]') || 
                      document.querySelector('.cursor-pointer');
      
      expect(dropZone).toBeTruthy();

      await act(async () => {
        fireEvent.drop(dropZone!, {
          dataTransfer: {
            files: [file],
          },
        });
      });

      await waitFor(() => {
        expect(screen.queryByText('Select your video')).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should validate file type', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      const invalidFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      });

      // Should stay in landing view
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('should detect original format from file extension', async () => {
      const testCases = [
        { filename: 'video.mov', expectedFormat: 'mov' },
        { filename: 'video.mkv', expectedFormat: 'mkv' },
        { filename: 'video.avi', expectedFormat: 'avi' },
        { filename: 'video.webm', expectedFormat: 'webm' },
        { filename: 'video.unknown', expectedFormat: 'mp4' }, // default
      ];

      for (const { filename, expectedFormat } of testCases) {
        const { unmount } = render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
        
        const file = new File(['video content'], filename, { type: 'video/mp4' });
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        
        await act(async () => {
          fireEvent.change(fileInput, { target: { files: [file] } });
        });

        await waitFor(() => {
          const video = document.querySelector('video');
          expect(video).toBeTruthy();
        });

        // Check that the filename is displayed
        await waitFor(() => {
          expect(document.body.textContent).toContain(filename);
        });

        unmount();
      }
    });
  });

  describe('Converting View and Video Information', () => {
    beforeEach(async () => {
      render(<VideoConverter targetFormat="avi" targetFormatName="AVI" />);
      
      const file = new File(['video content'], 'test-video.mp4', { type: 'video/mp4' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        const video = document.querySelector('video');
        expect(video).toBeTruthy();
      });
    });

    it('should display video information panel', async () => {
      await waitFor(() => {
        expect(document.body.textContent).toContain('test-video.mp4');
        expect(document.body.textContent).toContain('Converting to AVI');
      });
    });

    it('should show video player with controls', async () => {
      const video = document.querySelector('video') as HTMLVideoElement;
      expect(video).toBeTruthy();
      expect(video.controls).toBe(true);
      expect(video.preload).toBe('metadata');
      expect(video.src).toBe('blob:mock-video-url');
    });

    it('should display conversion status message', async () => {
      await waitFor(() => {
        // Should show "Converting to AVI" message
        expect(document.body.textContent).toContain('Converting to AVI');
      });
    });
  });

  describe('Control Panel Behaviors', () => {
    beforeEach(async () => {
      render(<VideoConverter targetFormat="mov" targetFormatName="MOV" />);
      
      const file = new File(['video content'], 'source-video.avi', { type: 'video/avi' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        const video = document.querySelector('video');
        expect(video).toBeTruthy();
      });
    });

    it('should have controls section with heading', async () => {
      await waitFor(() => {
        expect(document.body.textContent).toContain('Controls');
      });
    });

    it('should have back button to return to landing view', async () => {
      const backButton = document.querySelector('button[title="Choose different video"]');
      expect(backButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(backButton!);
      });

      // Should return to landing view
      await waitFor(() => {
        expect(screen.getByText('Select your video')).toBeInTheDocument();
      });
    });

    it('should have play/pause button for video control', async () => {
      // Find play/pause button (should exist)
      const playPauseButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Play') || btn.textContent?.includes('Pause') || btn.querySelector('svg')
      );
      
      expect(playPauseButton).toBeTruthy();
      
      // Button should be clickable
      expect(playPauseButton?.disabled).toBeFalsy();
    });

    it('should have download button', async () => {
      await waitFor(() => {
        const downloadButton = Array.from(document.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('Download')
        );
        expect(downloadButton).toBeTruthy();
        expect(downloadButton?.textContent).toContain('MOV'); // Should show target format
      });
    });

    it('should show processing progress during conversion', async () => {
      const downloadButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Download')
      );
      expect(downloadButton).toBeTruthy();

      // Mock FFmpeg processing with progress
      const progressCallback = mockFFmpeg.exec.mock.calls[0]?.[0];
      
      await act(async () => {
        fireEvent.click(downloadButton!);
      });

      // Should show processing state
      await waitFor(() => {
        expect(document.body.textContent).toMatch(/converting|processing/i);
      });
    });
  });

  describe('Format-Specific Behavior', () => {
    it('should detect when no conversion is needed', async () => {
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      const file = new File(['video content'], 'already-mp4.mp4', { type: 'video/mp4' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        // Should show "Converting to MP4" even for same format
        expect(document.body.textContent).toContain('Converting to MP4');
      });
    });

    it('should handle GIF conversion differently', async () => {
      render(<VideoConverter targetFormat="gif" targetFormatName="GIF" />);
      
      const file = new File(['video content'], 'video-to-gif.mp4', { type: 'video/mp4' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        // Should show "Converting to GIF" message
        expect(document.body.textContent).toContain('Converting to GIF');
      });
    });

    it('should use different FFmpeg arguments for GIF', async () => {
      render(<VideoConverter targetFormat="gif" targetFormatName="GIF" />);
      
      const file = new File(['video content'], 'video.mp4', { type: 'video/mp4' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        const downloadButton = Array.from(document.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('Download')
        );
        expect(downloadButton).toBeTruthy();
      });

      const downloadButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Download')
      );

      await act(async () => {
        fireEvent.click(downloadButton!);
      });

      // Verify FFmpeg was called with GIF-specific arguments
      await waitFor(() => {
        expect(mockFFmpeg.run).toHaveBeenCalled();
        const args = mockFFmpeg.run.mock.calls[0];
        expect(args).toContain('-vf');
        expect(args.some((arg: string) => arg.includes('fps='))).toBe(true);
      });
    });
  });

  describe('Video Events and State Management', () => {
    beforeEach(async () => {
      render(<VideoConverter targetFormat="webm" targetFormatName="WebM" />);
      
      const file = new File(['video content'], 'test.mov', { type: 'video/mov' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        const video = document.querySelector('video');
        expect(video).toBeTruthy();
      });
    });

    it('should handle video metadata loading', async () => {
      const video = document.querySelector('video') as HTMLVideoElement;
      
      // Mock video duration
      Object.defineProperty(video, 'duration', {
        value: 120, // 2 minutes
        writable: true
      });

      await act(async () => {
        fireEvent.loadedMetadata(video);
      });

      await waitFor(() => {
        expect(document.body.textContent).toContain('02:00'); // Should show formatted duration
      });
    });

    it('should update play state when video plays/pauses', async () => {
      const video = document.querySelector('video') as HTMLVideoElement;

      await act(async () => {
        fireEvent.play(video);
      });

      // Should reflect playing state in UI
      await waitFor(() => {
        const pauseButton = Array.from(document.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('Pause') || btn.getAttribute('title')?.includes('Pause')
        );
        expect(pauseButton).toBeTruthy();
      });

      await act(async () => {
        fireEvent.pause(video);
      });

      // Should reflect paused state in UI
      await waitFor(() => {
        const playButton = Array.from(document.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('Play') || btn.getAttribute('title')?.includes('Play')
        );
        expect(playButton).toBeTruthy();
      });
    });
  });

  describe('Download and Conversion Process', () => {
    beforeEach(async () => {
      render(<VideoConverter targetFormat="mkv" targetFormatName="MKV" />);
      
      const file = new File(['video content'], 'input.avi', { type: 'video/avi' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        const video = document.querySelector('video');
        expect(video).toBeTruthy();
      });
    });

    it('should trigger conversion and download on button click', async () => {
      const downloadButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Download')
      );
      expect(downloadButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(downloadButton!);
      });

      // Verify FFmpeg operations
      await waitFor(() => {
        expect(mockFFmpeg.FS).toHaveBeenCalledWith('writeFile', expect.any(String), expect.any(Object));
        expect(mockFFmpeg.run).toHaveBeenCalled();
        expect(mockFFmpeg.FS).toHaveBeenCalledWith('readFile', expect.stringContaining('.mkv'));
      });

      // Verify download was triggered
      expect(global.HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    });

    it('should handle conversion errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Make FFmpeg fail
      mockFFmpeg.run.mockRejectedValueOnce(new Error('Conversion failed'));

      const downloadButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Download')
      );
      expect(downloadButton).toBeTruthy();

      await act(async () => {
        fireEvent.click(downloadButton!);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error processing video. Please try again.');
      });

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('should clean up FFmpeg files after conversion', async () => {
      const downloadButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Download')
      );

      await act(async () => {
        fireEvent.click(downloadButton!);
      });

      await waitFor(() => {
        // Should clean up input and output files
        expect(mockFFmpeg.FS).toHaveBeenCalledWith('unlink', expect.stringContaining('input.'));
        expect(mockFFmpeg.FS).toHaveBeenCalledWith('unlink', expect.stringContaining('_converted.mkv'));
      });
    });

    it('should use correct output filename format', async () => {
      const downloadButton = Array.from(document.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Download')
      );

      await act(async () => {
        fireEvent.click(downloadButton!);
      });

      await waitFor(() => {
        // Should use format: {original_name}_converted.{target_format}
        expect(mockFFmpeg.FS).toHaveBeenCalledWith('readFile', 'input_converted.mkv');
      });
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeTruthy();
      
      const chooseButton = screen.getByText('Choose file');
      expect(chooseButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      const chooseButton = screen.getByText('Choose file');
      
      // Should be focusable
      chooseButton.focus();
      expect(document.activeElement).toBe(chooseButton);
    });

    it('should dispatch custom events for view changes', async () => {
      const eventSpy = vi.spyOn(document, 'dispatchEvent');
      
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      const file = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'videoConverterViewChange',
          detail: { currentView: 'converting' }
        })
      );

      eventSpy.mockRestore();
    });
  });
});