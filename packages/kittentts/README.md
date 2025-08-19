# @quickeditvideo/kittentts

JavaScript implementation of KittenTTS for browser-based text-to-speech synthesis. This package provides a clean, TypeScript-compatible API for using KittenTTS ONNX models in web applications.

## Features

- 🎯 **Browser-compatible**: Runs entirely in the browser using WebAssembly
- 🔊 **High-quality TTS**: Uses KittenTTS ONNX models for natural speech synthesis
- 🎵 **Multiple voices**: Supports 8 different voice options (4 male, 4 female)
- 🚀 **TypeScript support**: Full type definitions included
- 📦 **Lightweight**: Minimal dependencies, tree-shakeable
- 🔧 **Configurable**: Customizable model paths, WASM configuration, and audio processing

## Installation

```bash
npm install @quickeditvideo/kittentts
```

## Quick Start

```typescript
import { KittenTTS, createAudioUrl, VOICE_OPTIONS } from '@quickeditvideo/kittentts';

// Initialize KittenTTS
const tts = new KittenTTS();

// Load the model
await tts.load();

// Generate speech
const audioData = await tts.generate('Hello, world!', {
  voice: 'expr-voice-2-m',
  speed: 1.0
});

// Create audio URL for playback
const audioUrl = createAudioUrl(audioData, tts.getSampleRate());

// Play the audio
const audio = new Audio(audioUrl);
audio.play();
```

## API Reference

### KittenTTS

Main class for text-to-speech synthesis.

#### Constructor

```typescript
new KittenTTS(config?: KittenTTSConfig)
```

#### Methods

- `configureWasmPaths(wasmPaths: Record<string, string>)`: Configure ONNX Runtime WASM file paths
- `load(): Promise<void>`: Load the model and voice embeddings
- `isReady(): boolean`: Check if the model is loaded and ready
- `generate(text: string, options?: GenerateOptions): Promise<Float32Array>`: Generate speech from text
- `getAvailableVoices(): string[]`: Get list of available voice IDs
- `getSampleRate(): number`: Get the model's sample rate
- `dispose(): void`: Clean up resources

### TextCleaner

Text processing utility for converting text to token indices.

#### Methods

- `call(text: string): number[]`: Convert text to token indices
- `clean(text: string): string`: Basic text normalization
- `textToTokens(text: string): BigInt64Array`: Convert text to BigInt64Array for ONNX

### Utility Functions

- `createWavBlob(audioData: Float32Array, sampleRate: number): Blob`: Create WAV blob
- `downloadWav(audioData: Float32Array, sampleRate: number, filename?: string): void`: Download as WAV file
- `createAudioUrl(audioData: Float32Array, sampleRate: number): string`: Create object URL for playback
- `getAudioDuration(audioData: Float32Array, sampleRate: number): number`: Calculate duration
- `normalizeAudio(audioData: Float32Array, targetLevel?: number): Float32Array`: Normalize audio
- `trimSilence(audioData: Float32Array, threshold?: number): Float32Array`: Trim silence

## Types

```typescript
interface KittenTTSConfig {
  modelPath?: string;
  voicesPath?: string;
  wasmPaths?: Record<string, string>;
  sampleRate?: number;
}

interface GenerateOptions {
  voice?: string;
  speed?: number;
  language?: string;
}

type VoiceId = 'expr-voice-2-m' | 'expr-voice-2-f' | 'expr-voice-3-m' | 
              'expr-voice-3-f' | 'expr-voice-4-m' | 'expr-voice-4-f' | 
              'expr-voice-5-m' | 'expr-voice-5-f';
```

## Voice Options

The package includes 8 pre-trained voices:

```typescript
import { VOICE_OPTIONS } from '@quickeditvideo/kittentts';

// Available voices:
// - expr-voice-2-m (Male Voice 2)
// - expr-voice-2-f (Female Voice 2)
// - expr-voice-3-m (Male Voice 3)
// - expr-voice-3-f (Female Voice 3)
// - expr-voice-4-m (Male Voice 4)
// - expr-voice-4-f (Female Voice 4)
// - expr-voice-5-m (Male Voice 5)
// - expr-voice-5-f (Female Voice 5)
```

## Requirements

- Modern browser with WebAssembly support
- ONNX Runtime Web (peer dependency)
- KittenTTS ONNX model file
- Voice embeddings JSON file

## License

MIT

## Credits

- [KittenTTS Python package](https://github.com/KittenML/KittenTTS/) - Original Python implementation
- [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html) - WebAssembly ML inference
- [phonemizer.js](https://github.com/xenova/phonemizer.js) - Text-to-phoneme conversion