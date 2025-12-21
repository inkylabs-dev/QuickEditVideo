'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { CompositionTrack } from './compositions/tracks';

export interface VideoSize {
  width: number;
  height: number;
}

interface VideoSizeContextValue extends VideoSize {
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
}

interface TracksContextValue {
  tracks: CompositionTrack[];
  setTracks: (tracks: CompositionTrack[]) => void;
  promptOpenFile: () => void;
}

const VideoSizeContext = createContext<VideoSizeContextValue | null>(null);
const TracksContext = createContext<TracksContextValue | null>(null);

const parseTracksFromPayload = (payload: string): CompositionTrack[] | undefined => {
  try {
    const parsed = JSON.parse(payload);
    if (Array.isArray(parsed)) {
      return parsed as CompositionTrack[];
    }
    if (Array.isArray(parsed?.tracks)) {
      return parsed.tracks as CompositionTrack[];
    }
    return undefined;
  } catch {
    return undefined;
  }
};

export const DEFAULT_TRACKS: CompositionTrack[] = [
  {
    id: 'hero-image',
    type: 'image',
    startInFrames: 0,
    durationInFrames: 150,
    props: {
      src: '/logo.png',
      alt: 'QuickEditVideo logo',
      width: 640,
      height: 360,
    },
  },
];

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [width, setWidthState] = useState(1920);
  const [height, setHeightState] = useState(1080);
  const [tracks, setTracksState] = useState<CompositionTrack[]>(DEFAULT_TRACKS);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setWidth = useCallback((nextWidth: number) => {
    setWidthState(nextWidth);
  }, []);

  const setHeight = useCallback((nextHeight: number) => {
    setHeightState(nextHeight);
  }, []);

  const setTracks = useCallback((nextTracks: CompositionTrack[]) => {
    setTracksState(nextTracks);
  }, []);

  const handleFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        if (!reader.result) {
          return;
        }

        const parsedTracks = parseTracksFromPayload(reader.result as string);

        if (parsedTracks) {
          setTracks(parsedTracks);
        } else {
          console.error('Selected file does not contain a valid tracks array');
        }
      };

      reader.onerror = () => {
        console.error('Failed to read the selected file');
      };

      reader.readAsText(file);
    },
    [setTracks],
  );

  useEffect(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.qev,.json,application/json';
    input.style.display = 'none';

    const changeHandler = (event: Event) => {
      const target = event.target as HTMLInputElement;
      handleFile(target.files?.[0]);
      target.value = '';
    };

    input.addEventListener('change', changeHandler);
    document.body.appendChild(input);
    inputRef.current = input;

    return () => {
      input.removeEventListener('change', changeHandler);
      input.remove();
      inputRef.current = null;
    };
  }, [handleFile]);

  const promptOpenFile = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <VideoSizeContext.Provider value={{ width, height, setWidth, setHeight }}>
      <TracksContext.Provider value={{ tracks, setTracks, promptOpenFile }}>
        {children}
      </TracksContext.Provider>
    </VideoSizeContext.Provider>
  );
};

export const useVideoSize = () => {
  const context = useContext(VideoSizeContext);
  if (!context) {
    throw new Error('useVideoSize must be used within EditorProvider');
  }
  return context;
};

export const useTracks = () => {
  const context = useContext(TracksContext);
  if (!context) {
    throw new Error('useTracks must be used within EditorProvider');
  }
  return context;
};
