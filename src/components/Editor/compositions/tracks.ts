import type { AudioCompositionProps } from './AudioComposition';
import type { ImageCompositionProps } from './ImageComposition';
import type { TextCompositionProps } from './TextComposition';
import type { VideoCompositionProps } from './VideoComposition';

export type TrackType = 'text' | 'image' | 'video' | 'audio';

interface BaseCompositionTrack {
  id: string;
  type: TrackType;
  startInFrames: number;
  durationInFrames: number;
}

export type CompositionTrack =
  | (BaseCompositionTrack & { type: 'text'; props: TextCompositionProps })
  | (BaseCompositionTrack & { type: 'image'; props: ImageCompositionProps })
  | (BaseCompositionTrack & { type: 'video'; props: VideoCompositionProps })
  | (BaseCompositionTrack & { type: 'audio'; props: AudioCompositionProps });

export interface RootCompositionInputProps {
  tracks: CompositionTrack[];
}

export const getRootCompositionDurationInFrames = (tracks: CompositionTrack[]) =>
  tracks.length === 0
    ? 1
    : tracks.reduce((max, track) => Math.max(max, track.startInFrames + track.durationInFrames), 0);

const stableStringify = (value: unknown): string => {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.map((item) => stableStringify(item)).join(',')}]`;
    }
    const entries = Object.keys(value as Record<string, unknown>).sort();
    return `{${entries.map((key) => `${key}:${stableStringify((value as Record<string, unknown>)[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

export const getTracksFingerprint = (tracks: CompositionTrack[]) => {
  const serial = tracks
    .map((track) => {
      const propsValue = stableStringify(track.props);
      return `${track.id}|${track.type}|${track.startInFrames}|${track.durationInFrames}|${propsValue}`;
    })
    .join(';');

  let hash = 0;
  for (let i = 0; i < serial.length; i += 1) {
    hash = (hash * 31 + serial.charCodeAt(i)) >>> 0;
  }

  return hash.toString(36);
};
