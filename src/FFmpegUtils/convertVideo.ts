import { fetchFile } from "@ffmpeg/util";

/**
 * Convert a file to a different format with optimized settings for each format
 * @param ffmpeg FFmpeg instance
 * @param inputFile Input file (File object or string path)
 * @param outputFormat Target format (mp4, webm, avi, mov, mkv, gif, mp3)
 * @param customOptions Custom FFmpeg options (optional)
 * @returns Promise<Uint8Array> Converted file data
 */
export async function convertVideo(
  ffmpeg: any,
  inputFile: File | string,
  outputFormat: string,
  customOptions: string[] = []
): Promise<Uint8Array> {
  const inputExt = inputFile instanceof File ? 
    inputFile.name.split('.').pop() : inputFile.split('.').pop();
  const inputName = `input.${inputExt}`;
  const outputName = `output.${outputFormat}`;

  // Write input file
  if (inputFile instanceof File) {
    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));
  } else {
    await ffmpeg.writeFile(inputName, await fetchFile(inputFile));
  }

  // Default optimized settings for different formats
  let defaultOptions: string[];
  
  if (customOptions.length > 0) {
    // Use custom options if provided
    defaultOptions = customOptions;
  } else {
    // Use optimized settings for each format
    switch (outputFormat.toLowerCase()) {
      case 'gif':
        defaultOptions = [
          '-vf', 'fps=10,scale=320:-1:flags=lanczos',
          '-c:v', 'gif'
        ];
        break;
      case 'mp3':
        defaultOptions = [
          '-vn',
          '-acodec', 'libmp3lame',
          '-b:a', '192k'
        ];
        break;
      case 'webm':
        defaultOptions = [
          '-c:v', 'libvpx-vp9',
          '-c:a', 'libopus'
        ];
        break;
      case 'avi':
      case 'mov':
      case 'mkv':
      case 'mp4':
      default:
        defaultOptions = [
          '-c:v', 'libx264',
          '-c:a', 'aac'
        ];
        break;
    }
  }

  // Execute conversion
  const args = ["-i", inputName, ...defaultOptions, outputName];
  await ffmpeg.exec(args);

  // Read output file
  const data = await ffmpeg.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}
