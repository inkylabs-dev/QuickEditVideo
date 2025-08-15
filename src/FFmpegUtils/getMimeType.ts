/**
 * Get MIME type for video format
 * @param format Video format (mp4, webm, avi, mov, mkv, gif, mp3)
 * @returns MIME type string
 */
export function getMimeType(format: string): string {
  switch (format.toLowerCase()) {
    case 'mov': return 'video/quicktime';
    case 'mkv': return 'video/x-matroska';
    case 'avi': return 'video/x-msvideo';
    case 'webm': return 'video/webm';
    case 'gif': return 'image/gif';
    case 'mp3': return 'audio/mpeg';
    case 'mp4':
    default: return 'video/mp4';
  }
}

/**
 * Create a blob from Uint8Array data with appropriate MIME type
 * @param data Video data
 * @param format Video format
 * @returns Blob object
 */
export function createVideoBlob(data: Uint8Array, format: string): Blob {
  const mimeType = getMimeType(format);
  return new Blob([data], { type: mimeType });
}

/**
 * Download a blob as a file
 * @param blob File blob
 * @param filename Download filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
