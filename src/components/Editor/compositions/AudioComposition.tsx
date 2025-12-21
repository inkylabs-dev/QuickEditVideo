'use client';

import type { CSSProperties } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';

export interface AudioCompositionProps {
  src: string;
  startInFrames?: number;
  endInFrames?: number;
  volume?: number;
  loop?: boolean;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const AudioComposition = ({
  src,
  startInFrames = 0,
  endInFrames,
  volume = 1,
  loop = false,
}: AudioCompositionProps) => {
  const { fps } = useVideoConfig();
  const trimBefore = startInFrames / fps;
  const trimAfter = endInFrames !== undefined ? endInFrames / fps : undefined;

  return (
    <AbsoluteFill style={containerStyle}>
      <Audio src={src} trimBefore={trimBefore} trimAfter={trimAfter} volume={volume} loop={loop} />
    </AbsoluteFill>
  );
};

export default AudioComposition;
