'use client';

import type { CSSProperties } from 'react';
import { AbsoluteFill, Img } from 'remotion';

export interface ImageCompositionProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

const containerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
};

const imageStyle = (width?: number, height?: number): CSSProperties => ({
  width: width ? `${width}px` : '100%',
  maxWidth: '90vw',
  height: height ? `${height}px` : 'auto',
  borderRadius: '16px',
  objectFit: 'cover',
});

const ImageComposition = ({ src, alt, width, height }: ImageCompositionProps) => (
  <AbsoluteFill style={containerStyle}>
    <Img src={src} alt={alt ?? 'Composition asset'} style={imageStyle(width, height)} />
  </AbsoluteFill>
);

export default ImageComposition;
