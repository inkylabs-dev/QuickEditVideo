/**
 * Node.js FFmpeg adapter that mimics @ffmpeg/ffmpeg interface for testing
 * This uses the system FFmpeg binary instead of WASM for more realistic testing
 */
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

export class NodeFFmpeg {
  private files: Map<string, Uint8Array> = new Map();
  private tempDir: string;
  private progressCallback?: (progress: { progress: number }) => void;
  private logCallback?: (log: { message: string }) => void;

  constructor() {
    this.tempDir = join(tmpdir(), `ffmpeg-test-${randomUUID()}`);
  }

  async load(): Promise<void> {
    // Create temp directory for file operations
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  async writeFile(name: string, data: Uint8Array): Promise<void> {
    this.files.set(name, data);
    const filePath = join(this.tempDir, name);
    await fs.writeFile(filePath, data);
  }

  async readFile(name: string): Promise<Uint8Array> {
    const filePath = join(this.tempDir, name);
    try {
      const data = await fs.readFile(filePath);
      return new Uint8Array(data);
    } catch (error) {
      throw new Error(`File not found: ${name}`);
    }
  }

  async exec(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Add working directory to args to use our temp directory
      const ffmpegArgs = ['-y', ...args]; // -y to overwrite output files
      
      const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
        cwd: this.tempDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderr = '';
      let stdout = '';

      ffmpeg.stdout.on('data', (data) => {
        stdout += data.toString();
        if (this.logCallback) {
          this.logCallback({ message: data.toString() });
        }
      });

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
        if (this.logCallback) {
          this.logCallback({ message: data.toString() });
        }

        // Parse progress from FFmpeg stderr if possible
        const progressMatch = stderr.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
        if (progressMatch && this.progressCallback) {
          // This is a simplified progress calculation
          // In real scenarios, you'd need duration to calculate percentage
          this.progressCallback({ progress: 0.5 }); // Dummy progress
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}: ${stderr}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`Failed to start FFmpeg: ${error.message}`));
      });
    });
  }

  on(event: string, callback: Function): void {
    if (event === 'progress') {
      this.progressCallback = callback as (progress: { progress: number }) => void;
    } else if (event === 'log') {
      this.logCallback = callback as (log: { message: string }) => void;
    }
  }

  off(event: string, callback?: Function): void {
    if (event === 'progress') {
      this.progressCallback = undefined;
    } else if (event === 'log') {
      this.logCallback = undefined;
    }
  }

  async terminate(): Promise<void> {
    // Clean up temp directory
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Utility function to create a File-like object from Uint8Array for testing
export function createTestFile(data: Uint8Array, name: string, type: string = 'video/mp4'): File {
  const blob = new Blob([data], { type });
  return new File([blob], name, { type });
}

// Helper to convert File to Uint8Array (mimics fetchFile from @ffmpeg/util)
export async function fetchFile(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}