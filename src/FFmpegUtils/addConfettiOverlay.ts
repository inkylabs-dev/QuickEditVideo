import { fetchFile } from "@ffmpeg/util";

/**
 * Add a confetti overlay to a video during a specified time range
 */
export async function addConfettiOverlay(
  ffmpeg: any,
  videoFile: File,
  confettiVideoBlob: Blob,
  startTime: number = 0,
  endTime: number = 5
): Promise<Uint8Array> {
  const parts = videoFile.name.split('.');
  const videoExt = parts.length > 1 ? parts.pop()?.toLowerCase() || 'mp4' : 'mp4';
  
  const videoInputName = `input.${videoExt}`;
  const confettiInputName = `confetti.webm`;
  const outputName = `output.${videoExt}`;

  // Write input files to FFmpeg filesystem
  await ffmpeg.current.writeFile(videoInputName, await fetchFile(videoFile));
  await ffmpeg.current.writeFile(confettiInputName, await fetchFile(confettiVideoBlob));

  // Create overlay filter with time range
  const overlayFilter = `overlay=0:0:enable='between(t,${startTime},${endTime})'`;

  // Execute FFmpeg command to add confetti overlay
  await ffmpeg.current.exec([
    "-i", videoInputName,
    "-i", confettiInputName,
    "-filter_complex", `[1:v]${overlayFilter}[confetti];[0:v][confetti]overlay`,
    "-c:a", "copy", // Copy audio without re-encoding
    outputName
  ]);

  const data = await ffmpeg.current.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}