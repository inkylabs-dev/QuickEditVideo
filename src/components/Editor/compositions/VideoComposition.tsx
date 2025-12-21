'use client';

import type { CSSProperties } from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { Video } from '@remotion/media';

export interface VideoCompositionProps {
  src: string;
  loop?: boolean;
  startInFrames?: number;
  endInFrames?: number;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const videoStyle: CSSProperties = {
  width: '100%',
  maxWidth: '90vw',
  borderRadius: '16px',
  boxShadow: '0 20px 70px rgba(0, 0, 0, 0.3)',
};

const VideoComposition = ({ src, loop = true, startInFrames = 0, endInFrames }: VideoCompositionProps) => {
  const { fps } = useVideoConfig();
  const trimBefore = startInFrames / fps;
  const trimAfter = endInFrames !== undefined ? endInFrames / fps : undefined;

  return (
    <AbsoluteFill style={containerStyle}>
      <Video src={src} loop={loop} trimBefore={trimBefore} trimAfter={trimAfter} style={videoStyle} />
    </AbsoluteFill>
  );
};

export default VideoComposition;
