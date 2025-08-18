import { fetchFile } from "@ffmpeg/util";

/**
 * Change video speed with optional frame interpolation
 * @param ffmpeg - FFmpeg instance
 * @param inputFile - Input video file
 * @param speed - Speed multiplier (0.25x to 4x)
 * @param useInterpolation - Whether to use motion interpolation for slow motion (speeds < 1x)
 * @returns Promise<Uint8Array> - Processed video data
 */
export async function changeVideoSpeed(
  ffmpeg: any,
  inputFile: File,
  speed: number,
  useInterpolation: boolean = false
): Promise<Uint8Array> {
  const inputName = "input." + inputFile.name.split('.').pop();
  const outputName = "output." + inputFile.name.split('.').pop();

  await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

  // Calculate the PTS (Presentation Time Stamp) multiplier
  // For speed change: pts_multiplier = 1 / speed
  const ptsMultiplier = 1 / speed;

  let videoFilter: string;
  let audioFilter: string;

  if (useInterpolation && speed < 1) {
    // Use motion interpolation for smooth slow motion
    // The minterpolate filter creates intermediate frames
    const fps = 30; // Target FPS for interpolation
    videoFilter = `minterpolate=fps=${fps}:mi_mode=mci,setpts=${ptsMultiplier}*PTS`;
  } else {
    // Standard speed change without interpolation
    videoFilter = `setpts=${ptsMultiplier}*PTS`;
  }

  // Audio tempo filter - handles speed changes while preserving pitch
  if (speed >= 0.5 && speed <= 2.0) {
    // Single atempo filter for speeds within its range
    audioFilter = `atempo=${speed}`;
  } else if (speed < 0.5) {
    // Chain multiple atempo filters for very slow speeds
    // atempo is limited to 0.5-2.0 range, so we chain them
    const tempoSteps = Math.ceil(Math.log(speed) / Math.log(0.5));
    const tempoValue = Math.pow(speed, 1 / tempoSteps);
    audioFilter = Array(tempoSteps).fill(`atempo=${tempoValue}`).join(',');
  } else {
    // Chain multiple atempo filters for very fast speeds
    const tempoSteps = Math.ceil(Math.log(speed) / Math.log(2.0));
    const tempoValue = Math.pow(speed, 1 / tempoSteps);
    audioFilter = Array(tempoSteps).fill(`atempo=${tempoValue}`).join(',');
  }

  // Execute FFmpeg command with video and audio filters
  await ffmpeg.exec([
    "-i", inputName,
    "-filter_complex", `[0:v]${videoFilter}[v];[0:a]${audioFilter}[a]`,
    "-map", "[v]",
    "-map", "[a]",
    "-c:v", "libx264",
    "-c:a", "aac",
    "-preset", "medium",
    outputName
  ]);

  const data = await ffmpeg.readFile(outputName);
  return new Uint8Array(data as ArrayBuffer);
}