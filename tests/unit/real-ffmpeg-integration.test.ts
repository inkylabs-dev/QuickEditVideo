import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NodeFFmpeg } from '../ffmpeg-node-adapter';
import { loadTestVideo } from '../test-utils';

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

describe('Real FFmpeg Integration Test', () => {
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

  it('demonstrates real FFmpeg functionality vs mocks', async () => {
    if (!ffmpegAvailable) {
      console.log('Skipping test: FFmpeg not available in environment');
      return;
    }
    
    // Load a real test video file
    const testVideo = await loadTestVideo();
    console.log('Original video size:', testVideo.length, 'bytes');
    
    await ffmpeg.writeFile('input.mp4', testVideo);
    
    // Get video information using real FFmpeg
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-f', 'null', '-'
    ]);
    
    // Convert to a different format (real conversion)
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-c:v', 'libx264',
      '-b:v', '100k',
      '-vf', 'scale=160:120',
      '-an', // remove audio for simpler test
      'output.mp4'
    ]);
    
    const outputData = await ffmpeg.readFile('output.mp4');
    console.log('Converted video size:', outputData.length, 'bytes');
    
    // Real FFmpeg produces real output
    expect(outputData.length).toBeGreaterThan(0);
    expect(outputData.length).not.toEqual(4); // Not the mock [1,2,3,4] array
    
    // Verify it's actually a different file (converted)
    expect(outputData).not.toEqual(testVideo);
    
    // Real MP4 files should start with specific bytes
    expect(outputData[4]).toBe(0x66); // 'f' from ftyp box
    expect(outputData[5]).toBe(0x74); // 't' from ftyp box
    expect(outputData[6]).toBe(0x79); // 'y' from ftyp box
    expect(outputData[7]).toBe(0x70); // 'p' from ftyp box
  }, 30000); // 30 second timeout for real video processing

  it('performs real video trimming operation', async () => {
    if (!ffmpegAvailable) {
      console.log('Skipping test: FFmpeg not available in environment');
      return;
    }
    
    const testVideo = await loadTestVideo();
    await ffmpeg.writeFile('input.mp4', testVideo);
    
    // Trim to first 2 seconds (real operation)
    await ffmpeg.exec([
      '-i', 'input.mp4',
      '-ss', '00:00:00',
      '-t', '00:00:02',
      '-c', 'copy',
      'trimmed.mp4'
    ]);
    
    const trimmedData = await ffmpeg.readFile('trimmed.mp4');
    
    // Real trimming produces real results
    expect(trimmedData.length).toBeGreaterThan(0);
    expect(trimmedData.length).toBeLessThanOrEqual(testVideo.length);
    
    // Should still be a valid MP4 file
    expect(trimmedData[4]).toBe(0x66); // 'f' from ftyp box
    expect(trimmedData[5]).toBe(0x74); // 't' from ftyp box
  }, 20000);

  it('shows the difference from mock behavior', async () => {
    // With mocks, this would always return [1,2,3,4]
    // With real FFmpeg, we get actual file contents
    
    // This test doesn't need FFmpeg execution, just tests the basic adapter
    const testVideo = await loadTestVideo();
    
    if (!ffmpegAvailable) {
      console.log('Skipping test: FFmpeg not available in environment');
      return;
    }
    
    await ffmpeg.writeFile('test.mp4', testVideo);
    
    const readBack = await ffmpeg.readFile('test.mp4');
    
    // Real FFmpeg returns the actual file content
    expect(readBack).toEqual(testVideo);
    expect(readBack.length).toBeGreaterThan(4);
    expect(readBack).not.toEqual(new Uint8Array([1, 2, 3, 4])); // Not the mock response
  });
});