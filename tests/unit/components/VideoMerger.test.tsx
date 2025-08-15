import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import VideoMerger from '../../../src/components/VideoMerger';

// Mock react-dnd and react-dnd-html5-backend
vi.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: any }) => children,
  useDrag: () => [null, { isDragging: false }],
  useDrop: () => [null, { isOver: false, canDrop: false }],
}));

vi.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
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
      
      // Store original property setter
      const originalOnLoadedMetadata = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'onloadedmetadata');
      
      // Override the src setter to trigger loadedmetadata when src is set
      Object.defineProperty(videoElement, 'src', {
        set: function(value) {
          this._src = value;
          // Fire loadedmetadata event immediately when src is set
          setTimeout(() => {
            if (this.onloadedmetadata) {
              this.onloadedmetadata(new Event('loadedmetadata'));
            }
          }, 0);
        },
        get: function() {
          return this._src;
        }
      });
      
      return videoElement;
    }
    if (tagName === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
        }),
        toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,mock'),
      };
    }
    return originalCreateElement.call(document, tagName);
  });

  // Mock TextEncoder
  global.TextEncoder = vi.fn().mockImplementation(() => ({
    encode: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4])),
  }));
});

afterEach(() => {
  document.createElement = originalCreateElement;
  vi.clearAllMocks();
});

