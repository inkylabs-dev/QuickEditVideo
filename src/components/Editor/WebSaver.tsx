'use client';

import { useCallback } from 'react';
import type { CompositionTrack } from './compositions/tracks';
import { useTracks } from './useTracks';

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

const downloadPayload = (payload: string) => {
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  anchor.href = url;
  anchor.download = `quickeditvideo-${timestamp}.qev`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const useWebSaver = () => {
  const { tracks } = useTracks();

  return useCallback(() => {
    const json = JSON.stringify(buildPayload(tracks), null, 2);
    downloadPayload(json);
  }, [tracks]);
};
