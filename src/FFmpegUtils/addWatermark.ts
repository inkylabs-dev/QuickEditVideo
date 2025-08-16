import { fetchFile } from "@ffmpeg/util";

/**
 * Add a watermark (logo/image) to a video at specified position and size
 */
export async function addWatermark(
  ffmpeg: any,
  videoFile: File,
  imageFile: File,
  x: number = 10,
  y: number = 10,
  width: number = 100,
  height: number = 100
): Promise<Uint8Array> {
  const videoExt = videoFile.name.split('.').pop()?.toLowerCase() || 'mp4';
  const imageExt = imageFile.name.split('.').pop()?.toLowerCase() || 'png';
  
  const videoInputName = `input.${videoExt}`;
  const imageInputName = `watermark.${imageExt}`;
  const outputName = `output.${videoExt}`;

  // Write input files to FFmpeg filesystem
  await ffmpeg.current.writeFile(videoInputName, await fetchFile(videoFile));
  await ffmpeg.current.writeFile(imageInputName, await fetchFile(imageFile));

  // Create overlay filter with position and size
  const overlayFilter = `overlay=${x}:${y}`;
  const scaleFilter = `scale=${width}:${height}`;

  // Execute FFmpeg command to add watermark
  await ffmpeg.current.exec([
    "-i", videoInputName,
    "-i", imageInputName,
    "-filter_complex", `[1:v]${scaleFilter}[scaled];[0:v][scaled]${overlayFilter}`,
    "-c:a", "copy", // Copy audio without re-encoding
    outputName
  ]);

  const data = await ffmpeg.current.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}