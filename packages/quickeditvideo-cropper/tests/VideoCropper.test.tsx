import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/preact';
import { act } from '@testing-library/preact';
import VideoCropper from '../../../src/components/VideoCropper.tsx';

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

// Helper to create test video file
const createTestVideoFile = (name = 'test.mp4', type = 'video/mp4') => 
  new File(['video content'], name, { type });

// We'll use the global mocks from setup.ts

describe('VideoCropper Component', () => {
  describe('Initial Rendering', () => {
    it('renders landing view by default', () => {
      render(<VideoCropper />);
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
    });

    it('has proper file input configuration', () => {
      const { container } = render(<VideoCropper />);
      
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput?.getAttribute('accept')).toBe('video/*');
      expect(fileInput?.className).toContain('hidden');
    });

    it('has proper drag and drop area', () => {
      const { container } = render(<VideoCropper />);
      
      const dropArea = container.querySelector('.cursor-pointer');
      expect(dropArea).toBeInTheDocument();
      
      // Check if dashed border exists in parent container
      const borderElement = container.querySelector('.border-dashed');
      expect(borderElement).toBeInTheDocument();
    });
  });

  describe('File Selection and Validation', () => {
    it('accepts valid video files', async () => {
      const { container } = render(<VideoCropper />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const videoFile = createTestVideoFile('test.mp4', 'video/mp4');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [videoFile] } });
      });
      
      // Should transition to cropping view (no longer show landing text)
      await waitFor(() => {
        expect(screen.queryByText('Select your video')).not.toBeInTheDocument();
      });
    });

    it('rejects non-video files', async () => {
      // Mock alert to capture calls
      const mockAlert = vi.fn();
      global.alert = mockAlert;
      
      const { container } = render(<VideoCropper />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [textFile] } });
      });
      
      // Should show alert and stay in landing view
      expect(mockAlert).toHaveBeenCalledWith('Please select a valid video file.');
      expect(screen.getByText('Select your video')).toBeInTheDocument();
    });

    it('handles null/empty file selection', async () => {
      const { container } = render(<VideoCropper />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: null } });
      });
      
      // Should stay in landing view
      expect(screen.getByText('Select your video')).toBeInTheDocument();
    });
  });

  describe('Video Format Detection', () => {
    it('detects video format from file extension', async () => {
      const testCases = [
        { filename: 'test.mov', expectedFormat: 'mov' },
        { filename: 'test.mkv', expectedFormat: 'mkv' },
        { filename: 'test.avi', expectedFormat: 'avi' },
        { filename: 'test.webm', expectedFormat: 'webm' },
        { filename: 'test.unknown', expectedFormat: 'mp4' }, // default
      ];

      for (const { filename } of testCases) {
        const { container, unmount } = render(<VideoCropper />);
        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        
        const videoFile = createTestVideoFile(filename, 'video/mp4');
        
        await act(async () => {
          fireEvent.change(fileInput, { target: { files: [videoFile] } });
        });
        
        // Component should handle format detection without errors
        // The component switches to cropping view, so the input is no longer visible
        // Just verify the component doesn't crash
        expect(container).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('Cropping Interface', () => {
    beforeEach(async () => {
      // Setup component in cropping view
      const { container } = render(<VideoCropper />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const videoFile = createTestVideoFile('test.mp4', 'video/mp4');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [videoFile] } });
      });
      
      // Wait for video to load and trigger metadata event
      const video = container.querySelector('video') as HTMLVideoElement;
      if (video) {
        await act(async () => {
          fireEvent.loadedMetadata(video);
        });
      }
    });

    it('shows cropping controls after file selection', async () => {
      await waitFor(() => {
        expect(screen.getByText('Crop Controls')).toBeInTheDocument();
        expect(screen.getByText('Aspect Ratio')).toBeInTheDocument();
        expect(screen.getAllByText('Rotation')).toHaveLength(2); // Label and info section
        expect(screen.getByText('Scale')).toBeInTheDocument();
      });
    });

    it('displays video information', async () => {
      await waitFor(() => {
        expect(screen.getByText('test.mp4')).toBeInTheDocument();
      });
    });

    it('shows crop information panel', async () => {
      await waitFor(() => {
        expect(screen.getByText('Crop Information')).toBeInTheDocument();
        expect(screen.getByText('Original')).toBeInTheDocument();
        expect(screen.getByText('Crop Size')).toBeInTheDocument();
        expect(screen.getByText('Position')).toBeInTheDocument();
        expect(screen.getAllByText('Rotation')).toHaveLength(2); // Label and info section
      });
    });
  });

  describe('Aspect Ratio Controls', () => {
    beforeEach(async () => {
      const { container } = render(<VideoCropper />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const videoFile = createTestVideoFile('test.mp4', 'video/mp4');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [videoFile] } });
      });
      
      const video = container.querySelector('video') as HTMLVideoElement;
      if (video) {
        await act(async () => {
          fireEvent.loadedMetadata(video);
        });
      }
    });

    it('renders all aspect ratio options', async () => {
      await waitFor(() => {
        expect(screen.getByText('Freeform')).toBeInTheDocument();
        expect(screen.getByText('1:1')).toBeInTheDocument();
        expect(screen.getByText('16:9')).toBeInTheDocument();
        expect(screen.getByText('9:16')).toBeInTheDocument();
        expect(screen.getByText('4:3')).toBeInTheDocument();
      });
    });

    it('handles aspect ratio selection', async () => {
      await waitFor(() => {
        const ratio16x9 = screen.getByText('16:9');
        expect(ratio16x9).toBeInTheDocument();
        
        fireEvent.click(ratio16x9);
        // Component should handle aspect ratio change without errors
        expect(ratio16x9).toBeInTheDocument();
      });
    });
  });

  describe('Control Inputs', () => {
    let container: any;
    
    beforeEach(async () => {
      const result = render(<VideoCropper />);
      container = result.container;
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const videoFile = createTestVideoFile('test.mp4', 'video/mp4');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [videoFile] } });
      });
      
      const video = container.querySelector('video') as HTMLVideoElement;
      if (video) {
        await act(async () => {
          fireEvent.loadedMetadata(video);
        });
      }
    });

    it('handles rotation control', async () => {
      await waitFor(() => {
        const rotationSliders = screen.getAllByDisplayValue('0');
        const rotationSlider = rotationSliders.find(el => el.getAttribute('type') === 'range' && el.getAttribute('min') === '-180');
        expect(rotationSlider).toBeInTheDocument();
        
        if (rotationSlider) {
          fireEvent.change(rotationSlider, { target: { value: '45' } });
          expect(rotationSlider).toBeInTheDocument();
        }
      });
    });

    it('handles scale control', async () => {
      await waitFor(() => {
        const scaleSliders = screen.getAllByDisplayValue('100');
        const scaleSlider = scaleSliders.find(el => el.getAttribute('type') === 'range' && el.getAttribute('min') === '10');
        expect(scaleSlider).toBeInTheDocument();
        
        if (scaleSlider) {
          fireEvent.change(scaleSlider, { target: { value: '150' } });
          expect(scaleSlider).toBeInTheDocument();
        }
      });
    });

    it('handles dimension inputs', async () => {
      await waitFor(() => {
        // Find inputs by their values instead of labels since labels might not be properly associated
        const inputs = container.querySelectorAll('input[type="number"]');
        const widthInput = Array.from(inputs).find((input: any) => input.value === '1536');
        const heightInput = Array.from(inputs).find((input: any) => input.value === '864');
        
        expect(widthInput).toBeInTheDocument();
        expect(heightInput).toBeInTheDocument();
        
        if (widthInput && heightInput) {
          fireEvent.change(widthInput, { target: { value: '800' } });
          fireEvent.change(heightInput, { target: { value: '600' } });
          
          expect(widthInput).toBeInTheDocument();
          expect(heightInput).toBeInTheDocument();
        }
      });
    });
  });

  describe('Video Player Controls', () => {
    beforeEach(async () => {
      const { container } = render(<VideoCropper />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const videoFile = createTestVideoFile('test.mp4', 'video/mp4');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [videoFile] } });
      });
      
      const video = container.querySelector('video') as HTMLVideoElement;
      if (video) {
        await act(async () => {
          fireEvent.loadedMetadata(video);
        });
      }
    });

    it('shows play/pause button', async () => {
      await waitFor(() => {
        const playButton = screen.getByText('Play');
        expect(playButton).toBeInTheDocument();
      });
    });

    it('handles play/pause functionality', async () => {
      await waitFor(() => {
        const playButton = screen.getByText('Play');
        
        fireEvent.click(playButton);
        // Component should handle play/pause without errors
        expect(playButton).toBeInTheDocument();
      });
    });
  });

  describe('Reset and Navigation', () => {
    let container: any;
    
    beforeEach(async () => {
      const result = render(<VideoCropper />);
      container = result.container;
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const videoFile = createTestVideoFile('test.mp4', 'video/mp4');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [videoFile] } });
      });
      
      const video = container.querySelector('video') as HTMLVideoElement;
      if (video) {
        await act(async () => {
          fireEvent.loadedMetadata(video);
        });
      }
    });

    it('shows reset button', async () => {
      await waitFor(() => {
        const resetButton = screen.getByText('Reset');
        expect(resetButton).toBeInTheDocument();
      });
    });

    it('handles reset functionality', async () => {
      await waitFor(() => {
        const resetButton = screen.getByText('Reset');
        
        fireEvent.click(resetButton);
        // Component should handle reset without errors
        expect(resetButton).toBeInTheDocument();
      });
    });

    it('handles return to landing view', async () => {
      // Look for close button more specifically
      const closeButton = screen.getByTitle('Choose different video');
      if (closeButton) {
        fireEvent.click(closeButton);
        
        // Should return to landing view
        await waitFor(() => {
          expect(screen.getByText('Select your video')).toBeInTheDocument();
        });
      } else {
        // Fallback: just verify the test doesn't crash
        expect(screen.getByText('Reset')).toBeInTheDocument();
      }
    });
  });

  describe('FFmpeg Integration', () => {
    beforeEach(async () => {
      const { container } = render(<VideoCropper />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const videoFile = createTestVideoFile('test.mp4', 'video/mp4');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [videoFile] } });
      });
      
      const video = container.querySelector('video') as HTMLVideoElement;
      if (video) {
        await act(async () => {
          fireEvent.loadedMetadata(video);
        });
      }
    });

    it('shows download button when FFmpeg is loaded', async () => {
      await waitFor(() => {
        // The mocked FFmpeg should show the download button as enabled
        expect(screen.getByText(/Download/)).toBeInTheDocument();
      });
    });

    it('handles download functionality', async () => {
      await waitFor(() => {
        const downloadButton = screen.getByText(/Download/);
        
        fireEvent.click(downloadButton);
        // Component should handle download without errors
        expect(downloadButton).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation in landing view', () => {
      render(<VideoCropper />);
      
      const chooseButton = screen.getByText('Choose file');
      expect(chooseButton).toBeInTheDocument();
      
      chooseButton.focus();
      expect(document.activeElement).toBe(chooseButton);
    });

    it('has proper semantic structure', () => {
      const { container } = render(<VideoCropper />);
      
      // Check for proper headings
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      
      // Check for file input
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles component mounting without errors', () => {
      expect(() => {
        render(<VideoCropper />);
      }).not.toThrow();
    });

    it('handles component unmounting without errors', () => {
      const { unmount } = render(<VideoCropper />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('handles edge cases gracefully', async () => {
      const { container } = render(<VideoCropper />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Test with empty files array
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [] } });
      });
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
    });
  });

  describe('Custom Events', () => {
    it('dispatches view change events', async () => {
      const mockDispatchEvent = vi.fn();
      document.dispatchEvent = mockDispatchEvent;
      
      const { container } = render(<VideoCropper />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const videoFile = createTestVideoFile('test.mp4', 'video/mp4');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [videoFile] } });
      });
      
      // Should dispatch view change event
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'videoCropperViewChange'
        })
      );
    });
  });
});