import { fetchFile } from "@ffmpeg/util";

export type FlipDirection = 'horizontal' | 'vertical';

/**
 * Flip a video horizontally or vertically
 */
export async function flipVideo(
  ffmpeg: any,
  inputFile: File,
  direction: FlipDirection
): Promise<Uint8Array> {
  const inputExt = inputFile.name.split('.').pop();
  const inputName = `input.${inputExt}`;
  const outputName = `output.${inputExt}`;

  await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

  // Use FFmpeg flip filters
  const flipFilter = direction === 'horizontal' ? 'hflip' : 'vflip';
  
  await ffmpeg.exec([
    '-i', inputName,
    '-vf', flipFilter,
    '-c:a', 'copy', // Copy audio without re-encoding
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}