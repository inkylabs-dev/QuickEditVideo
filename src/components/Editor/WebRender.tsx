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

const COMPOSITION_WIDTH = 1280;
const COMPOSITION_HEIGHT = 720;
const COMPOSITION_FPS = 30;

const buildCompositionOptions = (tracks: CompositionTrack[]) => ({
  component: RootComposition,
  id: 'RootComposition',
  width: COMPOSITION_WIDTH,
  height: COMPOSITION_HEIGHT,
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
}

export const renderRootComposition = async ({
  container,
  quality,
  onProgress,
  tracks = ROOT_TRACKS,
}: RenderRootCompositionOptions) =>
  renderMediaOnWeb({
    composition: buildCompositionOptions(tracks),
    container,
    videoBitrate: quality,
    onProgress: onProgress ?? null,
  });
