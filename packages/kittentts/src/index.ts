/**
 * @quickeditvideo/kittentts
 * 
 * JavaScript implementation of KittenTTS for browser-based text-to-speech synthesis
 * Compatible with the Python KittenTTS package
 */

export { KittenTTS } from './KittenTTS.js';
export { TextCleaner, cleanTextForTTS } from './TextCleaner.js';
export {
  createWavBlob,
  downloadWav,
  createAudioUrl,
  getAudioDuration,
  normalizeAudio,
  trimSilence
} from './utils.js';

export type {
  VoiceEmbeddings,
  KittenTTSConfig,
  GenerateOptions,
  VoiceId
} from './KittenTTS.js';

export { VOICE_OPTIONS } from './KittenTTS.js';