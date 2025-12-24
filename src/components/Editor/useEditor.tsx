'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { PlayerRef } from '@remotion/player';
import type { CompositionTrack, TrackType } from './compositions/tracks';
import { getRootCompositionDurationInFrames } from './compositions/tracks';

export const PROJECT_TYPE = 'quickeditvideo';
export const PROJECT_VERSION = 1;
const VALID_TRACK_TYPES: TrackType[] = ['text', 'image', 'video', 'audio'];

export interface VideoSize {
  width: number;
  height: number;
}

interface VideoSizeContextValue extends VideoSize {
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
}

interface ElementsContextValue {
  elements: CompositionTrack[];
  setElements: (elements: CompositionTrack[]) => void;
  promptOpenFile: () => void;
  files: unknown[];
  setFiles: (files: unknown[]) => void;
  metadata: QuickEditMetadata;
  setMetadata: (metadata: QuickEditMetadata) => void;
  appState: Record<string, unknown>;
  setAppState: (appState: Record<string, unknown>) => void;
}

interface PlayerRefContextValue {
  getPlayerRef: () => PlayerRef | null;
  setPlayerRef: (ref: PlayerRef | null) => void;
  getTotalFrames: () => number;
}

const VideoSizeContext = createContext<VideoSizeContextValue | null>(null);
const ElementsContext = createContext<ElementsContextValue | null>(null);
const PlayerRefContext = createContext<PlayerRefContextValue | null>(null);

type QuickEditMetadata = Record<string, unknown>;

