import { fetchFile } from "@ffmpeg/util";

/**
 * Extract frames from a video at specific time points
 */
export async function extractFrames(
  ffmpeg: any,
  inputFile: File,
  times: number[], // Array of times in seconds
  format: 'png' | 'jpg' = 'png'
): Promise<Array<{ time: number; data: Uint8Array; filename: string }>> {
  const inputName = "input." + inputFile.name.split('.').pop();
  const results: Array<{ time: number; data: Uint8Array; filename: string }> = [];

  await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    const outputName = `frame_${time.toFixed(2)}s.${format}`;
    
    // Extract frame at specific time
    await ffmpeg.exec([
      "-i", inputName,
      "-ss", time.toString(),
      "-vframes", "1",
      "-q:v", "2", // High quality
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    results.push({
      time,
      data: new Uint8Array(data as ArrayBuffer),
      filename: outputName
    });
  }

  return results;
}

/**
 * Extract frames from a video within a time range at specified intervals
 */
export async function extractFramesInRange(
  ffmpeg: any,
  inputFile: File,
  startTime: number,
  endTime: number,
  interval: number = 1, // Extract frame every N seconds
  format: 'png' | 'jpg' = 'png'
): Promise<Array<{ time: number; data: Uint8Array; filename: string }>> {
  const times: number[] = [];
  
  // Generate time points within the range
  for (let t = startTime; t < endTime; t += interval) {
    times.push(t);
  }
  
  // Only add endTime if it's not already included and is greater than startTime
  if (times.length === 0 || (times[times.length - 1] !== endTime && endTime > startTime)) {
    times.push(endTime);
  }

  return extractFrames(ffmpeg, inputFile, times, format);
}