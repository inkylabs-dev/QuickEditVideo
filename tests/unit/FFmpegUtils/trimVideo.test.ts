import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trimVideo } from '../../../src/FFmpegUtils/trimVideo';

// Mock @ffmpeg/util
vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
}));

describe('trimVideo', () => {
  let mockFFmpeg: any;
  let mockFile: File;

  beforeEach(() => {
    mockFFmpeg = {
      writeFile: vi.fn().mockResolvedValue(undefined),
      readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
      exec: vi.fn().mockResolvedValue(undefined),
    };

    mockFile = new File(['test video content'], 'test.mp4', { type: 'video/mp4' });
  });

  describe('short duration clips (< 4 seconds)', () => {
    it('should use re-encoding for 1 second clip', async () => {
      await trimVideo(mockFFmpeg, mockFile, 0, 1);

      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        "-ss", "0",
        "-i", "input.mp4",
        "-t", "1",
        "-avoid_negative_ts", "make_zero",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "aac",
        "output.mp4"
      ]);
    });

    it('should use re-encoding for 2 second clip', async () => {
      await trimVideo(mockFFmpeg, mockFile, 0.5, 2.5);

      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        "-ss", "0.5",
        "-i", "input.mp4",
        "-t", "2",
        "-avoid_negative_ts", "make_zero",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "aac",
        "output.mp4"
      ]);
    });

    it('should use re-encoding for 3.9 second clip', async () => {
      await trimVideo(mockFFmpeg, mockFile, 1, 4.9);

      const expectedDuration = (4.9 - 1).toString();
      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        "-ss", "1",
        "-i", "input.mp4",
        "-t", expectedDuration,
        "-avoid_negative_ts", "make_zero",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "aac",
        "output.mp4"
      ]);
    });
  });

  describe('long duration clips (>= 4 seconds)', () => {
    it('should use stream copy for 4 second clip', async () => {
      await trimVideo(mockFFmpeg, mockFile, 0, 4);

      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        "-i", "input.mp4",
        "-ss", "0",
        "-t", "4",
        "-c", "copy",
        "output.mp4"
      ]);
    });

    it('should use stream copy for 10 second clip', async () => {
      await trimVideo(mockFFmpeg, mockFile, 2, 12);

      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        "-i", "input.mp4",
        "-ss", "2",
        "-t", "10",
        "-c", "copy",
        "output.mp4"
      ]);
    });

    it('should use stream copy for long clip', async () => {
      await trimVideo(mockFFmpeg, mockFile, 5, 65);

      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        "-i", "input.mp4",
        "-ss", "5",
        "-t", "60",
        "-c", "copy",
        "output.mp4"
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle exactly 4 second boundary', async () => {
      await trimVideo(mockFFmpeg, mockFile, 0, 4);

      // Should use stream copy (not re-encoding) for exactly 4 seconds
      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        "-i", "input.mp4",
        "-ss", "0",
        "-t", "4",
        "-c", "copy",
        "output.mp4"
      ]);
    });

    it('should handle very short clip (0.1 seconds)', async () => {
      await trimVideo(mockFFmpeg, mockFile, 1.5, 1.6);

      const expectedDuration = (1.6 - 1.5).toString();
      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        "-ss", "1.5",
        "-i", "input.mp4",
        "-t", expectedDuration,
        "-avoid_negative_ts", "make_zero",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "aac",
        "output.mp4"
      ]);
    });

    it('should handle fractional seconds', async () => {
      await trimVideo(mockFFmpeg, mockFile, 1.5, 4.7);

      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        "-ss", "1.5",
        "-i", "input.mp4",
        "-t", "3.2",
        "-avoid_negative_ts", "make_zero",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "aac",
        "output.mp4"
      ]);
    });
  });

  describe('file handling', () => {
    it('should write input file to FFmpeg filesystem', async () => {
      await trimVideo(mockFFmpeg, mockFile, 0, 2);

      expect(mockFFmpeg.writeFile).toHaveBeenCalledWith(
        'input.mp4',
        expect.any(Uint8Array)
      );
    });

    it('should read output file from FFmpeg filesystem', async () => {
      await trimVideo(mockFFmpeg, mockFile, 0, 2);

      expect(mockFFmpeg.readFile).toHaveBeenCalledWith('output.mp4');
    });

    it('should return trimmed video data', async () => {
      const expectedData = new Uint8Array([5, 6, 7, 8]);
      mockFFmpeg.readFile.mockResolvedValue(expectedData);

      const result = await trimVideo(mockFFmpeg, mockFile, 0, 2);

      expect(result).toEqual(expectedData);
    });

    it('should handle different file extensions', async () => {
      const aviFile = new File(['test'], 'video.avi', { type: 'video/avi' });
      
      await trimVideo(mockFFmpeg, aviFile, 0, 2);

      expect(mockFFmpeg.writeFile).toHaveBeenCalledWith(
        'input.avi',
        expect.any(Uint8Array)
      );
      expect(mockFFmpeg.readFile).toHaveBeenCalledWith('output.avi');
    });

    it('should handle files without extension', async () => {
      // File without extension - split('.').pop() returns the entire filename
      const fileNoExt = new File(['test'], 'video', { type: 'video/mp4' });
      
      await trimVideo(mockFFmpeg, fileNoExt, 0, 2);

      expect(mockFFmpeg.writeFile).toHaveBeenCalledWith(
        'input.video',
        expect.any(Uint8Array)
      );
      expect(mockFFmpeg.readFile).toHaveBeenCalledWith('output.video');
    });
  });

  describe('duration calculation', () => {
    it('should calculate duration correctly for various ranges', async () => {
      const testCases = [
        { start: 0, end: 1, expectedDuration: 1 },
        { start: 5, end: 10, expectedDuration: 5 },
        { start: 1.5, end: 3.7, expectedDuration: 2.2 },
        { start: 0, end: 0.5, expectedDuration: 0.5 },
      ];

      for (const { start, end, expectedDuration } of testCases) {
        mockFFmpeg.exec.mockClear();
        
        await trimVideo(mockFFmpeg, mockFile, start, end);

        expect(mockFFmpeg.exec).toHaveBeenCalledWith(
          expect.arrayContaining(["-t", expectedDuration.toString()])
        );
      }
    });
  });

  describe('FFmpeg command structure', () => {
    it('should use correct seek position for re-encoding', async () => {
      await trimVideo(mockFFmpeg, mockFile, 10.5, 12);

      // For short clips, -ss should come BEFORE -i for accurate seeking
      const execCall = mockFFmpeg.exec.mock.calls[0][0];
      const ssIndex = execCall.indexOf('-ss');
      const iIndex = execCall.indexOf('-i');
      
      expect(ssIndex).toBeGreaterThan(-1);
      expect(iIndex).toBeGreaterThan(-1);
      expect(ssIndex).toBeLessThan(iIndex);
    });

    it('should use correct seek position for stream copy', async () => {
      await trimVideo(mockFFmpeg, mockFile, 10, 20);

      // For long clips, -ss should come AFTER -i for stream copy
      const execCall = mockFFmpeg.exec.mock.calls[0][0];
      const ssIndex = execCall.indexOf('-ss');
      const iIndex = execCall.indexOf('-i');
      
      expect(ssIndex).toBeGreaterThan(-1);
      expect(iIndex).toBeGreaterThan(-1);
      expect(ssIndex).toBeGreaterThan(iIndex);
    });
  });
});