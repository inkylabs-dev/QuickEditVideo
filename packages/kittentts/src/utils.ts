/**
 * Utility functions for audio processing and format conversion
 */

/**
 * Create WAV blob from Float32Array audio data
 * @param audioData Audio data as Float32Array
 * @param sampleRate Sample rate in Hz
 * @returns WAV blob
 */
export function createWavBlob(audioData: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + audioData.length * 2);
  const view = new DataView(buffer);
  
  // WAV header writer helper
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  // Write WAV header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + audioData.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, audioData.length * 2, true);
  
  // Convert float audio data to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Download audio data as WAV file
 * @param audioData Audio data as Float32Array
 * @param sampleRate Sample rate in Hz
 * @param filename Optional filename (default: generated)
 */
export function downloadWav(audioData: Float32Array, sampleRate: number, filename?: string): void {
  const wavBlob = createWavBlob(audioData, sampleRate);
  const url = URL.createObjectURL(wavBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `tts_${Date.now()}.wav`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Create audio URL from Float32Array for playback
 * @param audioData Audio data as Float32Array
 * @param sampleRate Sample rate in Hz
 * @returns Object URL for audio playback
 */
export function createAudioUrl(audioData: Float32Array, sampleRate: number): string {
  const wavBlob = createWavBlob(audioData, sampleRate);
  return URL.createObjectURL(wavBlob);
}

/**
 * Calculate audio duration in seconds
 * @param audioData Audio data as Float32Array
 * @param sampleRate Sample rate in Hz
 * @returns Duration in seconds
 */
export function getAudioDuration(audioData: Float32Array, sampleRate: number): number {
  return audioData.length / sampleRate;
}

/**
 * Normalize audio data to prevent clipping
 * @param audioData Audio data to normalize
 * @param targetLevel Target peak level (0.0 to 1.0)
 * @returns Normalized audio data
 */
export function normalizeAudio(audioData: Float32Array, targetLevel: number = 0.8): Float32Array {
  let maxAmplitude = 0;
  for (let i = 0; i < audioData.length; i++) {
    maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
  }
  
  if (maxAmplitude === 0) return audioData;
  
  const normalizationFactor = targetLevel / maxAmplitude;
  return audioData.map(sample => sample * normalizationFactor);
}

/**
 * Trim silence from the beginning and end of audio
 * @param audioData Audio data to trim
 * @param threshold Silence threshold (0.0 to 1.0)
 * @returns Trimmed audio data
 */
export function trimSilence(audioData: Float32Array, threshold: number = 0.001): Float32Array {
  let startIdx = 0;
  let endIdx = audioData.length - 1;
  
  // Find start of audio
  for (let i = 0; i < audioData.length; i++) {
    if (Math.abs(audioData[i]) > threshold) {
      startIdx = i;
      break;
    }
  }
  
  // Find end of audio
  for (let i = audioData.length - 1; i >= 0; i--) {
    if (Math.abs(audioData[i]) > threshold) {
      endIdx = i;
      break;
    }
  }
  
  if (endIdx > startIdx) {
    return audioData.slice(startIdx, endIdx + 1);
  }
  
  return audioData;
}