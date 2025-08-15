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
  await ffmpeg.exec([
    "-i", inputName,
    "-ss", startTime.toString(),
    "-t", duration.toString(),
    "-c", "copy",
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}
