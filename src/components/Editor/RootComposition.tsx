'use client';

import type { CSSProperties } from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import AudioComposition from './compositions/AudioComposition';
import ImageComposition from './compositions/ImageComposition';
import VideoComposition from './compositions/VideoComposition';
import TextComposition from './compositions/TextComposition';
import { CompositionTrack, RootCompositionInputProps } from './compositions/tracks';
import { DEFAULT_ELEMENTS } from './useEditor';

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

type RootCompositionProps = {
  elements?: CompositionTrack[];
  inputProps?: RootCompositionInputProps;
};

const RootComposition = ({ elements, inputProps }: RootCompositionProps) => {
  const resolvedElements = elements ?? inputProps?.elements ?? inputProps?.tracks ?? [];
  const compositionElements = resolvedElements.length > 0 ? resolvedElements : DEFAULT_ELEMENTS;

  const elementsByTrack = compositionElements.reduce<Record<number, CompositionTrack[]>>(
    (acc, element) => {
      const trackIndex = typeof element.track === 'number' ? element.track : 0;
      if (!acc[trackIndex]) {
        acc[trackIndex] = [];
      }
      acc[trackIndex].push(element);
      return acc;
    },
    {},
  );

  const sortedTrackIndices = Object.keys(elementsByTrack)
    .map((key) => Number(key))
    .sort((a, b) => a - b);

  return (
    <AbsoluteFill style={containerStyle}>
      {sortedTrackIndices.map((trackIndex) => {
        const trackElements = (elementsByTrack[trackIndex] ?? []).slice().sort((a, b) => {
          if (a.startInFrames === b.startInFrames) {
            return a.id.localeCompare(b.id);
          }
          return a.startInFrames - b.startInFrames;
        });

        return (
          <AbsoluteFill key={`track-${trackIndex}`}>
            {trackElements.map((element) => {
              const rendered = renderTrack(element);

              if (!rendered) {
                return null;
              }

              return (
                <Sequence
                  key={element.id}
                  from={element.startInFrames}
                  durationInFrames={Math.max(1, element.durationInFrames)}
                >
                  {rendered}
                </Sequence>
              );
            })}
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

export default RootComposition;
