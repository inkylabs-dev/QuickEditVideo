import type { ImageCompositionProps } from './ImageComposition';
import type { TextCompositionProps } from './TextComposition';
import type { VideoCompositionProps } from './VideoComposition';

export type TrackType = 'text' | 'image' | 'video';

interface BaseCompositionTrack {
  id: string;
  type: TrackType;
  startInFrames: number;
  durationInFrames: number;
}

export type CompositionTrack =
  | (BaseCompositionTrack & { type: 'text'; props: TextCompositionProps })
  | (BaseCompositionTrack & { type: 'image'; props: ImageCompositionProps })
  | (BaseCompositionTrack & { type: 'video'; props: VideoCompositionProps });

export interface RootCompositionInputProps {
  tracks: CompositionTrack[];
}

export const ROOT_TRACKS: CompositionTrack[] = [
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
];

export const getRootCompositionDurationInFrames = (tracks: CompositionTrack[]) =>
  tracks.length === 0
    ? 1
    : tracks.reduce((max, track) => Math.max(max, track.startInFrames + track.durationInFrames), 0);
