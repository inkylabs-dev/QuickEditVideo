import { fetchFile } from "@ffmpeg/util";

/**
 * Crop a video to specific dimensions and position
 */
export async function cropVideo(
  ffmpeg: any,
  inputFile: File,
  width: number,
  height: number,
  x: number = 0,
  y: number = 0
): Promise<Uint8Array> {
  const inputName = "input." + inputFile.name.split('.').pop();
  const outputName = "output." + inputFile.name.split('.').pop();

  await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

  await ffmpeg.exec([
    "-i", inputName,
    "-vf", `crop=${width}:${height}:${x}:${y}`,
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}
