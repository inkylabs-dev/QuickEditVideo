'use client';

import type { CSSProperties, FC } from 'react';

const containerStyle: CSSProperties = {
  backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(236, 72, 153, 0.35), transparent 40%)',
  backgroundColor: '#0f172a',
  color: '#f8fafc',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  height: '100%',
  width: '100%',
  padding: '60px 40px',
  textAlign: 'center',
};

const badgeStyle: CSSProperties = {
  letterSpacing: '0.35em',
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  color: '#94a3b8',
};

const titleStyle: CSSProperties = {
  fontSize: '2.2rem',
  fontWeight: 600,
  margin: 0,
};

const subtitleStyle: CSSProperties = {
  color: '#cbd5f5',
  margin: 0,
  maxWidth: '320px',
};

const RootComposition: FC = () => (
  <div style={containerStyle}>
    <p style={badgeStyle}>QuickEditVideo</p>
    <h1 style={titleStyle}>Hello from Remotion</h1>
    <p style={subtitleStyle}>This simple scene proves the player wiring inside the editor.</p>
  </div>
);

export default RootComposition;
