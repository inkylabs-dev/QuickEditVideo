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
      sampleRate: 22050
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
      console.log('Generating speech in worker for:', currentItem.text);
      
      // Generate speech using KittenTTS
      const audioData = await kittenTTS.generate(currentItem.text, {
        voice: currentItem.voice,
        speed: currentItem.speed || 1.0,
        language: currentItem.language || 'en-us'
      });
      
      // Create audio URL for playback
      const audioUrl = createAudioUrl(audioData, kittenTTS.getSampleRate());
      
      const response: WorkerResponse = {
        type: 'speech-generated',
        id: currentItem.id,
        audioUrl
      };
      self.postMessage(response);
      
      console.log('Speech generated successfully in worker for:', currentItem.text);
      
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