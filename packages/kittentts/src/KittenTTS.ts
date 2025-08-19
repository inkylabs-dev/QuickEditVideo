import { InferenceSession, env, Tensor } from 'onnxruntime-web';
import { phonemize } from 'phonemizer';
import { TextCleaner } from './TextCleaner.js';

export interface VoiceEmbeddings {
  [voiceId: string]: Float32Array;
}

export interface KittenTTSConfig {
  modelPath?: string;
  voicesPath?: string;
  wasmPaths?: Record<string, string>;
  sampleRate?: number;
}

export interface GenerateOptions {
  voice?: string;
  speed?: number;
  language?: string;
}

/**
 * Available voice options from KittenTTS model
 */
export const VOICE_OPTIONS = [
  { value: 'expr-voice-2-m', label: 'Male Voice 2' },
  { value: 'expr-voice-2-f', label: 'Female Voice 2' },  
  { value: 'expr-voice-3-m', label: 'Male Voice 3' },
  { value: 'expr-voice-3-f', label: 'Female Voice 3' },
  { value: 'expr-voice-4-m', label: 'Male Voice 4' },
  { value: 'expr-voice-4-f', label: 'Female Voice 4' },
  { value: 'expr-voice-5-m', label: 'Male Voice 5' },
  { value: 'expr-voice-5-f', label: 'Female Voice 5' },
] as const;

export type VoiceId = typeof VOICE_OPTIONS[number]['value'];

/**
 * KittenTTS class for browser-based text-to-speech synthesis
 * JavaScript implementation of the Python KittenTTS package
 */
export class KittenTTS {
  private model: InferenceSession | null = null;
  private voices: VoiceEmbeddings = {};
  private textCleaner: TextCleaner;
  private config: Required<KittenTTSConfig>;
  private isLoaded = false;

  constructor(config: KittenTTSConfig = {}) {
    this.config = {
      modelPath: '/tts/kitten_tts_nano_v0_1.onnx',
      voicesPath: '/tts/voices.json',
      wasmPaths: {},
      sampleRate: 22050,
      ...config
    };
    
    this.textCleaner = new TextCleaner();
  }

  /**
   * Configure ONNX Runtime environment with WASM paths
   * @param wasmPaths Object mapping WASM file names to URLs
   */
  configureWasmPaths(wasmPaths: Record<string, string>) {
    this.config.wasmPaths = wasmPaths;
    (env.wasm as any).wasmPaths = wasmPaths;
    
    // Initialize ONNX Runtime environment
    env.wasm.numThreads = 1; // Use single-threaded for compatibility
    env.wasm.simd = true; // Enable SIMD if available
    env.logLevel = 'warning';
    
    console.log('ONNX Runtime environment configured:', {
      wasmPaths: Object.keys(wasmPaths),
      numThreads: env.wasm.numThreads,
      simd: env.wasm.simd
    });
  }

