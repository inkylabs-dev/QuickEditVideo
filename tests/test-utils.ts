/**
 * Test utilities for working with real video files in tests
 */
import { promises as fs } from 'fs';
import { join } from 'path';

export async function loadTestVideo(filename: string = 'test-video.mp4'): Promise<Uint8Array> {
  const filePath = join(__dirname, 'fixtures', filename);
  const data = await fs.readFile(filePath);
  return new Uint8Array(data);
}

export function createTestVideoFile(filename: string = 'test-video.mp4', type: string = 'video/mp4'): Promise<File> {
  return loadTestVideo(filename).then(data => {
    const blob = new Blob([data.slice()], { type });
    return new File([blob], filename, { type });
  });
}

export async function createMockVideoFile(name: string = 'test.mp4', type: string = 'video/mp4'): Promise<File> {
  // For tests that don't need real video data, create a small mock file
  const mockData = new Uint8Array([
    // Minimal MP4 header-like data
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp box
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00, // isom brand
    0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32, // compatible brands
    0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31, // more brands
  ]);
  
  const blob = new Blob([mockData], { type });
  return new File([blob], name, { type });
}