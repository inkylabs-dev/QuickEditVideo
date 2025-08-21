/**
 * TextToSpeechWorker.ts
 * 
 * Web Worker for handling text-to-speech generation using KittenTTS
 * Manages the generation queue and runs in a separate thread to avoid blocking the main UI
 */

import { KittenTTS, createAudioUrl, type VoiceId } from '@quickeditvideo/kittentts';

// Use vite-plugin-wasm for WASM imports via alias
import ortWasmSimdThreadedUrl from '@onnx-wasm/ort-wasm-simd-threaded.wasm?url';
import ortWasmSimdThreadedJsepUrl from '@onnx-wasm/ort-wasm-simd-threaded.jsep.wasm?url';

interface QueueItem {
  id: string;
  text: string;
  voice: VoiceId;
  speed?: number;
  language?: string;
  fadeout?: number; // Fadeout duration in seconds
}

interface GenerateSpeechEvent {
  type: 'generate-speech';
  data: QueueItem;
}

interface WorkerResponse {
  type: 'speech-generated' | 'speech-error' | 'model-loaded' | 'model-error' | 'queue-updated';
  id?: string;
  audioUrl?: string;
  error?: string;
  queueLength?: number;
  processing?: boolean;
}

let kittenTTS: KittenTTS | null = null;
let isModelReady = false;
let processingQueue: QueueItem[] = [];
let isProcessing = false;

// Initialize KittenTTS model
async function initializeModel(): Promise<void> {
  try {
    kittenTTS = new KittenTTS({
      sampleRate: 22050,
      enableBrowserCache: true
    });

    // Configure WASM paths
    kittenTTS.configureWasmPaths({
      'ort-wasm-simd-threaded.wasm': ortWasmSimdThreadedUrl,
      'ort-wasm-simd-threaded.jsep.wasm': ortWasmSimdThreadedJsepUrl,
      // Create fallback aliases
      'ort-wasm.wasm': ortWasmSimdThreadedUrl,
      'ort-wasm-threaded.wasm': ortWasmSimdThreadedUrl,
      'ort-wasm-simd.wasm': ortWasmSimdThreadedUrl,
    });

    // Load the model
    await kittenTTS.load();
    isModelReady = true;
    
    const response: WorkerResponse = {
      type: 'model-loaded'
    };
    self.postMessage(response);
    
    console.log('KittenTTS model loaded successfully in worker');
    
    // Start processing any queued items
    processQueue();
    
  } catch (error) {
    console.error('Failed to load KittenTTS model in worker:', error);
    
    const response: WorkerResponse = {
      type: 'model-error',
      error: error instanceof Error ? error.message : 'Failed to load KittenTTS model'
    };
    self.postMessage(response);
  }
}

// Add item to queue and start processing
function addToQueue(item: QueueItem): void {
  processingQueue.push(item);
  
  // Notify UI about queue update
  self.postMessage({
    type: 'queue-updated',
    queueLength: processingQueue.length,
    processing: isProcessing
  } as WorkerResponse);
  
  // Start processing if not already processing
  if (!isProcessing) {
    processQueue();
  }
}

// Process the queue
async function processQueue(): Promise<void> {
  if (!isModelReady || !kittenTTS || isProcessing || processingQueue.length === 0) {
    return;
  }

  isProcessing = true;
  
  // Notify UI that processing started
  self.postMessage({
    type: 'queue-updated',
    queueLength: processingQueue.length,
    processing: true
  } as WorkerResponse);

  while (processingQueue.length > 0) {
    const currentItem = processingQueue.shift()!;
    
    try {
      // Generate speech using KittenTTS
      let audioData = await kittenTTS.generate(currentItem.text, {
        voice: currentItem.voice,
        speed: currentItem.speed || 1.0,
        language: currentItem.language || 'en-us'
      });
      
      // Apply simple fadeout if specified (using audio processing, not FFmpeg)
      if (currentItem.fadeout && currentItem.fadeout > 0) {
        audioData = applySimpleFadeout(audioData, kittenTTS.getSampleRate(), currentItem.fadeout);
      }
      
      // Create audio URL for playback
      const audioUrl = createAudioUrl(audioData, kittenTTS.getSampleRate());
      
      const response: WorkerResponse = {
        type: 'speech-generated',
        id: currentItem.id,
        audioUrl
      };
      self.postMessage(response);
      
    } catch (error) {
      console.error('Failed to generate speech in worker:', error);
      
      const response: WorkerResponse = {
        type: 'speech-error',
        id: currentItem.id,
        error: error instanceof Error ? error.message : 'Failed to generate speech'
      };
      self.postMessage(response);
    }
    
    // Update queue status
    self.postMessage({
      type: 'queue-updated',
      queueLength: processingQueue.length,
      processing: processingQueue.length > 0
    } as WorkerResponse);
  }

  isProcessing = false;
  
  // Final queue update
  self.postMessage({
    type: 'queue-updated',
    queueLength: 0,
    processing: false
  } as WorkerResponse);
}

// Simple fadeout function using direct audio manipulation
function applySimpleFadeout(audioData: Float32Array, sampleRate: number, fadeoutDuration: number): Float32Array {
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

// Listen for messages from the main thread
self.addEventListener('message', async (e) => {
  const event = e.data as GenerateSpeechEvent;
  
  switch (event.type) {
    case 'generate-speech':
      addToQueue(event.data);
      break;
    default:
      console.warn('Unknown event type received in worker:', event.type);
      break;
  }
});

// Initialize the model when the worker starts
initializeModel();

// Export types for use in main thread
export type { GenerateSpeechEvent, WorkerResponse, QueueItem };