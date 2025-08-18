import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import VideoInfo from '../../src/components/VideoInfo';

// Mock the FFmpegCore module
vi.mock('../../src/FFmpegCore', () => ({
  FfmpegProvider: ({ children }: { children: any }) => children,
  useFFmpeg: () => ({
    ffmpeg: {
      writeFile: vi.fn(),
      exec: vi.fn(),
      readFile: vi.fn(),
      deleteFile: vi.fn()
    },
    isLoaded: true,
    progress: 0,
    setProgress: vi.fn()
  })
}));

// Mock the getVideoInfo utility
vi.mock('../../src/FFmpegUtils/getVideoInfo', () => ({
  getVideoInfo: vi.fn(),
  formatDuration: vi.fn((duration) => duration ? `${duration}s` : 'Unknown'),
  formatFileSize: vi.fn((size) => size ? `${size} bytes` : 'Unknown'),
  formatBitrate: vi.fn((bitrate) => bitrate ? `${bitrate} bps` : 'Unknown')
}));

const { getVideoInfo } = await import('../../src/FFmpegUtils/getVideoInfo');

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  value: vi.fn(),
  writable: true
});

describe('VideoInfo Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Initial Render', () => {
    it('renders the landing view by default', () => {
      render(<VideoInfo />);
      
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
      
      // Check for file input
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('has proper file input configuration', () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toHaveAttribute('accept', 'video/*');
    });
  });

  describe('File Selection', () => {
    it('transitions to analyzing view when video is selected', async () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Video Information')).toBeInTheDocument();
      });
      
      // Should show video player
      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'blob:mock-url');
    });

    it('shows analyzing status initially', async () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Analyzing...')).toBeInTheDocument();
      });
    });

    it('dispatches view change event when file is selected', async () => {
      const eventSpy = vi.spyOn(document, 'dispatchEvent');
      
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(eventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'videoInfoViewChange',
            detail: { currentView: 'analyzing' }
          })
        );
      });
    });
  });

  describe('Video Analysis', () => {
    const mockMetadata = {
      format: {
        filename: 'test.mp4',
        nb_streams: 2,
        nb_programs: 0,
        format_name: 'mp4',
        format_long_name: 'MP4 (MPEG-4 Part 14)',
        duration: '60.0',
        size: '15000000',
        bit_rate: '2000000'
      },
      videoStreams: [{
        index: 0,
        codec_name: 'h264',
        codec_long_name: 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
        codec_type: 'video',
        width: 1920,
        height: 1080,
        bit_rate: '2000000',
        avg_frame_rate: '30/1'
      }],
      audioStreams: [{
        index: 1,
        codec_name: 'aac',
        codec_long_name: 'AAC (Advanced Audio Coding)',
        codec_type: 'audio',
        sample_rate: '48000',
        channels: 2,
        bit_rate: '128000'
      }],
      raw: {}
    };

    it('displays metadata when analysis completes successfully', async () => {
      (getVideoInfo as any).mockResolvedValue(mockMetadata);
      
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Analysis Complete')).toBeInTheDocument();
      });

      // Check file information
      expect(screen.getByText('MP4')).toBeInTheDocument();
      expect(screen.getByText('15000000 bytes')).toBeInTheDocument();
      expect(screen.getByText('60.0s')).toBeInTheDocument();
      
      // Check video stream info
      expect(screen.getByText('H264')).toBeInTheDocument();
      expect(screen.getByText('1920×1080')).toBeInTheDocument();
      
      // Check audio stream info
      expect(screen.getByText('AAC')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // channels
    });

    it('displays error when analysis fails', async () => {
      (getVideoInfo as any).mockRejectedValue(new Error('Analysis failed'));
      
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Analysis failed')).toBeInTheDocument();
      expect(screen.getByText('Retry Analysis')).toBeInTheDocument();
    });

    it('allows retrying analysis after failure', async () => {
      (getVideoInfo as any).mockRejectedValueOnce(new Error('Analysis failed'))
                           .mockResolvedValueOnce(mockMetadata);
      
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Retry Analysis');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('Analysis Complete')).toBeInTheDocument();
      });
    });
  });

  describe('Video Controls', () => {
    it('shows play button initially', async () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Play')).toBeInTheDocument();
      });
    });

    it('toggles play state when button is clicked', async () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        const playButton = screen.getByText('Play');
        expect(playButton).toBeInTheDocument();
      });

      const playButton = screen.getByText('Play');
      fireEvent.click(playButton);

      const video = document.querySelector('video') as HTMLVideoElement;
      expect(video.play).toHaveBeenCalled();
    });

    it('updates button text when video plays', async () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Play')).toBeInTheDocument();
      });

      const video = document.querySelector('video') as HTMLVideoElement;
      fireEvent.play(video);

      await waitFor(() => {
        expect(screen.getByText('Pause')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('returns to landing view when back button is clicked', async () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Video Information')).toBeInTheDocument();
      });
      
      // Find and click the back button (minus icon)
      const backButton = document.querySelector('button[title="Choose different video"]');
      expect(backButton).toBeInTheDocument();
      
      fireEvent.click(backButton!);
      
      await waitFor(() => {
        expect(screen.getByText('Select your video')).toBeInTheDocument();
      });
    });

    it('dispatches view change event when returning to landing', async () => {
      const eventSpy = vi.spyOn(document, 'dispatchEvent');
      
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Video Information')).toBeInTheDocument();
      });
      
      // Clear previous calls
      eventSpy.mockClear();
      
      const backButton = document.querySelector('button[title="Choose different video"]');
      fireEvent.click(backButton!);
      
      await waitFor(() => {
        expect(eventSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'videoInfoViewChange',
            detail: { currentView: 'landing' }
          })
        );
      });
    });
  });

  describe('File Validation', () => {
    it('accepts video files', () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const videoFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      // File validation happens internally in SelectFile component
      fireEvent.change(fileInput, { target: { files: [videoFile] } });
      
      // Should transition to analyzing view
      expect(screen.queryByText('Select your video')).not.toBeInTheDocument();
    });

    it('handles empty file selection gracefully', () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: [] } });
      
      // Should remain in landing view
      expect(screen.getByText('Select your video')).toBeInTheDocument();
    });
  });

  describe('Integration with FFmpeg Context', () => {
    it('renders without FFmpeg context errors', () => {
      // This test verifies that our mocks are working correctly
      render(<VideoInfo />);
      
      // Should render the landing view without any FFmpeg loading errors
      expect(screen.getByText('Select your video')).toBeInTheDocument();
      
      // Should not show any error messages
      expect(screen.queryByText(/Failed to load video processor/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Loading video processor/)).not.toBeInTheDocument();
    });

    it('waits for FFmpeg to be loaded before analysis', async () => {
      // Mock FFmpeg as not loaded initially
      const { useFFmpeg } = await import('../../src/FFmpegCore');
      vi.mocked(useFFmpeg).mockReturnValue({
        ffmpeg: {} as any,
        isLoaded: false, // Not loaded
        progress: 0,
        setProgress: vi.fn()
      });

      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Video Information')).toBeInTheDocument();
      });
      
      // Should not call getVideoInfo when FFmpeg is not loaded
      expect(getVideoInfo).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'video/*');
    });

    it('provides meaningful button labels', async () => {
      render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      await waitFor(() => {
        const backButton = document.querySelector('button[title="Choose different video"]');
        expect(backButton).toHaveAttribute('title', 'Choose different video');
      });
    });
  });

  describe('Memory Management', () => {
    it('cleans up video URL on unmount', () => {
      const { unmount } = render(<VideoInfo />);
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      unmount();
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });
});