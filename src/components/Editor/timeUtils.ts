export const FPS = 30;

/**
 * Format seconds to mm:ss.d format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const wholeSecs = Math.floor(secs);
  const decisec = Math.floor((secs - wholeSecs) * 10);
  return `${mins.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')}.${decisec}`;
};

/**
 * Format frame number to mm:ss format
 */
export const formatFrameTime = (frame: number): string => {
  const totalSeconds = frame / FPS;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
