import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getVideoInfo, 
  formatDuration, 
  formatFileSize, 
  formatBitrate,
  type VideoMetadata 
} from '../../src/FFmpegUtils/getVideoInfo';

// Mock FFmpeg and fetchFile
const mockFFmpeg = {
  writeFile: vi.fn(),
  exec: vi.fn(),
  readFile: vi.fn(),
  deleteFile: vi.fn()
};

vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn()
}));

const { fetchFile } = await import('@ffmpeg/util');

describe('getVideoInfo utility', () => {
  const mockFile = new File(['mock content'], 'test.mp4', { type: 'video/mp4' });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (fetchFile as any).mockResolvedValue(new Uint8Array([1, 2, 3]));
    mockFFmpeg.writeFile.mockResolvedValue(undefined);
    mockFFmpeg.exec.mockResolvedValue(undefined);
    mockFFmpeg.deleteFile.mockResolvedValue(undefined);
  });

  describe('Basic Functionality', () => {
    it('extracts video metadata successfully', async () => {
      const mockProbeOutput = {
        streams: [
          {
            index: 0,
            codec_name: 'h264',
            codec_long_name: 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
            codec_type: 'video',
            width: 1920,
            height: 1080,
            bit_rate: '2000000',
            avg_frame_rate: '30/1',
            duration: '60.0',
            pix_fmt: 'yuv420p'
          },
          {
            index: 1,
            codec_name: 'aac',
            codec_long_name: 'AAC (Advanced Audio Coding)',
            codec_type: 'audio',
            sample_rate: '48000',
            channels: 2,
            channel_layout: 'stereo',
            bit_rate: '128000',
            duration: '60.0'
          }
        ],
        format: {
          filename: 'test.mp4',
          nb_streams: 2,
          nb_programs: 0,
          format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
          format_long_name: 'QuickTime / MOV',
          start_time: '0.0',
          duration: '60.0',
          size: '15000000',
          bit_rate: '2000000',
          probe_score: 100
        }
      };

      mockFFmpeg.readFile.mockResolvedValue(new TextEncoder().encode(JSON.stringify(mockProbeOutput)));

      const result = await getVideoInfo(mockFFmpeg as any, mockFile);

      expect(result).toBeDefined();
      expect(result.videoStreams).toHaveLength(1);
      expect(result.audioStreams).toHaveLength(1);
      expect(result.format.format_name).toBe('mov,mp4,m4a,3gp,3g2,mj2');
      
      // Check video stream
      expect(result.videoStreams[0].codec_name).toBe('h264');
      expect(result.videoStreams[0].width).toBe(1920);
      expect(result.videoStreams[0].height).toBe(1080);
      
      // Check audio stream
      expect(result.audioStreams[0].codec_name).toBe('aac');
      expect(result.audioStreams[0].channels).toBe(2);
    });

    it('calls FFmpeg with correct ffprobe parameters', async () => {
      const mockProbeOutput = {
        streams: [],
        format: {
          filename: 'test.mp4',
          nb_streams: 0,
          nb_programs: 0,
          format_name: 'mp4',
          format_long_name: 'MP4'
        }
      };

      mockFFmpeg.readFile.mockResolvedValue(new TextEncoder().encode(JSON.stringify(mockProbeOutput)));

      await getVideoInfo(mockFFmpeg as any, mockFile, 'test_input');

      expect(mockFFmpeg.writeFile).toHaveBeenCalledWith('test_input.mp4', expect.any(Uint8Array));
      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        'test_input.mp4'
      ]);
    });

    it('handles different file extensions correctly', async () => {
      const webmFile = new File(['mock content'], 'test.webm', { type: 'video/webm' });
      const mockProbeOutput = {
        streams: [],
        format: {
          filename: 'test.webm',
          nb_streams: 0,
          nb_programs: 0,
          format_name: 'webm',
          format_long_name: 'WebM'
        }
      };

      mockFFmpeg.readFile.mockResolvedValue(new TextEncoder().encode(JSON.stringify(mockProbeOutput)));

      await getVideoInfo(mockFFmpeg as any, webmFile);

      expect(mockFFmpeg.writeFile).toHaveBeenCalledWith('input_video.webm', expect.any(Uint8Array));
    });

    it('cleans up temporary files after processing', async () => {
      const mockProbeOutput = {
        streams: [],
        format: {
          filename: 'test.mp4',
          nb_streams: 0,
          nb_programs: 0,
          format_name: 'mp4',
          format_long_name: 'MP4'
        }
      };

      mockFFmpeg.readFile.mockResolvedValue(new TextEncoder().encode(JSON.stringify(mockProbeOutput)));

      await getVideoInfo(mockFFmpeg as any, mockFile);

      expect(mockFFmpeg.deleteFile).toHaveBeenCalledWith('input_video.mp4');
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledWith('ffprobe.json');
    });
  });

  describe('Error Handling', () => {
    it('throws error when FFmpeg exec fails', async () => {
      mockFFmpeg.exec.mockRejectedValue(new Error('FFmpeg execution failed'));

      await expect(getVideoInfo(mockFFmpeg as any, mockFile)).rejects.toThrow('Failed to extract video metadata');
    });

    it('throws error when JSON parsing fails', async () => {
      mockFFmpeg.readFile.mockResolvedValue(new TextEncoder().encode('invalid json'));

      await expect(getVideoInfo(mockFFmpeg as any, mockFile)).rejects.toThrow('Failed to extract video metadata');
    });

    it('handles cleanup errors gracefully', async () => {
      const mockProbeOutput = {
        streams: [],
        format: {
          filename: 'test.mp4',
          nb_streams: 0,
          nb_programs: 0,
          format_name: 'mp4',
          format_long_name: 'MP4'
        }
      };

      mockFFmpeg.readFile.mockResolvedValue(new TextEncoder().encode(JSON.stringify(mockProbeOutput)));
      mockFFmpeg.deleteFile.mockRejectedValue(new Error('File not found'));

      // Should not throw error despite cleanup failure
      const result = await getVideoInfo(mockFFmpeg as any, mockFile);
      expect(result).toBeDefined();
    });
  });

  describe('Stream Processing', () => {
    it('correctly separates video and audio streams', async () => {
      const mockProbeOutput = {
        streams: [
          {
            index: 0,
            codec_name: 'h264',
            codec_type: 'video',
            width: 1280,
            height: 720
          },
          {
            index: 1,
            codec_name: 'aac',
            codec_type: 'audio',
            channels: 2
          },
          {
            index: 2,
            codec_name: 'h265',
            codec_type: 'video',
            width: 1920,
            height: 1080
          }
        ],
        format: {
          filename: 'test.mp4',
          nb_streams: 3,
          nb_programs: 0,
          format_name: 'mp4',
          format_long_name: 'MP4'
        }
      };

      mockFFmpeg.readFile.mockResolvedValue(new TextEncoder().encode(JSON.stringify(mockProbeOutput)));

      const result = await getVideoInfo(mockFFmpeg as any, mockFile);

      expect(result.videoStreams).toHaveLength(2);
      expect(result.audioStreams).toHaveLength(1);
      
      expect(result.videoStreams[0].codec_name).toBe('h264');
      expect(result.videoStreams[1].codec_name).toBe('h265');
      expect(result.audioStreams[0].codec_name).toBe('aac');
    });

    it('handles missing stream properties gracefully', async () => {
      const mockProbeOutput = {
        streams: [
          {
            index: 0,
            codec_type: 'video'
            // Missing codec_name and other properties
          }
        ],
        format: {
          filename: 'test.mp4',
          nb_streams: 1,
          nb_programs: 0
          // Missing format_name and other properties
        }
      };

      mockFFmpeg.readFile.mockResolvedValue(new TextEncoder().encode(JSON.stringify(mockProbeOutput)));

      const result = await getVideoInfo(mockFFmpeg as any, mockFile);

      expect(result.videoStreams[0].codec_name).toBe('unknown');
      expect(result.videoStreams[0].codec_long_name).toBe('Unknown');
      expect(result.format.format_name).toBe('unknown');
      expect(result.format.format_long_name).toBe('Unknown format');
    });
  });
});

