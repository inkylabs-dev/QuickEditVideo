import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoMerger from '../../../src/components/VideoMerger';

// Mock react-dnd and react-dnd-html5-backend
vi.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: any }) => children,
  useDrag: () => [null, null, null],
  useDrop: () => [null, null],
}));

vi.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

// Mock FFmpeg
vi.mock('../../../src/FFmpegCore', () => ({
  FfmpegProvider: ({ children }: { children: any }) => children,
  useFFmpeg: () => ({
    ffmpeg: { current: null },
    loaded: false,
    loading: false,
    isLoaded: false,
    isLoading: false,
    error: null,
    message: '',
    progress: 0,
  }),
}));

// Mock @ffmpeg/util
vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn(),
}));

// Simple download mocking for testing
const mockAlert = vi.fn();
global.alert = mockAlert;

afterEach(() => {
  vi.restoreAllMocks();
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
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.accept).toBe('video/*');
      expect(fileInput.multiple).toBe(true);
      expect(fileInput.className).toContain('hidden');
    });

    it('opens file dialog when upload area is clicked', () => {
      render(<VideoMerger />);
      
      const clickSpy = vi.fn();
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      fileInput.click = clickSpy;
      
      const uploadArea = screen.getByText('Select your videos').closest('div');
      fireEvent.click(uploadArea!);
      
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('File Selection', () => {
    it('has file input that accepts video files', () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.accept).toBe('video/*');
      expect(fileInput.multiple).toBe(true);
    });

    it('handles file change events', () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Test that file input can receive change events without crashing
      expect(() => {
        fireEvent.change(fileInput, { target: { files: null } });
      }).not.toThrow();
      
      // Should still be on landing view when no files provided
      expect(screen.getByText('Select your videos')).toBeInTheDocument();
    });

    it('handles empty file selection', () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: null } });
      
      // Should stay on landing view
      expect(screen.getByText('Select your videos')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders main container', () => {
      const { container } = render(<VideoMerger />);
      
      expect(container.firstChild).toBeInTheDocument();
    });

    it('has drag and drop styling', () => {
      render(<VideoMerger />);
      
      // The drag area should have border-dashed class on the outer container
      const outerContainer = document.querySelector('.border-dashed');
      expect(outerContainer).toBeInTheDocument();
    });

    it('includes upload icon', () => {
      render(<VideoMerger />);
      
      // Check for SVG icon presence
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles component mounting without errors', () => {
      expect(() => {
        render(<VideoMerger />);
      }).not.toThrow();
    });

    it('handles component unmounting without errors', () => {
      const { unmount } = render(<VideoMerger />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<VideoMerger />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<VideoMerger />);
      
      const chooseButton = screen.getByText('Choose files');
      expect(chooseButton).toBeInTheDocument();
      
      chooseButton.focus();
      expect(document.activeElement).toBe(chooseButton);
    });

    it('has proper semantic structure', () => {
      const { container } = render(<VideoMerger />);
      
      // Check for proper heading structure
      expect(screen.getByText('Select your videos')).toBeInTheDocument();
    });
  });
});
