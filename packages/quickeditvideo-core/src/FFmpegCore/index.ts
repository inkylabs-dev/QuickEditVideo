/**
 * @fileoverview FFmpeg Core Module - Centralized FFmpeg.wasm Integration
 * 
 * This module provides a complete FFmpeg.wasm integration for video processing
 * in React/Preact applications. It includes context management, provider components,
 * and high-level hooks for video processing tasks.
 * 
 * @example
 * ```jsx
 * import { FfmpegProvider, useFFmpeg } from '../FFmpegCore';
 * 
 * function VideoApp() {
 *   return (
 *     <FfmpegProvider>
 *       <VideoConverter />
 *     </FfmpegProvider>
 *   );
 * }
 * 
 * function VideoConverter() {
 *   const { isLoaded, convertVideo, downloadBlob } = useFFmpeg();
 *   
 *   const handleConvert = async (file, format) => {
 *     const blob = await convertVideo(file, format);
 *     downloadBlob(blob, `converted.${format}`);
 *   };
 *   
 *   return isLoaded ? (
 *     <VideoUploadComponent onConvert={handleConvert} />
 *   ) : (
 *     <div>Loading FFmpeg...</div>
 *   );
 * }
 * ```
 */

// Core context and types
export { FFmpegContext, type FFmpegContextType } from './FFmpegContext';

// Provider component for FFmpeg state management
export { FfmpegProvider } from './FfmpegProvider';

// High-level hook for FFmpeg operations
export { useFFmpeg } from './useFFmpeg';
