/**
 * Download a video file from Uint8Array data
 */
export function downloadVideo(data: Uint8Array, filename: string, mimeType: string = "video/mp4"): void {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
