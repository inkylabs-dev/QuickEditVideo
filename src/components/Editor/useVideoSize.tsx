import { useState, useCallback } from 'react';

export type VideoSizePreset = 'landscape' | 'mobile' | 'square' | 'custom';

export interface VideoSize {
  width: number;
  height: number;
  preset: VideoSizePreset;
}

const PRESETS: Record<Exclude<VideoSizePreset, 'custom'>, { width: number; height: number }> = {
  landscape: { width: 1920, height: 1080 },
  mobile: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

export const useVideoSize = (initialPreset: VideoSizePreset = 'landscape') => {
  const [videoSize, setVideoSize] = useState<VideoSize>(() => {
    if (initialPreset === 'custom') {
      return { width: 1920, height: 1080, preset: 'custom' };
    }
    return { ...PRESETS[initialPreset], preset: initialPreset };
  });

  const setPreset = useCallback((preset: VideoSizePreset) => {
    if (preset === 'custom') {
      setVideoSize((prev) => ({ ...prev, preset: 'custom' }));
    } else {
      setVideoSize({ ...PRESETS[preset], preset });
    }
  }, []);

  const setCustomSize = useCallback((width: number, height: number) => {
    setVideoSize({ width, height, preset: 'custom' });
  }, []);

  const setWidth = useCallback((width: number) => {
    setVideoSize((prev) => ({ ...prev, width, preset: 'custom' }));
  }, []);

  const setHeight = useCallback((height: number) => {
    setVideoSize((prev) => ({ ...prev, height, preset: 'custom' }));
  }, []);

  return {
    videoSize,
    setPreset,
    setCustomSize,
    setWidth,
    setHeight,
  };
};
