'use client';

import type {
  RenderMediaOnWebProgressCallback,
  WebRendererContainer,
  WebRendererQuality,
} from '@remotion/web-renderer';
import { renderMediaOnWeb } from '@remotion/web-renderer';
import RootComposition from './RootComposition';
import {
  CompositionTrack,
  getRootCompositionDurationInFrames,
  ROOT_TRACKS,
} from './compositions/tracks';
import type { VideoSize } from './useVideoSize';

const COMPOSITION_FPS = 30;

const buildCompositionOptions = (
  tracks: CompositionTrack[],
  width: number,
  height: number
) => ({
  component: RootComposition,
  id: 'RootComposition',
  width,
  height,
  fps: COMPOSITION_FPS,
  durationInFrames: getRootCompositionDurationInFrames(tracks),
  inputProps: {
    tracks,
  },
});

export interface RenderRootCompositionOptions {
  container: WebRendererContainer;
  quality: WebRendererQuality;
  onProgress?: RenderMediaOnWebProgressCallback;
  tracks?: CompositionTrack[];
  videoSize?: VideoSize;
}

export const renderRootComposition = async ({
  container,
  quality,
  onProgress,
  tracks = ROOT_TRACKS,
  videoSize,
}: RenderRootCompositionOptions) => {
  const width = videoSize?.width ?? 1280;
  const height = videoSize?.height ?? 720;

  return renderMediaOnWeb({
    composition: buildCompositionOptions(tracks, width, height),
    container,
    videoBitrate: quality,
    onProgress: onProgress ?? null,
  });
};
