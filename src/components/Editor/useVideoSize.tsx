'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface VideoSize {
  width: number;
  height: number;
}

interface VideoSizeContextValue extends VideoSize {
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
}

const VideoSizeContext = createContext<VideoSizeContextValue | null>(null);

export const VideoSizeProvider = ({ children }: { children: ReactNode }) => {
  const [width, setWidthState] = useState(1920);
  const [height, setHeightState] = useState(1080);

  const setWidth = useCallback((nextWidth: number) => {
    setWidthState(nextWidth);
  }, []);

  const setHeight = useCallback((nextHeight: number) => {
    setHeightState(nextHeight);
  }, []);

  return (
    <VideoSizeContext.Provider value={{ width, height, setWidth, setHeight }}>
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
