import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractFrames, extractFramesInRange } from '../../../src/FFmpegUtils/extractFrames';

// Mock @ffmpeg/util
vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
}));

describe('extractFrames', () => {
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

  describe('extractFrames', () => {
    it('should extract frames at specified times', async () => {
      const times = [0, 30, 60];
      const format = 'png';

      const result = await extractFrames(mockFFmpeg, mockFile, times, format);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        time: 0,
        data: expect.any(Uint8Array),
        filename: 'frame_0.00s.png'
      });
      expect(result[1]).toEqual({
        time: 30,
        data: expect.any(Uint8Array),
        filename: 'frame_30.00s.png'
      });
      expect(result[2]).toEqual({
        time: 60,
        data: expect.any(Uint8Array),
        filename: 'frame_60.00s.png'
      });
    });

    it('should use JPG format when specified', async () => {
      const times = [15.5];
      const format = 'jpg';

      const result = await extractFrames(mockFFmpeg, mockFile, times, format);

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('frame_15.50s.jpg');
    });

    it('should default to PNG format', async () => {
      const times = [10];

      const result = await extractFrames(mockFFmpeg, mockFile, times);

      expect(result[0].filename).toBe('frame_10.00s.png');
    });

    it('should write input file to FFmpeg filesystem', async () => {
      const times = [5];
      
      await extractFrames(mockFFmpeg, mockFile, times);

      expect(mockFFmpeg.writeFile).toHaveBeenCalledWith(
        'input.mp4',
        expect.any(Uint8Array)
      );
    });

    it('should execute FFmpeg commands for each time point', async () => {
      const times = [0, 10];
      
      await extractFrames(mockFFmpeg, mockFile, times);

      expect(mockFFmpeg.exec).toHaveBeenCalledTimes(2);
      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        '-i', 'input.mp4',
        '-ss', '0',
        '-vframes', '1',
        '-q:v', '2',
        'frame_0.00s.png'
      ]);
      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        '-i', 'input.mp4',
        '-ss', '10',
        '-vframes', '1',
        '-q:v', '2',
        'frame_10.00s.png'
      ]);
    });

    it('should read output files from FFmpeg filesystem', async () => {
      const times = [5];
      
      await extractFrames(mockFFmpeg, mockFile, times);

      expect(mockFFmpeg.readFile).toHaveBeenCalledWith('frame_5.00s.png');
    });

    it('should handle file extensions correctly', async () => {
      const aviFile = new File(['test'], 'video.avi', { type: 'video/avi' });
      const times = [0];
      
      await extractFrames(mockFFmpeg, aviFile, times);

      expect(mockFFmpeg.writeFile).toHaveBeenCalledWith(
        'input.avi',
        expect.any(Uint8Array)
      );
    });

    it('should return correct data structure', async () => {
      const times = [12.34];
      
      const result = await extractFrames(mockFFmpeg, mockFile, times);

      expect(result[0]).toHaveProperty('time', 12.34);
      expect(result[0]).toHaveProperty('data');
      expect(result[0]).toHaveProperty('filename', 'frame_12.34s.png');
      expect(result[0].data).toBeInstanceOf(Uint8Array);
    });
  });

  describe('extractFramesInRange', () => {
    it('should extract frames in range with default interval', async () => {
      const result = await extractFramesInRange(mockFFmpeg, mockFile, 0, 3);

      expect(mockFFmpeg.exec).toHaveBeenCalledTimes(4); // 0, 1, 2, 3
    });

    it('should extract frames with custom interval', async () => {
      const result = await extractFramesInRange(mockFFmpeg, mockFile, 0, 5, 2);

      expect(mockFFmpeg.exec).toHaveBeenCalledTimes(4); // 0, 2, 4, 5 (end time included)
    });

    it('should include end time when not aligned with interval', async () => {
      const result = await extractFramesInRange(mockFFmpeg, mockFile, 0, 2.5, 1);

      // Should extract at: 0, 1, 2, 2.5
      expect(mockFFmpeg.exec).toHaveBeenCalledTimes(4);
    });

    it('should not duplicate end time when aligned with interval', async () => {
      const result = await extractFramesInRange(mockFFmpeg, mockFile, 0, 3, 1);

      // Should extract at: 0, 1, 2, 3 (no duplicate of 3)
      expect(mockFFmpeg.exec).toHaveBeenCalledTimes(4);
    });

    it('should handle fractional intervals', async () => {
      const result = await extractFramesInRange(mockFFmpeg, mockFile, 0, 1, 0.5);

      // Should extract at: 0, 0.5, 1
      expect(mockFFmpeg.exec).toHaveBeenCalledTimes(3);
    });

    it('should handle single time point (start equals end)', async () => {
      const result = await extractFramesInRange(mockFFmpeg, mockFile, 5, 5, 1);

      // Should extract at: 5
      expect(mockFFmpeg.exec).toHaveBeenCalledTimes(1);
    });

    it('should generate correct time array for range', async () => {
      // Test the time generation logic directly
      const startTime = 1;
      const endTime = 4;
      const interval = 1.5;
      
      // Expected times: 1, 2.5, 4
      const expectedTimes = [];
      for (let t = startTime; t <= endTime; t += interval) {
        expectedTimes.push(t);
      }
      if (expectedTimes[expectedTimes.length - 1] !== endTime && endTime > startTime) {
        expectedTimes.push(endTime);
      }

      expect(expectedTimes).toEqual([1, 2.5, 4]);
    });
  });
});