describe('Formatting utilities', () => {
  describe('formatDuration', () => {
    it('formats seconds correctly', () => {
      expect(formatDuration(45)).toBe('0:45');
      expect(formatDuration('45')).toBe('0:45');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3661)).toBe('1:01:01');
    });

    it('handles edge cases', () => {
      expect(formatDuration(undefined)).toBe('Unknown');
      expect(formatDuration(null as any)).toBe('Unknown');
      expect(formatDuration('invalid')).toBe('Unknown');
      expect(formatDuration(0)).toBe('0:00');
    });

    it('pads zeros correctly', () => {
      expect(formatDuration(5)).toBe('0:05');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3605)).toBe('1:00:05');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
      expect(formatFileSize('1048576')).toBe('1.0 MB');
    });

    it('handles edge cases', () => {
      expect(formatFileSize(undefined)).toBe('Unknown');
      expect(formatFileSize(null as any)).toBe('Unknown');
      expect(formatFileSize('invalid')).toBe('Unknown');
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
    });

    it('provides appropriate precision', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5 KB
      expect(formatFileSize(2621440)).toBe('2.5 MB'); // 2.5 MB
    });
  });

  describe('formatBitrate', () => {
    it('formats bitrates correctly', () => {
      expect(formatBitrate(1000)).toBe('1 kbps');
      expect(formatBitrate(1500000)).toBe('1.5 Mbps');
      expect(formatBitrate('128000')).toBe('128 kbps');
    });

    it('handles edge cases', () => {
      expect(formatBitrate(undefined)).toBe('Unknown');
      expect(formatBitrate(null as any)).toBe('Unknown');
      expect(formatBitrate('invalid')).toBe('Unknown');
      expect(formatBitrate(500)).toBe('500 bps');
    });

    it('uses appropriate units', () => {
      expect(formatBitrate(999)).toBe('999 bps');
      expect(formatBitrate(1001)).toBe('1 kbps');
      expect(formatBitrate(999999)).toBe('1000 kbps');
      expect(formatBitrate(1000000)).toBe('1.0 Mbps');
    });
  });
});