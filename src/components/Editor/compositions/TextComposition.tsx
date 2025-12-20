'use client';

import type { CSSProperties } from 'react';
import { AbsoluteFill } from 'remotion';

export interface TextCompositionProps {
  message: string;
  subtext?: string;
  accentColor?: string;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px',
  textAlign: 'center',
};

const textStyle: CSSProperties = {
  fontSize: 'clamp(2rem, 3vw, 3rem)',
  margin: 0,
};

const subtextStyle: CSSProperties = {
  fontSize: '1rem',
  marginTop: '0.75rem',
  color: 'rgba(255, 255, 255, 0.8)',
};

const TextComposition = ({ message, subtext, accentColor = '#ffffff' }: TextCompositionProps) => (
  <AbsoluteFill style={containerStyle}>
    <div>
      <h1 style={{ ...textStyle, color: accentColor }}>{message}</h1>
      {subtext && <p style={subtextStyle}>{subtext}</p>}
    </div>
  </AbsoluteFill>
);

export default TextComposition;
