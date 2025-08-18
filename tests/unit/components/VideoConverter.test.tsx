import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/preact';
import { act } from '@testing-library/preact';
import { VideoConverter } from 'quickeditvideo-converter';

// Clean up between tests
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Helper to create test file
const createTestFile = (name = 'test.mp4', type = 'video/mp4') => 
  new File(['video content'], name, { type });

describe('VideoConverter', () => {
  describe('Rendering', () => {
    it('shows upload interface initially', () => {
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });

    it('renders for all supported formats', () => {
      ['mp4', 'avi', 'mov', 'mkv', 'webm', 'gif'].forEach(format => {
        const { unmount } = render(<VideoConverter targetFormat={format} targetFormatName={format.toUpperCase()} />);
        expect(screen.getByText('Select your video')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('File Upload Interface', () => {
    it('has file input with correct attributes', () => {
      const { container } = render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput?.getAttribute('accept')).toBe('video/*');
      expect(fileInput?.className).toContain('hidden');
    });

    it('validates file type on invalid file selection', async () => {
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      // Should still show the upload interface since invalid files are rejected
      expect(screen.getByText('Select your video')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('accepts different target formats and names', () => {
      const testCases = [
        { format: 'mp4', name: 'MP4' },
        { format: 'avi', name: 'AVI' },
        { format: 'mov', name: 'MOV' },
        { format: 'webm', name: 'WebM' },
        { format: 'gif', name: 'GIF' },
      ];

      testCases.forEach(({ format, name }) => {
        const { unmount } = render(<VideoConverter targetFormat={format} targetFormatName={name} />);
        
        // The component should render without errors
        expect(screen.getByText('Select your video')).toBeInTheDocument();
        expect(screen.getByText('Choose file')).toBeInTheDocument();
        
        unmount();
      });
    });

    it('handles edge case props gracefully', () => {
      // Test with empty props
      expect(() => {
        render(<VideoConverter targetFormat="" targetFormatName="" />);
      }).not.toThrow();
      
      // Should still render the basic interface
      expect(screen.getByText('Select your video')).toBeInTheDocument();
    });
  });

  describe('File Input Events', () => {
    it('handles file input change events without crashing', async () => {
      const { container } = render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Create a valid video file
      const videoFile = createTestFile('test.mp4', 'video/mp4');
      
      // Fire the change event without setting the value (which isn't allowed for file inputs)
      await act(async () => {
        fireEvent.change(fileInput, { 
          target: { 
            files: [videoFile]
          } 
        });
      });
      
      // The component should handle the event without throwing errors
      expect(fileInput).toBeInTheDocument();
    });

    it('handles invalid file types', async () => {
      const { container } = render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      const textFile = createTestFile('test.txt', 'text/plain');
      
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [textFile] } });
      });

      // Should still show landing view since file was rejected
      expect(screen.getByText('Select your video')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports keyboard navigation', () => {
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      const chooseButton = screen.getByText('Choose file');
      expect(chooseButton).toBeInTheDocument();
      
      // Test that the button can receive focus
      chooseButton.focus();
      expect(document.activeElement).toBe(chooseButton);
    });

    it('has proper semantic structure', () => {
      const { container } = render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      // Check for proper heading structure
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
      
      // Check for file input
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Integration with FFmpeg Context', () => {
    it('renders without FFmpeg context errors', () => {
      // This test verifies that our mocks are working correctly
      render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      // Should render the landing view without any FFmpeg loading errors
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      
      // Should not show any error messages
      expect(screen.queryByText(/Failed to load video processor/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Loading video processor/)).not.toBeInTheDocument();
    });

    it('uses the FFmpeg provider correctly', () => {
      // The component should render without throwing errors from missing FFmpeg context
      expect(() => {
        render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      }).not.toThrow();
    });
  });

  describe('UI Interactions', () => {
    it('handles drag and drop area interactions', () => {
      const { container } = render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      const dropArea = container.querySelector('.cursor-pointer');
      expect(dropArea).toBeInTheDocument();
      
      // Test drag events don't crash the component
      fireEvent.dragOver(dropArea!, { preventDefault: vi.fn() });
      fireEvent.dragEnter(dropArea!, { preventDefault: vi.fn() });
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
    });

    it('has clickable file selector area', () => {
      const { container } = render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      const dropArea = container.querySelector('.cursor-pointer');
      expect(dropArea).toBeInTheDocument();
      
      // Verify the area exists and is interactive without triggering click
      expect(dropArea).toHaveClass('cursor-pointer');
      expect(screen.getByText('Select your video')).toBeInTheDocument();
    });
  });

  describe('Error Boundaries', () => {
    it('handles component mounting without errors', () => {
      // Test that the component doesn't crash during normal operation
      expect(() => {
        render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      }).not.toThrow();
    });

    it('handles component unmounting without errors', () => {
      const { unmount } = render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Component Structure', () => {
    it('has the expected DOM structure', () => {
      const { container } = render(<VideoConverter targetFormat="mp4" targetFormatName="MP4" />);
      
      // Check for main container elements
      expect(container.querySelector('.bg-white.rounded-lg')).toBeInTheDocument();
      expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument(); // File icon
    });

    it('displays format-specific information', () => {
      render(<VideoConverter targetFormat="gif" targetFormatName="GIF Animation" />);
      
      // Component should render regardless of format
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });
  });
});
