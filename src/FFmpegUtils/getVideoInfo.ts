/**
 * Video metadata extraction utility using ffprobe via FFmpeg.wasm
 * 
 * Extracts comprehensive video information including format, duration,
 * codec details, resolution, bitrate, and other metadata.
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export interface VideoStream {
  index: number;
  codec_name: string;
  codec_long_name: string;
  codec_type: string;
  width?: number;
  height?: number;
  bit_rate?: string;
  avg_frame_rate?: string;
  duration?: string;
  pix_fmt?: string;
}

export interface AudioStream {
  index: number;
  codec_name: string;
  codec_long_name: string;
  codec_type: string;
  sample_rate?: string;
  channels?: number;
  channel_layout?: string;
  bit_rate?: string;
  duration?: string;
}

export interface VideoFormat {
  filename: string;
  nb_streams: number;
  nb_programs: number;
  format_name: string;
  format_long_name: string;
  start_time?: string;
  duration?: string;
  size?: string;
  bit_rate?: string;
  probe_score?: number;
}

export interface VideoMetadata {
  format: VideoFormat;
  videoStreams: VideoStream[];
  audioStreams: AudioStream[];
  raw: any; // Raw ffprobe output for advanced users
}

/**
 * Extract video metadata using ffprobe command via FFmpeg.wasm
 * 
 * @param ffmpeg - Initialized FFmpeg instance
 * @param file - Video file to analyze
 * @param fileName - Input filename for FFmpeg processing
 * @returns Promise resolving to video metadata object
 */
export async function getVideoInfo(
  ffmpeg: FFmpeg,
  file: File,
  fileName: string = 'input_video'
): Promise<VideoMetadata> {
  try {
    // Detect file extension and use original if possible
    const originalExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const inputFileName = `${fileName}.${originalExtension}`;

    // Write input file to FFmpeg virtual filesystem
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    // Execute ffprobe command to extract metadata as JSON
    // Use ffprobe-specific exec method if available, otherwise use regular exec
    // -v quiet: suppress verbose output
    // -print_format json: output in JSON format
    // -show_format: show format/container information
    // -show_streams: show stream information
    const ffprobeArgs = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      inputFileName
    ];

    // Use ffprobe if available, otherwise try with regular exec
    if (typeof ffmpeg.ffprobe === 'function') {
      await ffmpeg.ffprobe(...ffprobeArgs);
    } else {
      await ffmpeg.exec(ffprobeArgs);
    }

    // Try to read the JSON output from various possible locations
    let outputData: Uint8Array | string;
    try {
      // Try reading from stdout or typical ffprobe output locations
      outputData = await ffmpeg.readFile('ffprobe.json');
    } catch (e) {
      // If ffprobe.json doesn't exist, try other common output patterns
      try {
        outputData = await ffmpeg.readFile('output.json');
      } catch (e2) {
        throw new Error('Could not find ffprobe output. Ensure FFmpeg.wasm supports metadata extraction.');
      }
    }
    let jsonText: string;
    
    if (outputData instanceof Uint8Array) {
      jsonText = new TextDecoder().decode(outputData);
    } else {
      jsonText = outputData as string;
    }

    // Parse JSON output
    const probeResult = JSON.parse(jsonText);

    // Extract and organize the metadata
    const videoStreams: VideoStream[] = [];
    const audioStreams: AudioStream[] = [];

    if (probeResult.streams) {
      for (const stream of probeResult.streams) {
        if (stream.codec_type === 'video') {
          videoStreams.push({
            index: stream.index,
            codec_name: stream.codec_name || 'unknown',
            codec_long_name: stream.codec_long_name || 'Unknown',
            codec_type: stream.codec_type,
            width: stream.width,
            height: stream.height,
            bit_rate: stream.bit_rate,
            avg_frame_rate: stream.avg_frame_rate,
            duration: stream.duration,
            pix_fmt: stream.pix_fmt
          });
        } else if (stream.codec_type === 'audio') {
          audioStreams.push({
            index: stream.index,
            codec_name: stream.codec_name || 'unknown',
            codec_long_name: stream.codec_long_name || 'Unknown',
            codec_type: stream.codec_type,
            sample_rate: stream.sample_rate,
            channels: stream.channels,
            channel_layout: stream.channel_layout,
            bit_rate: stream.bit_rate,
            duration: stream.duration
          });
        }
      }
    }

    // Extract format information
    const format: VideoFormat = {
      filename: probeResult.format?.filename || file.name,
      nb_streams: probeResult.format?.nb_streams || 0,
      nb_programs: probeResult.format?.nb_programs || 0,
      format_name: probeResult.format?.format_name || 'unknown',
      format_long_name: probeResult.format?.format_long_name || 'Unknown format',
      start_time: probeResult.format?.start_time,
      duration: probeResult.format?.duration,
      size: probeResult.format?.size,
      bit_rate: probeResult.format?.bit_rate,
      probe_score: probeResult.format?.probe_score
    };

    // Clean up temporary files
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile('ffprobe.json');
    } catch (error) {
      // Ignore cleanup errors - files might not exist
      console.warn('Cleanup warning:', error);
    }

    return {
      format,
      videoStreams,
      audioStreams,
      raw: probeResult
    };

  } catch (error) {
    console.error('Error extracting video metadata:', error);
    throw new Error('Failed to extract video metadata. Please ensure the file is a valid video.');
  }
}

/**
 * Format duration from seconds to human-readable format
 * 
 * @param seconds - Duration in seconds (as string or number)
 * @returns Formatted duration string (e.g., "2:45" or "1:23:45")
 */
export function formatDuration(seconds: string | number | undefined): string {
  if (!seconds) return 'Unknown';
  
  const totalSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  if (isNaN(totalSeconds)) return 'Unknown';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Format file size from bytes to human-readable format
 * 
 * @param bytes - File size in bytes (as string or number)
 * @returns Formatted size string (e.g., "15.2 MB")
 */
export function formatFileSize(bytes: string | number | undefined): string {
  if (!bytes) return 'Unknown';
  
  const totalBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (isNaN(totalBytes)) return 'Unknown';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = totalBytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Format bitrate from bps to human-readable format
 * 
 * @param bitrate - Bitrate in bits per second (as string or number)
 * @returns Formatted bitrate string (e.g., "1.5 Mbps")
 */
export function formatBitrate(bitrate: string | number | undefined): string {
  if (!bitrate) return 'Unknown';
  
  const bps = typeof bitrate === 'string' ? parseInt(bitrate) : bitrate;
  if (isNaN(bps)) return 'Unknown';
  
  if (bps >= 1000000) {
    return `${(bps / 1000000).toFixed(1)} Mbps`;
  } else if (bps >= 1000) {
    return `${(bps / 1000).toFixed(0)} kbps`;
  } else {
    return `${bps} bps`;
  }
}