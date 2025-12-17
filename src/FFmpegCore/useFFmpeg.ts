/**
 * @fileoverview FFmpeg Context Access Hook
 * 
 * This module provides a thin wrapper hook for accessing FFmpeg context.
 * For actual video processing operations, use the utilities from FFmpegUtils.
 * 
 * ## Setup
 * 1. Wrap your app with FfmpegProvider
 * 2. Use the useFFmpeg hook to access FFmpeg context
 * 3. Use FFmpegUtils for video processing operations
 * 
 * @example
 * ```jsx
 * import { FfmpegProvider, useFFmpeg } from '../FFmpegCore';
 * import { convertVideo, downloadVideo } from '../FFmpegUtils';
 * 
 * function VideoConverter() {
 *   const { ffmpeg, isLoaded, setProgress } = useFFmpeg();
 *   
 *   const handleConvert = async (file) => {
 *     const data = await convertVideo(ffmpeg, file, 'mp4');
 *     downloadVideo(data, 'converted.mp4');
 *   };
 *   
 *   return isLoaded ? (
 *     <input type="file" onChange={(e) => handleConvert(e.target.files[0])} />
 *   ) : (
 *     <p>Loading FFmpeg...</p>
 *   );
 * }
 * 
 * function App() {
 *   return (
 *     <FfmpegProvider>
 *       <VideoConverter />
 *     </FfmpegProvider>
 *   );
 * }
 * ```
 * 
 * ## Hook API
 * - `ffmpeg`: FFmpeg instance
 * - `isLoaded`: boolean - FFmpeg ready state
 * - `isLoading`: boolean - FFmpeg loading state  
 * - `error`: string | null - Loading errors
 * - `progress`: number - Processing progress (0-100)
 * - `setProgress`: function - Set processing progress
 * - `writeFile`: function - Write file to FFmpeg filesystem
 * - `readFile`: function - Read file from FFmpeg filesystem
 * - `exec`: function - Execute FFmpeg command
 * 
 * ## Video Processing Utilities (use FFmpegUtils instead)
 * - `convertVideo()`: Format conversion
 * - `trimVideo()`: Cut video segments
 * - `resizeVideo()`: Change dimensions
 * - `cropVideo()`: Crop video area
 * - `mergeVideos()`: Combine multiple videos
 * - `downloadVideo()`: Download processed video
 */

import { useContext } from 'react';
import { FFmpegContext } from './FFmpegContext';

export const useFFmpeg = () => {
	const context = useContext(FFmpegContext);
	
	if (!context) {
		throw new Error('useFFmpeg must be used within an FFmpegProvider');
	}

	// Return the entire context - just a thin wrapper
	return context;
};
