/**
 * TextToSpeechWorker.ts
 * 
 * Web Worker for handling text-to-speech generation using KittenTTS
 * Manages the generation queue and runs in a separate thread to avoid blocking the main UI
 */

import { KittenTTS, type VoiceId } from '@quickeditvideo/kittentts';
import { splitTextForPauses, hasPauseMarkers } from '../utils/textProcessing';
import { applyFadeout, joinAudioSegments, createAudioUrl } from '../utils/audioProcessing';

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
  supportPauses?: boolean; // Whether to process pauses in text
}

interface GenerateSpeechEvent {
  type: 'generate-speech';
  data: QueueItem;
}

interface WorkerResponse {
  type: 'speech-generated' | 'speech-error' | 'model-loaded' | 'model-error' | 'queue-updated' | 'segment-progress';
  id?: string;
  audioUrl?: string;
  error?: string;
  queueLength?: number;
  processing?: boolean;
  segmentIndex?: number;
  totalSegments?: number;
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
      let finalAudioData: Float32Array;
      
      // Check if text should be processed for pauses
      if (currentItem.supportPauses && hasPauseMarkers(currentItem.text)) {
        // Split text into segments
        const textSegments = splitTextForPauses(currentItem.text);
        const audioSegments: Float32Array[] = [];
        
        // Generate audio for each segment
        for (let i = 0; i < textSegments.length; i++) {
          const segment = textSegments[i];
          
          // Notify UI about segment progress
          self.postMessage({
            type: 'segment-progress',
            id: currentItem.id,
            segmentIndex: i + 1,
            totalSegments: textSegments.length
          } as WorkerResponse);
          
          // Generate speech for this segment
          let segmentAudio = await kittenTTS.generate(segment, {
            voice: currentItem.voice,
            speed: currentItem.speed || 1.0,
            language: currentItem.language || 'en-us'
          });
          
          // Apply fadeout to each segment (default 0.2s for pauses)
          const fadeoutDuration = currentItem.fadeout || 0.2;
          segmentAudio = applyFadeout(segmentAudio, kittenTTS.getSampleRate(), fadeoutDuration);
          
          audioSegments.push(segmentAudio);
        }
        
        // Join all segments with pauses
        finalAudioData = joinAudioSegments(audioSegments, kittenTTS.getSampleRate(), 0.2);
      } else {
        // Single segment processing (original behavior)
        finalAudioData = await kittenTTS.generate(currentItem.text, {
          voice: currentItem.voice,
          speed: currentItem.speed || 1.0,
          language: currentItem.language || 'en-us'
        });
        
        // Apply fadeout if specified
        if (currentItem.fadeout && currentItem.fadeout > 0) {
          finalAudioData = applyFadeout(finalAudioData, kittenTTS.getSampleRate(), currentItem.fadeout);
        }
      }
      
      // Create audio URL for playback
      const audioUrl = createAudioUrl(finalAudioData, kittenTTS.getSampleRate());
      
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