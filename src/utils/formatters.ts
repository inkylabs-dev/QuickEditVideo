export function formatDuration(seconds: string | number | undefined): string {
  if (seconds === undefined || seconds === null) return 'Unknown';
  const totalSeconds = typeof seconds === 'string' ? parseFloat(seconds) : seconds;
  if (Number.isNaN(totalSeconds)) return 'Unknown';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: string | number | undefined): string {
  if (bytes === undefined || bytes === null) return 'Unknown';
  const totalBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (Number.isNaN(totalBytes)) return 'Unknown';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = totalBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatBitrate(bitrate: string | number | undefined): string {
  if (bitrate === undefined || bitrate === null) return 'Unknown';
  const bps = typeof bitrate === 'string' ? parseInt(bitrate, 10) : bitrate;
  if (Number.isNaN(bps)) return 'Unknown';

  if (bps >= 1_000_000) {
    return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  }
  if (bps >= 1000) {
    return `${(bps / 1000).toFixed(0)} kbps`;
  }
  return `${bps} bps`;
}
