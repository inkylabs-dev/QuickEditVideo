# QuickEditVideo Packages

This directory contains the modular video editing components as separate packages.

## Package Structure

- **`quickeditvideo-core`** - Core components and FFmpeg utilities
- **`quickeditvideo-converter`** - Video format conversion component
- **`quickeditvideo-merger`** - Video merging component
- **`quickeditvideo-trimmer`** - Video trimming component
- **`quickeditvideo-resizer`** - Video resizing component
- **`quickeditvideo-cropper`** - Video cropping component
- **`quickeditvideo-watermark`** - Video watermarking component
- **`quickeditvideo-flipper`** - Video flipping component
- **`quickeditvideo-speed`** - Video speed adjustment component
- **`quickeditvideo-audio-extractor`** - Audio extraction component
- **`quickeditvideo-frame-extractor`** - Frame extraction component

## Dependencies

All packages depend on `quickeditvideo-core` which provides:
- FFmpeg.wasm integration
- Shared UI components (SelectFile, Loading, ControlPanel)
- Video processing utilities

## Usage

Each package exports its main component:

```tsx
import { VideoConverter } from 'quickeditvideo-converter';
import { VideoTrimmer } from 'quickeditvideo-trimmer';
import { FfmpegProvider } from 'quickeditvideo-core';

function App() {
  return (
    <FfmpegProvider>
      <VideoConverter targetFormat="mp4" targetFormatName="MP4" />
    </FfmpegProvider>
  );
}
```