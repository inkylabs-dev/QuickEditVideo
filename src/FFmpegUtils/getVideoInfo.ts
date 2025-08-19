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

    // Try to use ffprobe if available, otherwise fall back to log parsing
    // Note: ffprobe method will be available in @ffmpeg/ffmpeg version 0.12.14+
    // Current version (0.12.10) doesn't have this feature yet
    let probeResult: any;
    
    // First, try to use direct ffprobe access if available
    const ffmpegAny = ffmpeg as any;
    if (typeof ffmpegAny.ffprobe === 'function') {
      try {
        console.log('Using direct ffprobe method');
        // Try using ffprobe directly - this should return JSON output
        const output = await ffmpegAny.ffprobe(
          '-v', 'quiet',
          '-print_format', 'json', 
          '-show_format',
          '-show_streams',
          inputFileName
        );
        
        if (typeof output === 'string') {
          probeResult = JSON.parse(output);
        } else {
          throw new Error('ffprobe did not return string output');
        }
      } catch (error) {
        console.warn('Direct ffprobe failed:', error);
        // Fall back to log parsing method
        probeResult = await extractMetadataFromLogs();
      }
    } else {
      console.log('ffprobe method not available, using log parsing');
      // Fall back to log parsing method
      probeResult = await extractMetadataFromLogs();
    }
    
    // Helper function to extract metadata from FFmpeg logs
    async function extractMetadataFromLogs() {
      const logMessages: string[] = [];
      
      // Set up log collection
      const logHandler = (event: any) => {
        logMessages.push(event.message);
      };
      
      ffmpeg.on('log', logHandler);
      
      try {
        // Run FFmpeg command that will output metadata information
        await ffmpeg.exec([
          '-i', inputFileName,
          '-f', 'null',
          '-'
        ]);
      } catch (error) {
        // Expected to "fail" since we're outputting to null, but we get the metadata in logs
      }
      
      // Remove the log handler
      ffmpeg.off('log', logHandler);
      
      // Parse the collected log messages to extract metadata
      const logText = logMessages.join('\n');
      
      // Extract key information using regex patterns
      const durationMatch = logText.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
      const bitrateMatch = logText.match(/bitrate: (\d+) kb\/s/);
      const videoMatch = logText.match(/Video: ([^,]+)(?:, ([^,]+))?, (\d+x\d+)/);
      const audioMatch = logText.match(/Audio: ([^,]+), (\d+) Hz, ([^,]+)/);
      
      // Helper functions
      const convertTimeToSeconds = (timeStr: string): number => {
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
      };
      
      const parseChannelInfo = (channelStr: string): number => {
        if (channelStr.includes('stereo')) return 2;
        if (channelStr.includes('mono')) return 1;
        if (channelStr.includes('5.1')) return 6;
        if (channelStr.includes('7.1')) return 8;
        return 2; // default
      };
      
      // Create metadata structure
      const metadata = {
        format: {
          filename: file.name,
          nb_streams: (videoMatch ? 1 : 0) + (audioMatch ? 1 : 0),
          nb_programs: 0,
          format_name: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          format_long_name: `${file.name.split('.').pop()?.toUpperCase() || 'Unknown'} format`,
          start_time: '0.000000',
          duration: durationMatch ? convertTimeToSeconds(durationMatch[1]).toString() : undefined,
          size: file.size.toString(),
          bit_rate: bitrateMatch ? (parseInt(bitrateMatch[1]) * 1000).toString() : undefined,
          probe_score: 100
        },
        streams: [] as any[]
      };
      
      // Add video stream if detected
      if (videoMatch) {
        const [, codec, pixfmt, resolution] = videoMatch;
        const [width, height] = resolution.split('x').map(Number);
        metadata.streams.push({
          index: 0,
          codec_name: codec.split('(')[0].trim(),
          codec_long_name: codec,
          codec_type: 'video',
          width,
          height,
          pix_fmt: pixfmt || 'yuv420p',
          duration: metadata.format.duration,
          bit_rate: bitrateMatch ? Math.round(parseInt(bitrateMatch[1]) * 1000 * 0.8).toString() : undefined,
          avg_frame_rate: '30/1' // Default estimate
        });
      }
      
      // Add audio stream if detected
      if (audioMatch) {
        const [, codec, sampleRate, channels] = audioMatch;
        metadata.streams.push({
          index: metadata.streams.length,
          codec_name: codec.split('(')[0].trim(),
          codec_long_name: codec,
          codec_type: 'audio',
          sample_rate: sampleRate,
          channels: parseChannelInfo(channels),
          channel_layout: channels,
          duration: metadata.format.duration,
          bit_rate: bitrateMatch ? Math.round(parseInt(bitrateMatch[1]) * 1000 * 0.2).toString() : undefined
        });
      }
      
      return metadata;
    }


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
  if (seconds === undefined || seconds === null) return 'Unknown';
  
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
  if (bytes === undefined || bytes === null) return 'Unknown';
  
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
  if (bitrate === undefined || bitrate === null) return 'Unknown';
  
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