  /**
   * Load the KittenTTS model and voice embeddings
   * @returns Promise that resolves when model is loaded
   */
  async load(): Promise<void> {
    if (this.isLoaded) return;

    console.log('Loading KittenTTS model...');

    try {
      // Load the ONNX model
      console.log('Fetching ONNX model from:', this.config.modelPath);
      const modelResponse = await fetch(this.config.modelPath);
      if (!modelResponse.ok) {
        throw new Error(`Failed to load ONNX model: ${modelResponse.status} ${modelResponse.statusText}`);
      }
      
      const modelBuffer = await modelResponse.arrayBuffer();
      console.log(`Model loaded: ${(modelBuffer.byteLength / 1024 / 1024).toFixed(1)} MB`);
      
      // Create ONNX inference session
      const sessionOptions = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'disabled' as const,
        enableCpuMemArena: false,
        enableMemPattern: false,
        enableProfiling: false,
        logSeverityLevel: 3 as const,
      };

      try {
        this.model = await InferenceSession.create(new Uint8Array(modelBuffer), sessionOptions);
        console.log('ONNX model loaded successfully with WebAssembly backend');
      } catch (wasmError) {
        console.warn('WebAssembly backend failed, trying CPU-only:', wasmError);
        this.model = await InferenceSession.create(new Uint8Array(modelBuffer), {
          executionProviders: ['cpu'],
          graphOptimizationLevel: 'basic'
        });
        console.log('ONNX model loaded with CPU backend');
      }

      // Load voice embeddings
      console.log('Loading voice embeddings from:', this.config.voicesPath);
      const voicesResponse = await fetch(this.config.voicesPath);
      if (!voicesResponse.ok) {
        throw new Error(`Failed to load voice embeddings: ${voicesResponse.status}`);
      }
      
      const voicesData = await voicesResponse.json();
      
      // Convert voices data to Float32Array format
      for (const [voiceId, voiceData] of Object.entries(voicesData)) {
        let flattenedData: number[];
        if (Array.isArray(voiceData) && Array.isArray((voiceData as any)[0])) {
          // Nested array case: [[...]]
          flattenedData = (voiceData as number[][])[0];
        } else if (Array.isArray(voiceData)) {
          // Flat array case: [...]
          flattenedData = voiceData as number[];
        } else {
          console.error(`Invalid voice data format for ${voiceId}:`, voiceData);
          continue;
        }
        
        this.voices[voiceId] = new Float32Array(flattenedData);
        console.log(`Loaded voice ${voiceId}: ${flattenedData.length} dimensions`);
      }

      this.isLoaded = true;
      console.log('KittenTTS model loaded successfully');
      
    } catch (error) {
      console.error('Failed to load KittenTTS model:', error);
      throw error;
    }
  }

  /**
   * Check if the model is loaded
   * @returns True if model is loaded and ready
   */
  isReady(): boolean {
    return this.isLoaded && this.model !== null;
  }

  /**
   * Get available voice IDs
   * @returns Array of available voice IDs
   */
  getAvailableVoices(): string[] {
    return Object.keys(this.voices);
  }

  /**
   * Prepare ONNX model inputs from text and options
   * @param text Input text to synthesize
   * @param options Generation options
   * @returns ONNX model inputs
   */
  private async prepareInputs(text: string, options: GenerateOptions): Promise<Record<string, Tensor>> {
    const { voice = 'expr-voice-2-m', speed = 1.0, language = 'en-us' } = options;
    
    if (!this.voices[voice]) {
      throw new Error(`Voice '${voice}' not available. Choose from: ${this.getAvailableVoices()}`);
    }

    console.log('Preparing inputs for text:', text);

    try {
      // Step 1: Phonemize the text
      console.log('Phonemizing text...');
      const phonemesList = await phonemize(text, language);
      const phonemes = phonemesList[0] || '';
      console.log('Phonemes:', phonemes);
      
      // Step 2: Convert phonemes to token IDs using TextCleaner
      const tokens = this.textCleaner.call(phonemes);
      console.log('TextCleaner tokens before start/end:', tokens);
      
      // Step 3: Add start and end tokens (0)
      tokens.unshift(0); // Add start token
      tokens.push(0);    // Add end token
      
      const tokenIds = new BigInt64Array(tokens.map((id: number) => BigInt(id)));
      console.log('Final tokens with start/end:', Array.from(tokenIds));
      
      // Get voice embedding
      const voiceEmbedding = this.voices[voice];
      console.log(`Using voice ${voice} with ${voiceEmbedding.length} dimensions`);

      // Create ONNX tensor inputs
      return {
        'input_ids': new Tensor('int64', tokenIds, [1, tokenIds.length]),
        'style': new Tensor('float32', voiceEmbedding, [1, voiceEmbedding.length]),
        'speed': new Tensor('float32', new Float32Array([speed]), [1])
      };
      
    } catch (phonemeError) {
      console.warn('Phonemization failed, falling back to TextCleaner:', phonemeError);
      
      // Fallback: Use TextCleaner directly
      const cleanText = this.textCleaner.clean(text);
      const tokens = this.textCleaner.call(cleanText);
      tokens.unshift(0); // Add start token
      tokens.push(0);    // Add end token
      
      const tokenIds = new BigInt64Array(tokens.map((id: number) => BigInt(id)));
      const voiceEmbedding = this.voices[voice];
      
      return {
        'input_ids': new Tensor('int64', tokenIds, [1, tokenIds.length]),
        'style': new Tensor('float32', voiceEmbedding, [1, voiceEmbedding.length]),
        'speed': new Tensor('float32', new Float32Array([speed]), [1])
      };
    }
  }

  /**
   * Generate speech from text
   * @param text Input text to synthesize
   * @param options Generation options
   * @returns Promise that resolves to audio data as Float32Array
   */
  async generate(text: string, options: GenerateOptions = {}): Promise<Float32Array> {
    if (!this.isReady()) {
      throw new Error('KittenTTS model is not loaded. Call load() first.');
    }

    console.log('Generating speech for text:', text);
    
    try {
      // Prepare model inputs
      const inputs = await this.prepareInputs(text, options);
      console.log('ONNX input tensors created successfully');

      // Run inference
      console.log('Running ONNX inference...');
      const startTime = Date.now();
      const results = await this.model!.run(inputs);
      const inferenceTime = Date.now() - startTime;
      console.log(`ONNX inference completed in ${inferenceTime}ms`);
      
      // Extract audio data from model output
      const outputNames = Object.keys(results);
      console.log('Available outputs:', outputNames);
      
      // Find the main audio output tensor (usually the largest)
      let audioTensor = null;
      for (const name of outputNames) {
        const tensor = results[name];
        console.log(`Output '${name}':`, {
          type: tensor.type,
          dims: tensor.dims,
          size: tensor.size
        });
        
        if (!audioTensor || tensor.size > audioTensor.size) {
          audioTensor = tensor;
        }
      }
      
      if (!audioTensor) {
        throw new Error('No audio output found in model results');
      }
      
      // Convert tensor data to Float32Array
      const audioData = new Float32Array(audioTensor.data as Float32Array);
      console.log(`Generated audio: ${audioData.length} samples`);
      
      // Post-process audio: trim silence and normalize
      const trimmedAudio = this.postProcessAudio(audioData);
      console.log(`Audio processing completed: ${(trimmedAudio.length / this.config.sampleRate).toFixed(2)}s`);
      
      return trimmedAudio;
      
    } catch (error) {
      console.error('Failed to generate speech:', error);
      throw error;
    }
  }

  /**
   * Post-process generated audio data
   * @param audioData Raw audio data from model
   * @returns Processed audio data
   */
  private postProcessAudio(audioData: Float32Array): Float32Array {
    // Find non-zero audio content
    let startIdx = 0;
    let endIdx = audioData.length - 1;
    const threshold = 0.001;
    
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
    
    // Trim audio
    let trimmedAudio = audioData;
    if (endIdx > startIdx) {
      trimmedAudio = audioData.slice(startIdx, endIdx + 1);
      console.log(`Trimmed audio from ${audioData.length} to ${trimmedAudio.length} samples`);
    }

    // Normalize audio to prevent clipping
    let maxAmplitude = 0;
    for (let i = 0; i < trimmedAudio.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(trimmedAudio[i]));
    }
    
    if (maxAmplitude > 0) {
      const normalizationFactor = 0.8 / maxAmplitude;
      const normalizedAudio = trimmedAudio.map(sample => sample * normalizationFactor);
      console.log(`Audio normalized with factor ${normalizationFactor.toFixed(3)}`);
      return normalizedAudio;
    }
    
    return trimmedAudio;
  }

  /**
   * Get the sample rate used by the model
   * @returns Sample rate in Hz
   */
  getSampleRate(): number {
    return this.config.sampleRate;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.model) {
      this.model = null;
    }
    this.voices = {};
    this.isLoaded = false;
    console.log('KittenTTS resources disposed');
  }
}