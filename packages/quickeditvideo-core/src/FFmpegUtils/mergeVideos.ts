import { fetchFile } from "@ffmpeg/util";

/**
 * Merge multiple videos into one
 */
export async function mergeVideos(
  ffmpeg: any,
  inputFiles: File[]
): Promise<Uint8Array> {
  const outputName = "output.mp4";
  
  // Write all input files
  const inputNames: string[] = [];
  for (let i = 0; i < inputFiles.length; i++) {
    const inputName = `input${i}.${inputFiles[i].name.split('.').pop()}`;
    inputNames.push(inputName);
    await ffmpeg.writeFile(inputName, await fetchFile(inputFiles[i]));
  }

  // Create concat file
  const concatContent = inputNames.map(name => `file '${name}'`).join('\n');
  await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatContent));

  await ffmpeg.exec([
    "-f", "concat",
    "-safe", "0",
    "-i", "concat.txt",
    "-c", "copy",
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}
