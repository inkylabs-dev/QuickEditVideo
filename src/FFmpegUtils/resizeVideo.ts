import { fetchFile } from "@ffmpeg/util";

/**
 * Resize a video to specific dimensions
 */
export async function resizeVideo(
  ffmpeg: any,
  inputFile: File,
  width: number,
  height: number
): Promise<Uint8Array> {
  const inputName = "input." + inputFile.name.split('.').pop();
  const outputName = "output." + inputFile.name.split('.').pop();

  await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

  await ffmpeg.exec([
    "-i", inputName,
    "-vf", `scale=${width}:${height}`,
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}
