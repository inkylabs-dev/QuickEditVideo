import { fetchFile } from "@ffmpeg/util";

export interface ConversionOptions {
  size?: 'original' | '600xauto' | '540xauto' | '500xauto' | '480xauto' | '320xauto' | 'autox480' | 'autox320';
  fps?: number;
  startTime?: number; // in seconds
  endTime?: number; // in seconds
}

/**
 * Convert a file to a different format with optimized settings for each format
 * @param ffmpeg FFmpeg instance
 * @param inputFile Input file (File object or string path)
 * @param outputFormat Target format (mp4, webm, avi, mov, mkv, gif, mp3)
 * @param customOptions Custom FFmpeg options (optional)
 * @param conversionOptions Additional conversion options for size, fps, and frame limits
 * @returns Promise<Uint8Array> Converted file data
 */
export async function convertVideo(
  ffmpeg: any,
  inputFile: File | string,
  outputFormat: string,
  customOptions: string[] = [],
  conversionOptions: ConversionOptions = {}
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

  // Helper function to build video filter string
  const buildVideoFilter = (outputFormat: string): string => {
    const filters: string[] = [];
    
    // FPS setting
    const fps = conversionOptions.fps || (outputFormat === 'gif' ? 10 : 30);
    filters.push(`fps=${Math.max(5, Math.min(30, fps))}`);
    
    // Scale setting
    let scaleFilter = '';
    if (conversionOptions.size && conversionOptions.size !== 'original') {
      switch (conversionOptions.size) {
        case '600xauto':
          scaleFilter = 'scale=600:-1:flags=lanczos';
          break;
        case '540xauto':
          scaleFilter = 'scale=540:-1:flags=lanczos';
          break;
        case '500xauto':
          scaleFilter = 'scale=500:-1:flags=lanczos';
          break;
        case '480xauto':
          scaleFilter = 'scale=480:-1:flags=lanczos';
          break;
        case '320xauto':
          scaleFilter = 'scale=320:-1:flags=lanczos';
          break;
        case 'autox480':
          scaleFilter = 'scale=-1:480:flags=lanczos';
          break;
        case 'autox320':
          scaleFilter = 'scale=-1:320:flags=lanczos';
          break;
      }
    } else {
      // Original size but cap at 800px for GIF to prevent huge files while maintaining aspect ratio
      if (outputFormat === 'gif') {
        scaleFilter = "scale='min(800,iw)':-1:flags=lanczos";
      }
    }
    
    if (scaleFilter) {
      filters.push(scaleFilter);
    }
    
    return filters.join(',');
  };

  // Default optimized settings for different formats
  let defaultOptions: string[];
  
  if (customOptions.length > 0) {
    // Use custom options if provided
    defaultOptions = customOptions;
  } else {
    // Use optimized settings for each format
    switch (outputFormat.toLowerCase()) {
      case 'gif':
        const gifFilters = buildVideoFilter('gif');
        defaultOptions = [
          '-vf', gifFilters,
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

  // Build execution arguments
  const args = ["-i", inputName];
  
  // Add time-based trimming if specified
  if (conversionOptions.startTime !== undefined) {
    args.push('-ss', conversionOptions.startTime.toString());
  }
  
  if (conversionOptions.endTime !== undefined && conversionOptions.startTime !== undefined) {
    const duration = conversionOptions.endTime - conversionOptions.startTime;
    args.push('-t', duration.toString());
  } else if (conversionOptions.endTime !== undefined) {
    args.push('-to', conversionOptions.endTime.toString());
  }
  
  // Add the rest of the options and output
  args.push(...defaultOptions, outputName);
  
  // Execute conversion
  await ffmpeg.exec(args);

  // Read output file
  const data = await ffmpeg.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}