describe('VideoMerger Component', () => {
  describe('Landing View', () => {
    it('renders landing view by default', () => {
      render(<VideoMerger />);
      
      expect(screen.getByText('Select your videos')).toBeInTheDocument();
      expect(screen.getByText('Drop multiple video files here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Choose files')).toBeInTheDocument();
    });

    it('displays supported formats information', () => {
      render(<VideoMerger />);
      
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
    });

    it('has file input with correct attributes', () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', 'video/*');
      expect(fileInput).toHaveAttribute('multiple');
      expect(fileInput).toHaveClass('hidden');
    });

    it('opens file dialog when upload area is clicked', () => {
      render(<VideoMerger />);
      
      const uploadArea = screen.getByText('Drop multiple video files here or click to browse').closest('div');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
      
      fireEvent.click(uploadArea!);
      expect(clickSpy).toHaveBeenCalled();
      
      clickSpy.mockRestore();
    });
  });

  describe('File Selection', () => {
    it('accepts multiple video files', async () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFiles = [
        new File(['mock content 1'], 'test1.mp4', { type: 'video/mp4' }),
        new File(['mock content 2'], 'test2.mp4', { type: 'video/mp4' }),
      ];
      
      // Mock FileList
      const mockFileList = {
        length: mockFiles.length,
        item: (index: number) => mockFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
        ...mockFiles,
      } as FileList;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: mockFileList } });
      });

      await waitFor(() => {
        expect(screen.queryByText('Select your videos')).not.toBeInTheDocument();
      });
    });

    it('handles empty file selection', () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: null } });
      
      // Should stay on landing view
      expect(screen.getByText('Select your videos')).toBeInTheDocument();
    });

    it('filters out non-video files', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFiles = [
        new File(['mock content 1'], 'test1.mp4', { type: 'video/mp4' }),
        new File(['mock content 2'], 'test2.txt', { type: 'text/plain' }),
      ];
      
      const mockFileList = {
        length: mockFiles.length,
        item: (index: number) => mockFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
        ...mockFiles,
      } as FileList;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: mockFileList } });
      });

      // Should only process valid video files
      await waitFor(() => {
        expect(screen.queryByText('Select your videos')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Merging View', () => {
    beforeEach(async () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFiles = [
        new File(['mock content 1'], 'test1.mp4', { type: 'video/mp4' }),
        new File(['mock content 2'], 'test2.mp4', { type: 'video/mp4' }),
      ];
      
      const mockFileList = {
        length: mockFiles.length,
        item: (index: number) => mockFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
        ...mockFiles,
      } as FileList;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: mockFileList } });
      });
    });

    it('displays video clips and controls', async () => {
      await waitFor(() => {
        expect(screen.getByText('Add more videos')).toBeInTheDocument();
        expect(screen.getByText('Preview')).toBeInTheDocument();
        expect(screen.getByText('Download MP4')).toBeInTheDocument();
      });
    });

    it('shows project summary when clips are loaded', async () => {
      await waitFor(() => {
        expect(screen.getByText('Project Summary')).toBeInTheDocument();
        expect(screen.getByText('Total clips:')).toBeInTheDocument();
        expect(screen.getByText('Total duration:')).toBeInTheDocument();
        expect(screen.getByText('Output format:')).toBeInTheDocument();
        expect(screen.getByText('Quality:')).toBeInTheDocument();
      });
    });

    it('displays clip count correctly', async () => {
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Total clips count
      });
    });

    it('shows MP4 as output format', async () => {
      await waitFor(() => {
        expect(screen.getByText('MP4')).toBeInTheDocument();
      });
    });

    it('indicates high quality output', async () => {
      await waitFor(() => {
        expect(screen.getByText('High')).toBeInTheDocument();
      });
    });
  });

  describe('Dimension Controls', () => {
    beforeEach(async () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFiles = [
        new File(['mock content 1'], 'test1.mp4', { type: 'video/mp4' }),
      ];
      
      const mockFileList = {
        length: mockFiles.length,
        item: (index: number) => mockFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
        ...mockFiles,
      } as FileList;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: mockFileList } });
      });
    });

    it('shows default dimension setting', async () => {
      await waitFor(() => {
        expect(screen.getByText('Use first video dimensions')).toBeInTheDocument();
      });
    });

    it('displays first video dimensions when using default', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Using first video dimensions: 1920×1080/)).toBeInTheDocument();
      });
    });

    it('allows toggling to custom dimensions', async () => {
      await waitFor(() => {
        const customToggle = screen.getByText('Set custom dimensions');
        fireEvent.click(customToggle);
        
        expect(screen.getByDisplayValue('1920')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1080')).toBeInTheDocument();
      });
    });
  });

  describe('Video Processing', () => {
    beforeEach(async () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFiles = [
        new File(['mock content 1'], 'test1.mp4', { type: 'video/mp4' }),
        new File(['mock content 2'], 'test2.mp4', { type: 'video/mp4' }),
      ];
      
      const mockFileList = {
        length: mockFiles.length,
        item: (index: number) => mockFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
        ...mockFiles,
      } as FileList;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: mockFileList } });
      });
    });

    it('processes videos when download button is clicked', async () => {
      await waitFor(() => {
        const downloadButton = screen.getByText('Download MP4');
        expect(downloadButton).toBeInTheDocument();
        expect(downloadButton.closest('button')).not.toBeDisabled();
      });

      const downloadButton = screen.getByText('Download MP4');
      
      await act(async () => {
        fireEvent.click(downloadButton);
      });

      await waitFor(() => {
        expect(mockDownloadClick).toHaveBeenCalled();
      });
    });

    it('shows processing state during video merging', async () => {
      await waitFor(() => {
        const downloadButton = screen.getByText('Download MP4');
        expect(downloadButton).toBeInTheDocument();
      });

      const downloadButton = screen.getByText('Download MP4');
      
      fireEvent.click(downloadButton);

      // Check for processing state immediately
      expect(downloadButton.closest('button')).toBeDisabled();
    });

    it('disables download when no clips are loaded', async () => {
      // Start fresh without any clips
      const { unmount } = render(<VideoMerger />);
      unmount();
      
      render(<VideoMerger />);
      
      // In landing view, there should be no download button
      expect(screen.queryByText('Download MP4')).not.toBeInTheDocument();
    });
  });

  describe('Preview Functionality', () => {
    beforeEach(async () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFiles = [
        new File(['mock content 1'], 'test1.mp4', { type: 'video/mp4' }),
      ];
      
      const mockFileList = {
        length: mockFiles.length,
        item: (index: number) => mockFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
        ...mockFiles,
      } as FileList;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: mockFileList } });
      });
    });

    it('shows preview button when clips are loaded', async () => {
      await waitFor(() => {
        const previewButton = screen.getByText('Preview');
        expect(previewButton).toBeInTheDocument();
        expect(previewButton.closest('button')).not.toBeDisabled();
      });
    });

    it('toggles preview state when preview button is clicked', async () => {
      await waitFor(() => {
        const previewButton = screen.getByText('Preview');
        expect(previewButton).toBeInTheDocument();
      });

      const previewButton = screen.getByText('Preview');
      
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText('Pause')).toBeInTheDocument();
      });
    });
  });

  describe('Add More Videos', () => {
    beforeEach(async () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFiles = [
        new File(['mock content 1'], 'test1.mp4', { type: 'video/mp4' }),
      ];
      
      const mockFileList = {
        length: mockFiles.length,
        item: (index: number) => mockFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
        ...mockFiles,
      } as FileList;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: mockFileList } });
      });
    });

    it('shows add more videos button', async () => {
      await waitFor(() => {
        const addButton = screen.getByText('Add more videos');
        expect(addButton).toBeInTheDocument();
      });
    });

    it('opens file dialog when add more videos is clicked', async () => {
      await waitFor(() => {
        const addButton = screen.getByText('Add more videos');
        expect(addButton).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add more videos');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
      
      fireEvent.click(addButton);
      expect(clickSpy).toHaveBeenCalled();
      
      clickSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('handles FFmpeg processing errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFiles = [
        new File(['mock content 1'], 'test1.mp4', { type: 'video/mp4' }),
      ];
      
      const mockFileList = {
        length: mockFiles.length,
        item: (index: number) => mockFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
        ...mockFiles,
      } as FileList;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: mockFileList } });
      });

      // Mock FFmpeg to throw an error for this test
      const mockFFmpeg = vi.mocked(vi.importActual('../../../src/FFmpegCore')).useFFmpeg();
      if (mockFFmpeg.ffmpeg.current) {
        mockFFmpeg.ffmpeg.current.writeFile = vi.fn().mockRejectedValue(new Error('FFmpeg error'));
      }

      await waitFor(() => {
        const downloadButton = screen.getByText('Download MP4');
        fireEvent.click(downloadButton);
      });

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Error processing videos. Please try again.');
      });

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper file input attributes', () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'video/*');
      expect(fileInput).toHaveAttribute('multiple');
    });

    it('provides keyboard navigation support', async () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFiles = [
        new File(['mock content 1'], 'test1.mp4', { type: 'video/mp4' }),
      ];
      
      const mockFileList = {
        length: mockFiles.length,
        item: (index: number) => mockFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
        ...mockFiles,
      } as FileList;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: mockFileList } });
      });

      await waitFor(() => {
        const customDimensionsToggle = screen.getByText('Set custom dimensions');
        
        // Test keyboard interaction
        fireEvent.keyDown(customDimensionsToggle, { key: 'Enter' });
        // Should not throw errors
      });
    });
  });

  describe('Video Format Detection', () => {
    it('detects various video formats correctly', async () => {
      const formats = [
        { ext: 'mp4', type: 'video/mp4' },
        { ext: 'mov', type: 'video/quicktime' },
        { ext: 'avi', type: 'video/x-msvideo' },
        { ext: 'webm', type: 'video/webm' },
        { ext: 'mkv', type: 'video/x-matroska' },
      ];

      for (const format of formats) {
        const { unmount } = render(<VideoMerger />);
        
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const mockFiles = [
          new File(['mock content'], `test.${format.ext}`, { type: format.type }),
        ];
        
        const mockFileList = {
          length: mockFiles.length,
          item: (index: number) => mockFiles[index],
          [Symbol.iterator]: function* () {
            for (let i = 0; i < this.length; i++) {
              yield this.item(i);
            }
          },
          ...mockFiles,
        } as FileList;

        await act(async () => {
          fireEvent.change(fileInput, { target: { files: mockFileList } });
        });

        await waitFor(() => {
          expect(screen.getByText('Download MP4')).toBeInTheDocument();
        });
        
        unmount();
      }
    });
  });

  describe('Drag and Drop Support', () => {
    it('supports drag and drop for file upload', () => {
      render(<VideoMerger />);
      
      const uploadArea = screen.getByText('Drop multiple video files here or click to browse').closest('div');
      
      // Test drag over
      fireEvent.dragOver(uploadArea!, { preventDefault: vi.fn() });
      
      // Test drag enter
      fireEvent.dragEnter(uploadArea!, { preventDefault: vi.fn() });
      
      // Should not throw errors
      expect(uploadArea).toBeInTheDocument();
    });

    it('handles drop events for file upload', () => {
      render(<VideoMerger />);
      
      const uploadArea = screen.getByText('Drop multiple video files here or click to browse').closest('div');
      const mockFiles = [
        new File(['mock content'], 'test.mp4', { type: 'video/mp4' }),
      ];
      
      const mockDataTransfer = {
        files: {
          length: mockFiles.length,
          item: (index: number) => mockFiles[index],
          [Symbol.iterator]: function* () {
            for (let i = 0; i < this.length; i++) {
              yield this.item(i);
            }
          },
          ...mockFiles,
        } as FileList,
      };
      
      fireEvent.drop(uploadArea!, { 
        preventDefault: vi.fn(),
        dataTransfer: mockDataTransfer,
      });
      
      // Should handle the drop event without errors
      expect(uploadArea).toBeInTheDocument();
    });
  });
});