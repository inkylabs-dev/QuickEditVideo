# QuickEditVideo Core Package

This package contains the core components and utilities shared across all QuickEditVideo packages.

## Components

- `SelectFile` - File selection component with drag & drop support
- `Loading` - Loading spinner component
- `ControlPanel` - Shared control panel component

## FFmpeg Integration

- `FfmpegProvider` - Context provider for FFmpeg.wasm
- `useFFmpeg` - Hook for accessing FFmpeg context
- All FFmpeg utilities for video processing

## Usage

```tsx
import { FfmpegProvider, useFFmpeg, SelectFile, Loading } from 'quickeditvideo-core';

function MyComponent() {
  const { ffmpeg, loaded } = useFFmpeg();
  
  return (
    <div>
      {!loaded ? <Loading /> : <SelectFile onFileSelect={handleFile} />}
    </div>
  );
}
```

This package is a dependency for all other QuickEditVideo packages.