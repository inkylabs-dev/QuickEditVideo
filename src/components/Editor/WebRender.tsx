'use client';

import type {
  RenderMediaOnWebProgressCallback,
  WebRendererContainer,
  WebRendererQuality,
} from '@remotion/web-renderer';
import { renderMediaOnWeb } from '@remotion/web-renderer';
import RootComposition from './RootComposition';

export const ROOT_DURATION_IN_FRAMES = 150;

const ROOT_COMPOSITION_OPTIONS = {
  component: RootComposition,
  id: 'RootComposition',
  width: 1280,
  height: 720,
  fps: 30,
  durationInFrames: ROOT_DURATION_IN_FRAMES,
};

export interface RenderRootCompositionOptions {
  container: WebRendererContainer;
  quality: WebRendererQuality;
  onProgress?: RenderMediaOnWebProgressCallback;
}

export const renderRootComposition = async ({
  container,
  quality,
  onProgress,
}: RenderRootCompositionOptions) =>
  renderMediaOnWeb({
    composition: ROOT_COMPOSITION_OPTIONS,
    container,
    videoBitrate: quality,
    onProgress: onProgress ?? null,
  });
