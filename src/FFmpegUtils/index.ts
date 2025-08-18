/**
 * FFmpeg Utilities Package
 * 
 * A collection of utility functions for common FFmpeg operations.
 * Each function is modularized for better maintainability and tree-shaking.
 */

// Video processing functions
export { convertVideo } from './convertVideo';
export { trimVideo } from './trimVideo';
export { resizeVideo } from './resizeVideo';
export { cropVideo } from './cropVideo';
export { mergeVideos } from './mergeVideos';
export { extractFrames, extractFramesInRange } from './extractFrames';
export { addWatermark } from './addWatermark';
export { addConfettiOverlay } from './addConfettiOverlay';
export { changeVideoSpeed } from './changeVideoSpeed';
export { flipVideo, type FlipDirection } from './flipVideo';

// Utility functions  
export { downloadVideo } from './downloadVideo';
export { getMimeType, createVideoBlob, downloadBlob } from './getMimeType';
