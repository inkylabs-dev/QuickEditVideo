'use client';

import type {
  RenderMediaOnWebProgressCallback,
  WebRendererContainer,
  WebRendererQuality,
} from '@remotion/web-renderer';
import { renderMediaOnWeb } from '@remotion/web-renderer';
import RootComposition from './RootComposition';
import { CompositionTrack, getRootCompositionDurationInFrames, getTracksFingerprint } from './compositions/tracks';
import type { VideoSize } from './useEditor';

const COMPOSITION_FPS = 30;

const buildCompositionOptions = (
  tracks: CompositionTrack[],
  width: number,
  height: number
) => {
  const fingerprint = getTracksFingerprint(tracks);
  return {
    component: RootComposition,
    id: `RootComposition-${fingerprint}`,
    width,
    height,
    fps: COMPOSITION_FPS,
    durationInFrames: getRootCompositionDurationInFrames(tracks),
    inputProps: {
      tracks,
    },
  };
};

export interface RenderRootCompositionOptions {
  container: WebRendererContainer;
  quality: WebRendererQuality;
  onProgress?: RenderMediaOnWebProgressCallback;
  tracks: CompositionTrack[];
  videoSize?: VideoSize;
}

export const renderRootComposition = async ({
  container,
  quality,
  onProgress,
  tracks,
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
