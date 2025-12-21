'use client';

import type { CSSProperties } from 'react';
import type { CompositionProps } from 'remotion';
import { AbsoluteFill, Sequence } from 'remotion';
import AudioComposition from './compositions/AudioComposition';
import ImageComposition from './compositions/ImageComposition';
import VideoComposition from './compositions/VideoComposition';
import TextComposition from './compositions/TextComposition';
import { CompositionTrack, RootCompositionInputProps } from './compositions/tracks';
import { DEFAULT_TRACKS } from './useTracks';

const containerStyle: CSSProperties = {
  background: 'radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.25), transparent 40%), #020617',
  color: '#f8fafc',
  position: 'relative',
};

const renderTrack = (track: CompositionTrack) => {
  if (track.type === 'audio') {
    return <AudioComposition {...track.props} />;
  }

  if (track.type === 'text') {
    return <TextComposition {...track.props} />;
  }

  if (track.type === 'image') {
    return <ImageComposition {...track.props} />;
  }

  if (track.type === 'video') {
    return <VideoComposition {...track.props} />;
  }

  return null;
};

const RootComposition = ({ inputProps }: CompositionProps<RootCompositionInputProps>) => {
  const tracks = inputProps?.tracks ?? DEFAULT_TRACKS;

  return (
    <AbsoluteFill style={containerStyle}>
      {tracks.map((track) => {
        const element = renderTrack(track);

        if (!element) {
          return null;
        }

        return (
          <Sequence
            key={track.id}
            from={track.startInFrames}
            durationInFrames={Math.max(1, track.durationInFrames)}
          >
            {element}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export default RootComposition;
