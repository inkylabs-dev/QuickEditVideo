import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

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

interface VideoSizeContextValue {
  videoSize: VideoSize;
  setPreset: (preset: VideoSizePreset) => void;
  setCustomSize: (width: number, height: number) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
}

const VideoSizeContext = createContext<VideoSizeContextValue | null>(null);

export const VideoSizeProvider = ({ children }: { children: ReactNode }) => {
  const [videoSize, setVideoSize] = useState<VideoSize>({
    ...PRESETS.landscape,
    preset: 'landscape',
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

  return (
    <VideoSizeContext.Provider
      value={{
        videoSize,
        setPreset,
        setCustomSize,
        setWidth,
        setHeight,
      }}
    >
      {children}
    </VideoSizeContext.Provider>
  );
};

export const useVideoSize = () => {
  const context = useContext(VideoSizeContext);
  if (!context) {
    throw new Error('useVideoSize must be used within VideoSizeProvider');
  }
  return context;
};
