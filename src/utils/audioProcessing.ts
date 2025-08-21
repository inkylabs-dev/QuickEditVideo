/**
 * Audio processing utilities for TTS
 */

/**
 * Apply fadeout to audio data
 * @param audioData Audio data as Float32Array
 * @param sampleRate Sample rate in Hz
 * @param fadeoutDuration Fadeout duration in seconds
 * @returns Audio data with fadeout applied
 */
export function applyFadeout(audioData: Float32Array, sampleRate: number, fadeoutDuration: number): Float32Array {
  const fadeoutSamples = Math.floor(fadeoutDuration * sampleRate);
  const startFade = Math.max(0, audioData.length - fadeoutSamples);
  
  // Create a copy of the audio data
  const processedAudio = new Float32Array(audioData);
  
  // Apply linear fadeout
  for (let i = startFade; i < audioData.length; i++) {
    const fadeProgress = (i - startFade) / fadeoutSamples;
    const fadeMultiplier = 1.0 - fadeProgress;
    processedAudio[i] *= fadeMultiplier;
  }
  
  return processedAudio;
}

/**
 * Join multiple audio segments with optional pause between them
 * @param audioSegments Array of audio data segments
 * @param sampleRate Sample rate in Hz
 * @param pauseDuration Duration of pause between segments in seconds (default: 0.2s)
 * @returns Joined audio data
 */
export function joinAudioSegments(
  audioSegments: Float32Array[], 
  sampleRate: number, 
  pauseDuration: number = 0.2
): Float32Array {
  if (audioSegments.length === 0) {
    return new Float32Array(0);
  }
  
  if (audioSegments.length === 1) {
    return audioSegments[0];
  }
  
  const pauseSamples = Math.floor(pauseDuration * sampleRate);
  
  // Calculate total length
  let totalLength = 0;
  for (const segment of audioSegments) {
    totalLength += segment.length;
  }
  totalLength += pauseSamples * (audioSegments.length - 1); // Add pause between segments
  
  // Create joined audio
  const joinedAudio = new Float32Array(totalLength);
  let offset = 0;
  
  for (let i = 0; i < audioSegments.length; i++) {
    const segment = audioSegments[i];
    
    // Copy segment data
    joinedAudio.set(segment, offset);
    offset += segment.length;
    
    // Add pause between segments (except after the last one)
    if (i < audioSegments.length - 1) {
      // Pause is silence (zeros), so we just skip ahead
      offset += pauseSamples;
    }
  }
  
  return joinedAudio;
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
 * Create WAV blob from Float32Array audio data
 * @param audioData Audio data as Float32Array
 * @param sampleRate Sample rate in Hz
 * @returns WAV blob
 */
function createWavBlob(audioData: Float32Array, sampleRate: number): Blob {
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