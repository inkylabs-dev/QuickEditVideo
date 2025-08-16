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
export { addWatermark } from './addWatermark';

// Utility functions  
export { downloadVideo } from './downloadVideo';
export { getMimeType, createVideoBlob, downloadBlob } from './getMimeType';
