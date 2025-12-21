'use client';

import type { CSSProperties } from 'react';
import { Player as RemotionPlayer } from '@remotion/player';
import RootComposition from './RootComposition';
import {
  ROOT_TRACKS,
  getRootCompositionDurationInFrames,
  RootCompositionInputProps,
} from './compositions/tracks';

const COMPOSITION_WIDTH = 1280;
const COMPOSITION_HEIGHT = 720;
const COMPOSITION_FPS = 30;
const COMPOSITION_DURATION = getRootCompositionDurationInFrames(ROOT_TRACKS);

const ROOT_INPUT_PROPS: RootCompositionInputProps = {
  tracks: ROOT_TRACKS,
};

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
      inputProps={ROOT_INPUT_PROPS}
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

export default Player;
