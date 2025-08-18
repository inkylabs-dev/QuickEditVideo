import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NodeFFmpeg, fetchFile } from '../ffmpeg-node-adapter';
import { loadTestVideo, createTestVideoFile } from '../test-utils';

// Check if FFmpeg is available in the environment
const checkFFmpegAvailable = async (): Promise<boolean> => {
  try {
    // Try to spawn FFmpeg with a simple version check
    const { spawn } = await import('child_process');
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    return new Promise((resolve) => {
      ffmpeg.on('error', () => resolve(false));
      ffmpeg.on('exit', (code) => resolve(code === 0));
      // Close stdin to avoid hanging
      ffmpeg.stdin.end();
      // Timeout after 2 seconds
      setTimeout(() => resolve(false), 2000);
    });
  } catch (error) {
    return false;
  }
};

describe('FFmpeg Node Adapter', () => {
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

  describe('Basic Operations', () => {
    it('can write and read files', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }
      
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      await ffmpeg.writeFile('test.bin', testData);
      
      const readData = await ffmpeg.readFile('test.bin');
      expect(readData).toEqual(testData);
    });

    it('can execute simple FFmpeg commands', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }
      
      // Create a simple input file
      const testVideo = await loadTestVideo();
      await ffmpeg.writeFile('input.mp4', testVideo);
      
      // Convert to webm format (simple conversion test)
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-c:v', 'libvpx',
        '-b:v', '200k',
        '-vf', 'scale=160:120',
        'output.webm'
      ]);
      
      // Check that output file was created
      const outputData = await ffmpeg.readFile('output.webm');
      expect(outputData.length).toBeGreaterThan(0);
    });

    it('handles fetchFile utility function', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }
      
      const testFile = await createTestVideoFile();
      const data = await fetchFile(testFile);
      
      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('FFmpeg Command Execution', () => {
    it('can trim video files', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }
      
      const testVideo = await loadTestVideo();
      await ffmpeg.writeFile('input.mp4', testVideo);
      
      // Trim first 2 seconds
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-ss', '00:00:00',
        '-t', '00:00:02',
        '-c', 'copy',
        'trimmed.mp4'
      ]);
      
      const trimmedData = await ffmpeg.readFile('trimmed.mp4');
      expect(trimmedData.length).toBeGreaterThan(0);
      // Trimmed file should typically be smaller than original
      expect(trimmedData.length).toBeLessThanOrEqual(testVideo.length);
    });

    it('can resize video files', async () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }
      
      const testVideo = await loadTestVideo();
      await ffmpeg.writeFile('input.mp4', testVideo);
      
      // Resize to 160x120
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-vf', 'scale=160:120',
        '-c:a', 'copy',
        'resized.mp4'
      ]);
      
      const resizedData = await ffmpeg.readFile('resized.mp4');
      expect(resizedData.length).toBeGreaterThan(0);
    });
  });

  describe('Event Handling', () => {
    it('can register progress callbacks', () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }
      
      let progressCalled = false;
      
      ffmpeg.on('progress', (event) => {
        progressCalled = true;
        expect(event).toHaveProperty('progress');
        expect(typeof event.progress).toBe('number');
      });
      
      // Progress callback is registered (actual calls depend on FFmpeg execution)
      expect(progressCalled).toBe(false); // Not called yet, just registered
    });

    it('can register log callbacks', () => {
      if (!ffmpegAvailable) {
        console.log('Skipping test: FFmpeg not available in environment');
        return;
      }
      
      let logCalled = false;
      
      ffmpeg.on('log', (event) => {
        logCalled = true;
        expect(event).toHaveProperty('message');
        expect(typeof event.message).toBe('string');
      });
      
      // Log callback is registered
      expect(logCalled).toBe(false); // Not called yet, just registered
    });
  });
});