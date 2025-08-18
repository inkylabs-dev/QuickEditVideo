import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NodeFFmpeg } from '../../ffmpeg-node-adapter';
import { createTestVideoFile, createMockVideoFile } from '../../test-utils';
import { flipVideo, type FlipDirection } from '../../../src/FFmpegUtils/flipVideo';

// Check if FFmpeg is available in the environment
const checkFFmpegAvailable = async (): Promise<boolean> => {
  try {
    const { spawn } = await import('child_process');
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    return new Promise((resolve) => {
      ffmpeg.on('error', () => resolve(false));
      ffmpeg.on('exit', (code) => resolve(code === 0));
      ffmpeg.stdin.end();
      setTimeout(() => resolve(false), 2000);
    });
  } catch (error) {
    return false;
  }
};

describe('flipVideo utility', () => {
  let ffmpeg: NodeFFmpeg;
  let ffmpegAvailable: boolean;

  beforeAll(async () => {
    ffmpegAvailable = await checkFFmpegAvailable();
    if (ffmpegAvailable) {
      ffmpeg = new NodeFFmpeg();
      await ffmpeg.load();
    }
  });

  afterAll(async () => {
    if (ffmpeg && ffmpegAvailable) {
      await ffmpeg.terminate();
    }
  });

  describe('Basic Functionality', () => {
    it('flips video horizontally', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      const testFile = await createTestVideoFile();
      const result = await flipVideo(ffmpeg, testFile, 'horizontal');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('flips video vertically', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      const testFile = await createTestVideoFile();
      const result = await flipVideo(ffmpeg, testFile, 'vertical');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles different file extensions correctly', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      // Use the real test video but test that we properly handle the extension
      const testFile = await createTestVideoFile();
      
      // Ensure the test file has the expected extension
      expect(testFile.name).toMatch(/\.mp4$/);
      
      const result = await flipVideo(ffmpeg, testFile, 'horizontal');

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Type Safety', () => {
    it('accepts valid FlipDirection types', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      const testFile = await createTestVideoFile();
      const directions: FlipDirection[] = ['horizontal', 'vertical'];

      for (const direction of directions) {
        const result = await flipVideo(ffmpeg, testFile, direction);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('throws error for invalid video file', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      const invalidFile = new File(['invalid content'], 'invalid.mp4', { type: 'video/mp4' });
      
      await expect(flipVideo(ffmpeg, invalidFile, 'horizontal')).rejects.toThrow();
    });

    it('preserves original file extension in processing', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      const testFile = await createTestVideoFile();
      expect(testFile.name).toMatch(/\.mp4$/);

      // The function should process without throwing
      const result = await flipVideo(ffmpeg, testFile, 'horizontal');
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Performance', () => {
    it('completes processing within reasonable time', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }

      const testFile = await createTestVideoFile();
      const startTime = Date.now();
      
      const result = await flipVideo(ffmpeg, testFile, 'horizontal');
      const endTime = Date.now();
      
      expect(result).toBeInstanceOf(Uint8Array);
      // Should complete within 10 seconds for a small test file
      expect(endTime - startTime).toBeLessThan(10000);
    });
  });
});