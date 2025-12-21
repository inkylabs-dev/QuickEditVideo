'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { CompositionTrack } from './compositions/tracks';

export const DEFAULT_TRACKS: CompositionTrack[] = [
  {
    id: 'intro-text',
    type: 'text',
    startInFrames: 0,
    durationInFrames: 120,
    props: {
      message: 'Compose videos without leaving the browser',
      subtext: 'Every edit stays on your device for privacy-first workflows.',
      accentColor: '#38bdf8',
    },
  },
  {
    id: 'hero-image',
    type: 'image',
    startInFrames: 120,
    durationInFrames: 100,
    props: {
      src: '/logo.png',
      alt: 'QuickEditVideo logo',
      width: 640,
      height: 360,
    },
  },
  {
    id: 'hero-video',
    type: 'video',
    startInFrames: 220,
    durationInFrames: 140,
    props: {
      src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      startInFrames: 0,
      endInFrames: 140,
      loop: true,
    },
  },
  {
    id: 'background-audio',
    type: 'audio',
    startInFrames: 0,
    durationInFrames: 360,
    props: {
      src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
      startInFrames: 0,
      endInFrames: 360,
      loop: true,
      volume: 0.7,
    },
  },
];

interface TracksContextValue {
  tracks: CompositionTrack[];
  setTracks: (tracks: CompositionTrack[]) => void;
  promptOpenFile: () => void;
}

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

export const TracksProvider = ({ children }: { children: ReactNode }) => {
  const [tracks, setTracksState] = useState<CompositionTrack[]>(DEFAULT_TRACKS);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
    <TracksContext.Provider value={{ tracks, setTracks, promptOpenFile }}>
      {children}
    </TracksContext.Provider>
  );
};

export const useTracks = () => {
  const context = useContext(TracksContext);
  if (!context) {
    throw new Error('useTracks must be used within a TracksProvider');
  }
  return context;
};
