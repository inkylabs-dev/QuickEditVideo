import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addConfettiOverlay } from '../../../src/FFmpegUtils/addConfettiOverlay';

// Mock @ffmpeg/util
vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
}));

describe('addConfettiOverlay', () => {
  let mockFFmpeg: any;
  let mockVideoFile: File;
  let mockConfettiBlob: Blob;

  beforeEach(() => {
    mockFFmpeg = {
      current: {
        writeFile: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
        exec: vi.fn().mockResolvedValue(undefined),
      }
    };

    mockVideoFile = new File(['test video content'], 'test.mp4', { type: 'video/mp4' });
    mockConfettiBlob = new Blob(['confetti video content'], { type: 'video/webm' });
  });

  describe('Basic Functionality', () => {
    it('should add confetti overlay with default parameters', async () => {
      const result = await addConfettiOverlay(mockFFmpeg, mockVideoFile, mockConfettiBlob);

      expect(mockFFmpeg.current.writeFile).toHaveBeenCalledWith('input.mp4', expect.any(Uint8Array));
      expect(mockFFmpeg.current.writeFile).toHaveBeenCalledWith('confetti.webm', expect.any(Uint8Array));
      
      expect(mockFFmpeg.current.exec).toHaveBeenCalledWith([
        "-i", "input.mp4",
        "-i", "confetti.webm",
        "-filter_complex", "[1:v]overlay=0:0:enable='between(t,0,5)'[confetti];[0:v][confetti]overlay",
        "-c:a", "copy",
        "output.mp4"
      ]);

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should add confetti overlay with custom timing', async () => {
      const result = await addConfettiOverlay(mockFFmpeg, mockVideoFile, mockConfettiBlob, 2, 8);

      expect(mockFFmpeg.current.exec).toHaveBeenCalledWith([
        "-i", "input.mp4",
        "-i", "confetti.webm",
        "-filter_complex", "[1:v]overlay=0:0:enable='between(t,2,8)'[confetti];[0:v][confetti]overlay",
        "-c:a", "copy",
        "output.mp4"
      ]);

      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('should handle different video file extensions', async () => {
      const movFile = new File(['test video'], 'test.mov', { type: 'video/quicktime' });
      
      await addConfettiOverlay(mockFFmpeg, movFile, mockConfettiBlob, 1, 3);

      expect(mockFFmpeg.current.writeFile).toHaveBeenCalledWith('input.mov', expect.any(Uint8Array));
      expect(mockFFmpeg.current.exec).toHaveBeenCalledWith([
        "-i", "input.mov",
        "-i", "confetti.webm",
        "-filter_complex", "[1:v]overlay=0:0:enable='between(t,1,3)'[confetti];[0:v][confetti]overlay",
        "-c:a", "copy",
        "output.mov"
      ]);
    });
  });

  describe('File Handling', () => {
    it('should preserve video file extension in output', async () => {
      const aviFile = new File(['test video'], 'test.avi', { type: 'video/x-msvideo' });
      
      await addConfettiOverlay(mockFFmpeg, aviFile, mockConfettiBlob);

      expect(mockFFmpeg.current.writeFile).toHaveBeenCalledWith('input.avi', expect.any(Uint8Array));
      expect(mockFFmpeg.current.exec).toHaveBeenCalledWith(
        expect.arrayContaining(["output.avi"])
      );
    });

    it('should default to mp4 extension when no extension found', async () => {
      const noExtFile = new File(['test video'], 'test', { type: 'video/mp4' });
      
      await addConfettiOverlay(mockFFmpeg, noExtFile, mockConfettiBlob);

      expect(mockFFmpeg.current.writeFile).toHaveBeenCalledWith('input.mp4', expect.any(Uint8Array));
      expect(mockFFmpeg.current.exec).toHaveBeenCalledWith(
        expect.arrayContaining(["output.mp4"])
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle FFmpeg execution errors', async () => {
      mockFFmpeg.current.exec.mockRejectedValue(new Error('FFmpeg error'));

      await expect(addConfettiOverlay(mockFFmpeg, mockVideoFile, mockConfettiBlob))
        .rejects.toThrow('FFmpeg error');
    });

    it('should handle file write errors', async () => {
      mockFFmpeg.current.writeFile.mockRejectedValue(new Error('Write error'));

      await expect(addConfettiOverlay(mockFFmpeg, mockVideoFile, mockConfettiBlob))
        .rejects.toThrow('Write error');
    });

    it('should handle file read errors', async () => {
      mockFFmpeg.current.readFile.mockRejectedValue(new Error('Read error'));

      await expect(addConfettiOverlay(mockFFmpeg, mockVideoFile, mockConfettiBlob))
        .rejects.toThrow('Read error');
    });
  });

  describe('Parameter Validation', () => {
    it('should work with zero start time', async () => {
      await addConfettiOverlay(mockFFmpeg, mockVideoFile, mockConfettiBlob, 0, 5);

      expect(mockFFmpeg.current.exec).toHaveBeenCalledWith(
        expect.arrayContaining(["-filter_complex", "[1:v]overlay=0:0:enable='between(t,0,5)'[confetti];[0:v][confetti]overlay"])
      );
    });

    it('should work with decimal timing values', async () => {
      await addConfettiOverlay(mockFFmpeg, mockVideoFile, mockConfettiBlob, 1.5, 3.7);

      expect(mockFFmpeg.current.exec).toHaveBeenCalledWith(
        expect.arrayContaining(["-filter_complex", "[1:v]overlay=0:0:enable='between(t,1.5,3.7)'[confetti];[0:v][confetti]overlay"])
      );
    });

    it('should handle same start and end time', async () => {
      await addConfettiOverlay(mockFFmpeg, mockVideoFile, mockConfettiBlob, 2, 2);

      expect(mockFFmpeg.current.exec).toHaveBeenCalledWith(
        expect.arrayContaining(["-filter_complex", "[1:v]overlay=0:0:enable='between(t,2,2)'[confetti];[0:v][confetti]overlay"])
      );
    });
  });

  describe('Output Quality', () => {
    it('should copy audio without re-encoding', async () => {
      await addConfettiOverlay(mockFFmpeg, mockVideoFile, mockConfettiBlob);

      expect(mockFFmpeg.current.exec).toHaveBeenCalledWith(
        expect.arrayContaining(["-c:a", "copy"])
      );
    });

    it('should use overlay filter for proper blending', async () => {
      await addConfettiOverlay(mockFFmpeg, mockVideoFile, mockConfettiBlob);

      expect(mockFFmpeg.current.exec).toHaveBeenCalledWith(
        expect.arrayContaining(["-filter_complex", expect.stringContaining("overlay")])
      );
    });
  });
});