'use client';

import type { CSSProperties } from 'react';
import { Player as RemotionPlayer } from '@remotion/player';
import RootComposition from './RootComposition';

const COMPOSITION_WIDTH = 1280;
const COMPOSITION_HEIGHT = 720;
const COMPOSITION_FPS = 30;
const COMPOSITION_DURATION = 150;

const PLAYER_STYLE: CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: '#0f172a',
};

const Player = () => (
  <div className="flex h-full w-full">
    <RemotionPlayer
      component={RootComposition}
      durationInFrames={COMPOSITION_DURATION}
      compositionWidth={COMPOSITION_WIDTH}
      compositionHeight={COMPOSITION_HEIGHT}
      fps={COMPOSITION_FPS}
      autoPlay
      loop
      controls
      style={PLAYER_STYLE}
      // QuickEditVideo project is ran by non-profit organization so we can
      // use Remotion Player for free by acknowledging the license.
      acknowledgeRemotionLicense={true}
    />
  </div>
);

export default Player;
