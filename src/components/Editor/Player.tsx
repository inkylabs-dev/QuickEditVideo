'use client';

import type { CSSProperties } from 'react';
import { useMemo, useCallback } from 'react';
import { Player as RemotionPlayer, PlayerRef } from '@remotion/player';
import RootComposition from './RootComposition';
import {
  getRootCompositionDurationInFrames,
  RootCompositionInputProps,
} from './compositions/tracks';
import { useVideoSize, useElements, usePlayerRef, usePlaybackRate } from './useEditor';

const COMPOSITION_FPS = 30;

const PLAYER_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: '#0f172a',
};

const Player = () => {
  const { setPlayerRef } = usePlayerRef();
  const { width, height } = useVideoSize();
  const { elements } = useElements();
  const playbackRate = usePlaybackRate();
  const durationInFrames = getRootCompositionDurationInFrames(elements);
  const inputProps: RootCompositionInputProps = useMemo(() => ({ elements }), [elements]);
  const hasElements = elements.length > 0;

  const handlePlayerRef = useCallback((ref: PlayerRef | null) => {
    if (ref) {
      setPlayerRef(ref);
    }
  }, [setPlayerRef]);

  if (!hasElements) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-sm font-semibold text-slate-900">
          No elements to preview. Add or open a project to render the player.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      <RemotionPlayer
        ref={handlePlayerRef}
        component={RootComposition}
        durationInFrames={durationInFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={COMPOSITION_FPS}
        inputProps={inputProps}
        autoPlay={false}
        loop={false}
        controls={false}
        playbackRate={playbackRate}
        style={PLAYER_STYLE}
        // QuickEditVideo project is ran by non-profit organization so we can
        // use Remotion Player for free by acknowledging the license.
        acknowledgeRemotionLicense={true}
      />
    </div>
  );
};

export default Player;
