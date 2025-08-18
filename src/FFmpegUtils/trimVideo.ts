import { fetchFile } from "@ffmpeg/util";

/**
 * Trim a video between start and end times
 */
export async function trimVideo(
  ffmpeg: any,
  inputFile: File,
  startTime: number,
  endTime: number
): Promise<Uint8Array> {
  const inputName = "input." + inputFile.name.split('.').pop();
  const outputName = "output." + inputFile.name.split('.').pop();

  await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

  const duration = endTime - startTime;
  
  // Use re-encoding for short clips (<4s) to ensure frame accuracy
  // Use stream copy for longer clips for better performance
  const shouldReencode = duration < 4;

  if (shouldReencode) {
    await ffmpeg.exec([
      "-ss", startTime.toString(),
      "-i", inputName,
      "-t", duration.toString(),
      "-avoid_negative_ts", "make_zero",
      "-c:v", "libx264",
      "-preset", "ultrafast",
      "-c:a", "aac",
      outputName
    ]);
  } else {
    await ffmpeg.exec([
      "-i", inputName,
      "-ss", startTime.toString(),
      "-t", duration.toString(),
      "-c", "copy",
      outputName
    ]);
  }

  const data = await ffmpeg.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}
