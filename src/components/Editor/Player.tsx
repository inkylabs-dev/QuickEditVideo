'use client';

import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import { Player as RemotionPlayer } from '@remotion/player';
import RootComposition from './RootComposition';
import {
  getRootCompositionDurationInFrames,
  RootCompositionInputProps,
} from './compositions/tracks';
import { useVideoSize } from './useVideoSize';
import { useTracks } from './useTracks';

const COMPOSITION_FPS = 30;

const PLAYER_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: '#0f172a',
};

const Player = () => {
  const { width, height } = useVideoSize();
  const { tracks } = useTracks();
  const durationInFrames = getRootCompositionDurationInFrames(tracks);
  const inputProps: RootCompositionInputProps = useMemo(() => ({ tracks }), [tracks]);
  const hasTracks = tracks.length > 0;

  if (!hasTracks) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-sm font-semibold text-white/70">
          No tracks to preview. Add or open a project to render the player.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <RemotionPlayer
        component={RootComposition}
        durationInFrames={durationInFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={COMPOSITION_FPS}
        inputProps={inputProps}
        autoPlay={false}
        loop={false}
        controls={true}
        style={PLAYER_STYLE}
        // QuickEditVideo project is ran by non-profit organization so we can
        // use Remotion Player for free by acknowledging the license.
        acknowledgeRemotionLicense={true}
      />
    </div>
  );
};

export default Player;