interface ParsedProjectPayload {
  elements: CompositionTrack[];
  metadata: QuickEditMetadata;
  files: unknown[];
  appState: Record<string, unknown>;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const toFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const normalizeTrackElement = (element: unknown, fallbackTrack: number): CompositionTrack | null => {
  if (!isPlainObject(element)) {
    return null;
  }

  const { id, type, startInFrames, durationInFrames, props, track } = element as Record<string, unknown>;

  if (typeof id !== 'string' || typeof type !== 'string' || !VALID_TRACK_TYPES.includes(type as TrackType)) {
    return null;
  }

  const parsedStart = toFiniteNumber(startInFrames);
  const parsedDuration = toFiniteNumber(durationInFrames);

  if (parsedStart === undefined || parsedDuration === undefined) {
    return null;
  }

  if (!props || typeof props !== 'object') {
    return null;
  }

  const parsedTrackIndex = toFiniteNumber(track);
  const normalizedTrack = parsedTrackIndex !== undefined ? Math.max(0, Math.floor(parsedTrackIndex)) : fallbackTrack;

  return {
    id,
    type: type as TrackType,
    startInFrames: Math.max(0, Math.floor(parsedStart)),
    durationInFrames: Math.max(1, Math.floor(parsedDuration)),
    props: props as CompositionTrack['props'],
    track: normalizedTrack,
  } as CompositionTrack;
};

const buildElementsFromPayload = (elements: unknown[]): CompositionTrack[] =>
  elements
    .map((element, index) => normalizeTrackElement(element, index))
    .filter((track): track is CompositionTrack => Boolean(track));

const parseProjectPayload = (payload: string): ParsedProjectPayload | undefined => {
  try {
    const parsed = JSON.parse(payload);

    if (Array.isArray(parsed)) {
      return {
        elements: buildElementsFromPayload(parsed),
        metadata: {},
        files: [],
        appState: {},
      };
    }

    if (!isPlainObject(parsed)) {
      return undefined;
    }

    if (typeof parsed.type === 'string' && parsed.type !== PROJECT_TYPE) {
      return undefined;
    }

    const parsedVersion = toFiniteNumber(parsed.version);
    if (parsedVersion !== undefined && parsedVersion !== PROJECT_VERSION) {
      return undefined;
    }

    const rawElements = Array.isArray(parsed.elements)
      ? parsed.elements
      : undefined;

    if (!rawElements) {
      return undefined;
    }

    return {
      elements: buildElementsFromPayload(rawElements),
      metadata: isPlainObject(parsed.metadata) ? parsed.metadata : {},
      files: Array.isArray(parsed.files) ? parsed.files : [],
      appState: isPlainObject(parsed.appState) ? parsed.appState : {},
    };
  } catch {
    return undefined;
  }
};

export const DEFAULT_ELEMENTS: CompositionTrack[] = [
  {
    id: 'hero-image',
    type: 'image',
    track: 0,
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
  const [metadata, setMetadataState] = useState<QuickEditMetadata>({
    width: 1920,
    height: 1080,
  });
  const [elements, setElementsState] = useState<CompositionTrack[]>(DEFAULT_ELEMENTS);
  const [files, setFilesState] = useState<unknown[]>([]);
  const [appState, setAppStateState] = useState<Record<string, unknown>>({});
  const inputRef = useRef<HTMLInputElement | null>(null);
  const playerRefInternal = useRef<PlayerRef | null>(null);

  const getPlayerRef = useCallback(() => playerRefInternal.current, []);
  const setPlayerRef = useCallback((ref: PlayerRef | null) => {
    playerRefInternal.current = ref;
  }, []);

  const getTotalFrames = useCallback(() => {
    return getRootCompositionDurationInFrames(elements);
  }, [elements]);

  const setWidth = useCallback((nextWidth: number) => {
    setWidthState(nextWidth);
    setMetadataState((prev) => ({ ...prev, width: nextWidth }));
  }, []);

  const setHeight = useCallback((nextHeight: number) => {
    setHeightState(nextHeight);
    setMetadataState((prev) => ({ ...prev, height: nextHeight }));
  }, []);

  const setElements = useCallback((nextElements: CompositionTrack[]) => {
    setElementsState(
      nextElements.map((track, index) => ({
        ...track,
        track: typeof track.track === 'number' ? track.track : Math.max(0, index),
      })),
    );
  }, []);

  const setFiles = useCallback((nextFiles: unknown[]) => {
    setFilesState(nextFiles);
  }, []);

  const setAppState = useCallback((nextAppState: Record<string, unknown>) => {
    setAppStateState(nextAppState);
  }, []);

  const setMetadata = useCallback((nextMetadata: QuickEditMetadata) => {
    setMetadataState(nextMetadata);
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

        const parsedProject = parseProjectPayload(reader.result as string);

        if (!parsedProject) {
          console.error('Selected file is not a valid QuickEditVideo project');
          return;
        }

        setElements(parsedProject.elements);
        setFiles(parsedProject.files);
        setAppState(parsedProject.appState);
        setMetadataState((prev) => ({
          ...prev,
          ...parsedProject.metadata,
        }));

        const metadataWidth = toFiniteNumber(parsedProject.metadata.width);
        const metadataHeight = toFiniteNumber(parsedProject.metadata.height);

        setWidth(metadataWidth ?? width);
        setHeight(metadataHeight ?? height);
      };

      reader.onerror = () => {
        console.error('Failed to read the selected file');
      };

      reader.readAsText(file);
    },
    [setElements, setFiles, setAppState, setWidth, setHeight, width, height],
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
      <ElementsContext.Provider
        value={{
          elements,
          setElements,
          promptOpenFile,
          files,
          setFiles,
          metadata,
          setMetadata,
          appState,
          setAppState,
        }}
      >
        <PlayerRefContext.Provider value={{ getPlayerRef, setPlayerRef, getTotalFrames }}>
          {children}
        </PlayerRefContext.Provider>
      </ElementsContext.Provider>
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

export const useElements = () => {
  const context = useContext(ElementsContext);
  if (!context) {
    throw new Error('useElements must be used within EditorProvider');
  }
  return context;
};

export const usePlayerRef = () => {
  const context = useContext(PlayerRefContext);
  if (!context) {
    throw new Error('usePlayerRef must be used within EditorProvider');
  }
  return context;
};

export const usePlaybackRate = () => {
  const { appState } = useElements();
  const playbackRateString = (appState.timelinePlaybackRate as string) || '1x';
  const playbackRate = parseFloat(playbackRateString.replace('x', ''));
  return playbackRate;
};
