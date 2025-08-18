# FFmpeg Utils

A modular collection of utility functions for common FFmpeg operations.

## Features

- 🎥 **Video Conversion** - Convert between different video formats
- ✂️ **Video Trimming** - Extract specific time segments from videos
- 📐 **Video Resizing** - Change video dimensions
- 🎯 **Video Cropping** - Extract specific regions from videos
- 🔗 **Video Merging** - Combine multiple videos into one
- 💾 **Utility Functions** - Create blobs and download processed videos
- ... (and more)

## Usage

### Import Functions

```typescript
import { convertVideo, trimVideo, resizeVideo, cropVideo, mergeVideos } from '../FFmpegUtils';
```

### Import as Namespace

```typescript
import * as FFmpegUtils from '../FFmpegUtils';

// Use as FFmpegUtils.convertVideo(), etc.
```

## API Reference

### Video Processing Functions

#### `convertVideo(ffmpeg, inputFile, outputFormat, options?)`
Convert a video file to a different format.

**Parameters:**
- `ffmpeg`: FFmpeg instance
- `inputFile`: File object or URL string
- `outputFormat`: Target format (e.g., 'mp4', 'webm', 'avi')
- `options`: Optional FFmpeg arguments array

**Returns:** `Promise<Uint8Array>`

#### `trimVideo(ffmpeg, inputFile, startTime, endTime)`
Extract a specific time segment from a video.

**Parameters:**
- `ffmpeg`: FFmpeg instance
- `inputFile`: File object
- `startTime`: Start time in seconds
- `endTime`: End time in seconds

**Returns:** `Promise<Uint8Array>`

#### `resizeVideo(ffmpeg, inputFile, width, height)`
Resize a video to specific dimensions.

**Parameters:**
- `ffmpeg`: FFmpeg instance
- `inputFile`: File object
- `width`: Target width in pixels
- `height`: Target height in pixels

**Returns:** `Promise<Uint8Array>`

#### `cropVideo(ffmpeg, inputFile, width, height, x?, y?)`
Crop a video to specific dimensions and position.

**Parameters:**
- `ffmpeg`: FFmpeg instance
- `inputFile`: File object
- `width`: Crop width in pixels
- `height`: Crop height in pixels
- `x`: X offset (default: 0)
- `y`: Y offset (default: 0)

**Returns:** `Promise<Uint8Array>`

#### `mergeVideos(ffmpeg, inputFiles)`
Merge multiple videos into one.

**Parameters:**
- `ffmpeg`: FFmpeg instance
- `inputFiles`: Array of File objects

**Returns:** `Promise<Uint8Array>`

### Utility Functions

#### `createVideoBlob(data, mimeType?)`
Create a blob URL from video data.

**Parameters:**
- `data`: Uint8Array video data
- `mimeType`: MIME type (default: 'video/mp4')

**Returns:** `string` (blob URL)

#### `downloadVideo(data, filename, mimeType?)`
Download video data as a file.

**Parameters:**
- `data`: Uint8Array video data
- `filename`: Download filename
- `mimeType`: MIME type (default: 'video/mp4')

**Returns:** `void`

## Examples

### Basic Video Conversion

```typescript
import { convertVideo } from '../FFmpegUtils/convertVideo';

const convertToMp4 = async (ffmpeg: any, file: File) => {
  const result = await convertVideo(ffmpeg, file, 'mp4');
  return result;
};
```

### Video Trimming

```typescript
import { trimVideo } from '../FFmpegUtils/trimVideo';

const extractClip = async (ffmpeg: any, file: File) => {
  // Extract 10 seconds starting from 30 seconds
  const result = await trimVideo(ffmpeg, file, 30, 40);
  return result;
};
```

### Video Processing Pipeline

```typescript
import { trimVideo, resizeVideo, createVideoBlob } from '../FFmpegUtils';

const processVideo = async (ffmpeg: any, file: File) => {
  // Trim video
  const trimmed = await trimVideo(ffmpeg, file, 0, 30);
  
  // Create a temporary file for the next step
  const tempFile = new File([trimmed], 'temp.mp4', { type: 'video/mp4' });
  
  // Resize the trimmed video
  const resized = await resizeVideo(ffmpeg, tempFile, 640, 480);
  
  // Create blob URL for preview
  const blobUrl = createVideoBlob(resized);
  
  return { data: resized, url: blobUrl };
};
```

## Dependencies

- `@ffmpeg/util`: For file handling utilities
- `@ffmpeg/ffmpeg`: Peer dependency for FFmpeg instance