'use client';

import { useCallback } from 'react';
import type { CompositionTrack } from './compositions/tracks';
import { useTracks } from './useEditor';

const compactTrack = (track: CompositionTrack) => ({
  id: track.id,
  type: track.type,
  startInFrames: track.startInFrames,
  durationInFrames: track.durationInFrames,
  props: track.props,
});

const buildPayload = (tracks: CompositionTrack[]) => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  tracks: tracks.map(compactTrack),
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
  const { tracks } = useTracks();

  return useCallback(async () => {
    const json = JSON.stringify(buildPayload(tracks), null, 2);
    await downloadPayload(json);
  }, [tracks]);
};
