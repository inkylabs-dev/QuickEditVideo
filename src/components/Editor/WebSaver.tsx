'use client';

import { useCallback } from 'react';
import type { CompositionTrack } from './compositions/tracks';
import { useElements, useVideoSize, PROJECT_TYPE, PROJECT_VERSION } from './useEditor';

const compactTrack = (track: CompositionTrack, fallbackTrack: number) => ({
  id: track.id,
  type: track.type,
  track: typeof track.track === 'number' ? track.track : Math.max(0, fallbackTrack),
  startInFrames: track.startInFrames,
  durationInFrames: track.durationInFrames,
  props: track.props,
});

const buildPayload = (
  elements: CompositionTrack[],
  metadata: Record<string, unknown>,
  width: number,
  height: number,
  files: unknown[],
  appState: Record<string, unknown>,
) => ({
  type: PROJECT_TYPE,
  version: PROJECT_VERSION,
  exportedAt: new Date().toISOString(),
  metadata: {
    ...metadata,
    width,
    height,
  },
  elements: elements.map((track, index) => compactTrack(track, index)),
  files,
  appState,
});

const downloadPayload = async (payload: string) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const suggestedName = `quickeditvideo-${timestamp}.qev`;

  // Try to use File System Access API for save dialog
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [{
          description: 'Quick Edit Video Project',
          accept: { 'application/json': ['.qev'] },
        }],
      });

      const writable = await handle.createWritable();
      await writable.write(payload);
      await writable.close();
      return;
    } catch (err) {
      // User cancelled or error occurred, fall through to legacy download
      if ((err as Error).name === 'AbortError') {
        return; // User cancelled, don't trigger fallback
      }
    }
  }

  // Fallback to traditional download for unsupported browsers
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = suggestedName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const useWebSaver = () => {
  const { elements, files, metadata, appState } = useElements();
  const { width, height } = useVideoSize();

  return useCallback(async () => {
    const json = JSON.stringify(
      buildPayload(elements, metadata, width, height, files, appState),
      null,
      2,
    );
    await downloadPayload(json);
  }, [elements, metadata, width, height, files, appState]);
};
