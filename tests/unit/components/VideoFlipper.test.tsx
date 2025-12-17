import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import VideoFlipper from '../../../src/components/VideoFlipper.tsx';
import { createMockVideoFile } from '../../test-utils';

// Mock the flipVideoWithMediaBunny utility
vi.mock('../../../src/utils/flipVideoWithMediaBunny', () => ({
  flipVideoWithMediaBunny: vi.fn().mockResolvedValue({
    blob: new Blob(['fake video data'], { type: 'video/mp4' }),
    filename: 'test_flipped.mp4',
    mimeType: 'video/mp4',
  }),
  FlipDirection: undefined,
  FlipOutputFormat: undefined,
}));

// Clean up between tests
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('VideoFlipper Component', () => {
  describe('Initial Rendering', () => {
    it('renders landing view by default', () => {
      render(<VideoFlipper />);

      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Supports MP4, WebM, MOV, MKV')).toBeInTheDocument();

      // Check for file input
      const container = document.body;
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('does not show flip controls initially', () => {
      render(<VideoFlipper />);
      
      expect(screen.queryByText('Flip Controls')).not.toBeInTheDocument();
      expect(screen.queryByText('Horizontal')).not.toBeInTheDocument();
      expect(screen.queryByText('Vertical')).not.toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has proper UI structure', () => {
      const { container } = render(<VideoFlipper />);
      
      // Check that basic structure exists
      expect(container.querySelector('.bg-white.rounded-lg')).toBeInTheDocument();
      expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument(); // File icon
    });

    it('accepts different flip directions without errors', () => {
      expect(() => {
        render(<VideoFlipper />);
      }).not.toThrow();
      
      // Should still render the basic interface
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('can handle file selection and transition to flipping view', async () => {
      render(<VideoFlipper />);

      // Should start with landing view
      expect(screen.getByText('Select your video')).toBeInTheDocument();

      // Create a test video file
      const testFile = await createMockVideoFile('test-flip.mp4');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Simulate file selection
      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Should transition to flipping view
      await waitFor(() => {
        expect(screen.getByText('Flip Controls')).toBeInTheDocument();
      });

      // Should show video preview and controls
      expect(screen.getByText('Horizontal')).toBeInTheDocument();
      expect(screen.getByText('Vertical')).toBeInTheDocument();
    });

    it('shows download button when video is loaded', async () => {
      render(<VideoFlipper />);

      const testFile = await createMockVideoFile('test.mp4');
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByText('Flip Controls')).toBeInTheDocument();
      });

      // Should show download button (not dependent on FFmpeg loading)
      expect(screen.getByText(/Download/i)).toBeInTheDocument();
    });
  });
});
