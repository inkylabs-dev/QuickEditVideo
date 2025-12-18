import { InferenceSession, env, Tensor } from 'onnxruntime-web';
import { phonemize } from './phonemizerStub.js';
import { TextCleaner, cleanTextForTTS, chunkText } from './TextCleaner.js';
import { 
  getEmbeddedModel, 
  getEmbeddedVoices, 
  hasEmbeddedAssets,
  EMBEDDED_VOICES 
} from './embeddedAssets.js';

export interface VoiceEmbeddings {
  [voiceId: string]: Float32Array;
}

export interface KittenTTSConfig {
  modelPath?: string;
  voicesPath?: string;
  wasmPaths?: Record<string, string>;
  sampleRate?: number;
  useEmbeddedAssets?: boolean;
  verbose?: boolean;
  enableBrowserCache?: boolean;
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
 * Simple IndexedDB cache for model files
 */
class ModelCache {
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor() {
    this.dbName = 'kitten-tts-cache';
    this.storeName = 'models';
    this.version = 1;
  }

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async get(key: string): Promise<ArrayBuffer | null> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache is still valid (7 days)
          const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
          if (Date.now() - result.timestamp < maxAge) {
            resolve(result.data);
            return;
          } else {
            // Cache expired, remove it
            this.delete(key);
          }
        }
        resolve(null);
      };
    });
  }

  async set(key: string, data: ArrayBuffer): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({
        key,
        data,
        timestamp: Date.now()
      });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(key: string): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(key);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

/**
 * Mapping from named voice IDs to numeric voice IDs in the model
 */
const VOICE_ID_MAPPING: Record<string, string> = {
  'expr-voice-2-m': '0',
  'expr-voice-2-f': '1',
  'expr-voice-3-m': '2',
  'expr-voice-3-f': '3',
  'expr-voice-4-m': '4',
  'expr-voice-4-f': '5',
  'expr-voice-5-m': '6',
  'expr-voice-5-f': '7',
};

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
  private modelCache: ModelCache;

  constructor(config: KittenTTSConfig = {}) {
    this.config = {
      modelPath: '/tts/kitten_tts_nano_v0_1.onnx',
      voicesPath: '/tts/voices.json',
      wasmPaths: {},
      sampleRate: 22050,
      useEmbeddedAssets: true,
      verbose: true,
      enableBrowserCache: false,
      ...config
    };
    
    this.textCleaner = new TextCleaner();
    this.modelCache = new ModelCache();
  }

  /**
   * Log messages only when verbose mode is enabled
   * @param message Message to log
   * @param optionalParams Additional parameters
   */
  private log(message?: any, ...optionalParams: any[]): void {
    if (this.config.verbose) {
      console.log(message, ...optionalParams);
    }
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
    
    this.log('ONNX Runtime environment configured:', {
      wasmPaths: Object.keys(wasmPaths),
      numThreads: env.wasm.numThreads,
      simd: env.wasm.simd
    });
  }

  /**
   * Save model buffer to IndexedDB cache
   * @param modelBuffer The model buffer to cache
   */
  private async saveModelToCache(modelBuffer: ArrayBuffer): Promise<void> {
    if (!this.config.enableBrowserCache) return;
    
    try {
      const cacheKey = 'kitten_tts_model';
      await this.modelCache.set(cacheKey, modelBuffer);
      this.log(`Model cached to IndexedDB: ${(modelBuffer.byteLength / 1024 / 1024).toFixed(1)} MB`);
    } catch (error) {
      console.warn('Failed to cache model to IndexedDB:', error);
    }
  }

  /**
   * Load model buffer from IndexedDB cache
   * @returns The cached model buffer or null if not found
   */
  private async loadModelFromCache(): Promise<ArrayBuffer | null> {
    if (!this.config.enableBrowserCache) return null;
    
    try {
      const cacheKey = 'kitten_tts_model';
      const modelBuffer = await this.modelCache.get(cacheKey);
      
      if (modelBuffer) {
        this.log(`Model loaded from IndexedDB cache: ${(modelBuffer.byteLength / 1024 / 1024).toFixed(1)} MB`);
      } else {
        this.log('No cached model found in IndexedDB');
      }
      
      return modelBuffer;
    } catch (error) {
      console.warn('Failed to load model from IndexedDB cache:', error);
      return null;
    }
  }

  /**
   * Load the KittenTTS model and voice embeddings
   * @returns Promise that resolves when model is loaded
   */
  async load(): Promise<void> {
    if (this.isLoaded) return;

    this.log('Loading KittenTTS model...');

    try {
      let modelBuffer: ArrayBuffer | null = null;
      
      // Try to load from IndexedDB cache first
      if (this.config.enableBrowserCache) {
        this.log('Checking IndexedDB cache for model...');
        modelBuffer = await this.loadModelFromCache();
      }
      
      // If not in cache, load from embedded assets or fetch
      if (!modelBuffer) {
        // Check if we should use embedded assets
        if (this.config.useEmbeddedAssets && hasEmbeddedAssets()) {
          this.log('Using embedded ONNX model...');
          modelBuffer = getEmbeddedModel();
          this.log(`Embedded model loaded: ${(modelBuffer.byteLength / 1024 / 1024).toFixed(1)} MB`);
        } else {
          // Fallback to fetch
          this.log('Fetching ONNX model from:', this.config.modelPath);
          const modelResponse = await fetch(this.config.modelPath);
          if (!modelResponse.ok) {
            throw new Error(`Failed to load ONNX model: ${modelResponse.status} ${modelResponse.statusText}`);
          }
          
          modelBuffer = await modelResponse.arrayBuffer();
          this.log(`Model loaded: ${(modelBuffer.byteLength / 1024 / 1024).toFixed(1)} MB`);
        }
        
        // Cache the model buffer for future use
        if (modelBuffer && this.config.enableBrowserCache) {
          await this.saveModelToCache(modelBuffer);
          this.log(`Model saved: ${(modelBuffer.byteLength / 1024 / 1024).toFixed(1)} MB`);
        }
      }
      
      if (!modelBuffer) {
        throw new Error('Failed to load model buffer from any source');
      }
      
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
        this.log('ONNX model loaded successfully with WebAssembly backend');
      } catch (wasmError) {
        console.warn('WebAssembly backend failed, trying CPU-only:', wasmError);
        this.model = await InferenceSession.create(new Uint8Array(modelBuffer), {
          executionProviders: ['cpu'],
          graphOptimizationLevel: 'basic'
        });
        this.log('ONNX model loaded with CPU backend');
      }

      // Load voice embeddings
      if (this.config.useEmbeddedAssets && hasEmbeddedAssets()) {
        this.log('Using embedded voice embeddings...');
        const voicesData = getEmbeddedVoices();
        
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
          this.log(`Loaded voice ${voiceId}: ${flattenedData.length} dimensions`);
        }
      } else {
        // Fallback to fetch
        this.log('Loading voice embeddings from:', this.config.voicesPath);
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
          this.log(`Loaded voice ${voiceId}: ${flattenedData.length} dimensions`);
        }
      }

      this.isLoaded = true;
      this.log('KittenTTS model loaded successfully');
      
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
    return Object.keys(VOICE_ID_MAPPING);
  }

  /**
   * Prepare ONNX model inputs from text and options
   * @param text Input text to synthesize
   * @param options Generation options
   * @returns ONNX model inputs
   */
  private async prepareInputs(text: string, options: GenerateOptions): Promise<Record<string, Tensor>> {
    const { voice = 'expr-voice-2-m', speed = 1.0, language = 'en-us' } = options;
    
    // Map named voice ID to numeric voice ID
    const numericVoiceId = VOICE_ID_MAPPING[voice];
    if (!numericVoiceId) {
      throw new Error(`Voice '${voice}' not available. Choose from: ${Object.keys(VOICE_ID_MAPPING).join(', ')}`);
    }
    
    if (!this.voices[numericVoiceId]) {
      throw new Error(`Voice '${voice}' not available. Choose from: ${this.getAvailableVoices()}`);
    }

    this.log('Preparing inputs for text:', text);

    try {
      // Step 1: Phonemize the text
      this.log('Phonemizing text...');
      const phonemesList = await phonemize(text, language);
      const phonemes = phonemesList.join('') || '';
      this.log('Phonemes:', phonemes);
      
      // Step 2: Add boundary markers to phonemes (like in working example)
      const tokensWithBoundaries = `${phonemes}`;
      this.log('Phonemes with boundaries:', tokensWithBoundaries);
      
      // Step 3: Convert phonemes to token IDs using TextCleaner
      const tokens = this.textCleaner.call(tokensWithBoundaries);
      this.log('TextCleaner tokens before start/end:', tokens);
      
      // Step 4: Add start and end tokens (0)
      tokens.unshift(0); // Add start token
      tokens.push(0);    // Add end token
      
      const tokenIds = new BigInt64Array(tokens.map((id: number) => BigInt(id)));
      this.log('Final tokens with start/end:', Array.from(tokenIds));
      
      // Get voice embedding
      const voiceEmbedding = this.voices[numericVoiceId];
      this.log(`Using voice ${voice} (${numericVoiceId}) with ${voiceEmbedding.length} dimensions`);

      // Create ONNX tensor inputs
      return {
        'input_ids': new Tensor('int64', tokenIds, [1, tokenIds.length]),
        'style': new Tensor('float32', voiceEmbedding, [1, voiceEmbedding.length]),
        'speed': new Tensor('float32', new Float32Array([speed]), [1])
      };
      
      } catch (phonemeError) {
      console.warn('Phonemization failed, falling back to TextCleaner:', phonemeError);
      
      // Fallback: Use TextCleaner directly on cleaned text
      const cleanText = this.textCleaner.clean(text);
      const tokens = this.textCleaner.call(cleanText);
      tokens.unshift(0); // Add start token
      tokens.push(0);    // Add end token
      
      const tokenIds = new BigInt64Array(tokens.map((id: number) => BigInt(id)));
      const voiceEmbedding = this.voices[numericVoiceId];
      
      return {
        'input_ids': new Tensor('int64', tokenIds, [1, tokenIds.length]),
        'style': new Tensor('float32', voiceEmbedding, [1, voiceEmbedding.length]),
        'speed': new Tensor('float32', new Float32Array([speed]), [1])
      };
    }
  }

  /**
   * Generate speech from text with automatic chunking for long texts
   * @param text Input text to synthesize
   * @param options Generation options
   * @returns Promise that resolves to audio data as Float32Array
   */
  async generate(text: string, options: GenerateOptions = {}): Promise<Float32Array> {
    if (!this.isReady()) {
      throw new Error('KittenTTS model is not loaded. Call load() first.');
    }

    this.log('Generating speech for text:', text);
    
    // Clean the text first
    const cleanedText = cleanTextForTTS(text);
    this.log('Cleaned text:', cleanedText);
    
    // Check if text needs chunking (longer than 400 characters)
    if (cleanedText.length > 400) {
      this.log('Text is long, using chunked generation');
      return this.generateChunked(cleanedText, options);
    }
    
    // For shorter text, use direct generation
    return this.generateSingle(cleanedText, options);
  }

  /**
   * Generate speech for a single chunk of text
   * @param text Input text to synthesize (should be pre-cleaned)
   * @param options Generation options
   * @returns Promise that resolves to audio data as Float32Array
   */
  private async generateSingle(text: string, options: GenerateOptions = {}): Promise<Float32Array> {
    try {
      // Prepare model inputs
      const inputs = await this.prepareInputs(text, options);
      this.log('ONNX input tensors created successfully');

      // Run inference
      this.log('Running ONNX inference...');
      const startTime = Date.now();
      const results = await this.model!.run(inputs);
      const inferenceTime = Date.now() - startTime;
      this.log(`ONNX inference completed in ${inferenceTime}ms`);
      
      // Extract audio data from model output
      const outputNames = Object.keys(results);
      this.log('Available outputs:', outputNames);
      
      // Find the main audio output tensor (usually the largest)
      let audioTensor = null;
      for (const name of outputNames) {
        const tensor = results[name];
        this.log(`Output '${name}':`, {
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
      this.log(`Generated audio: ${audioData.length} samples`);
      
      // Post-process audio: trim silence and normalize
      const trimmedAudio = this.postProcessAudio(audioData);
      this.log(`Audio processing completed: ${(trimmedAudio.length / this.config.sampleRate).toFixed(2)}s`);
      
      return trimmedAudio;
      
    } catch (error) {
      console.error('Failed to generate speech:', error);
      throw error;
    }
  }

  /**
   * Generate speech for long text by chunking and concatenating audio
   * @param text Input text to synthesize (should be pre-cleaned)
   * @param options Generation options
   * @returns Promise that resolves to concatenated audio data as Float32Array
   */
  private async generateChunked(text: string, options: GenerateOptions = {}): Promise<Float32Array> {
    const chunks = chunkText(text);
    this.log(`Split text into ${chunks.length} chunks`);
    
    const audioChunks: Float32Array[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      this.log(`Processing chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 50)}..."`);
      
      try {
        const chunkAudio = await this.generateSingle(chunk, options);
        audioChunks.push(chunkAudio);
        
        // Add a small pause between chunks (100ms of silence)
        if (i < chunks.length - 1) {
          const pauseSamples = Math.floor(this.config.sampleRate * 0.1); // 100ms pause
          const pause = new Float32Array(pauseSamples);
          audioChunks.push(pause);
        }
        
      } catch (error) {
        console.error(`Failed to generate audio for chunk ${i + 1}:`, error);
        // Continue with other chunks rather than failing completely
      }
    }
    
    if (audioChunks.length === 0) {
      throw new Error('Failed to generate audio for any text chunks');
    }
    
    // Concatenate all audio chunks
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const concatenatedAudio = new Float32Array(totalLength);
    
    let offset = 0;
    for (const chunk of audioChunks) {
      concatenatedAudio.set(chunk, offset);
      offset += chunk.length;
    }
    
    this.log(`Concatenated ${audioChunks.length} audio chunks into ${concatenatedAudio.length} samples`);
    this.log(`Total audio duration: ${(concatenatedAudio.length / this.config.sampleRate).toFixed(2)}s`);
    
    return concatenatedAudio;
  }

  /**
   * Post-process generated audio data
   * @param audioData Raw audio data from model
   * @returns Processed audio data
   */
  private postProcessAudio(audioData: Float32Array): Float32Array {
    // Clean up NaN values first (like in working example)
    let hasNaN = false;
    let maxAmplitude = 0;
    for (let i = 0; i < audioData.length; i++) {
      if (isNaN(audioData[i])) {
        audioData[i] = 0; // Replace NaN with silence
        hasNaN = true;
      } else {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(audioData[i]));
      }
    }
    
    if (hasNaN) {
      this.log('Cleaned NaN values from audio data');
    }

    // Find non-zero audio content for trimming
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
      this.log(`Trimmed audio from ${audioData.length} to ${trimmedAudio.length} samples`);
    }

    // Normalize audio if it's too quiet (like in working example)
    if (maxAmplitude > 0 && maxAmplitude < 0.1) {
      const normalizationFactor = 0.5 / maxAmplitude;
      for (let i = 0; i < trimmedAudio.length; i++) {
        trimmedAudio[i] *= normalizationFactor;
      }
      this.log(`Audio normalized for low volume with factor ${normalizationFactor.toFixed(3)}`);
    } else if (maxAmplitude > 0) {
      // Standard normalization to prevent clipping
      const normalizationFactor = 0.8 / maxAmplitude;
      const normalizedAudio = new Float32Array(trimmedAudio.length);
      for (let i = 0; i < trimmedAudio.length; i++) {
        normalizedAudio[i] = trimmedAudio[i] * normalizationFactor;
      }
      this.log(`Audio normalized with factor ${normalizationFactor.toFixed(3)}`);
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
    this.log('KittenTTS resources disposed');
  }

  /**
   * Clear the IndexedDB cache
   * @returns Promise that resolves when cache is cleared
   */
  async clearCache(): Promise<void> {
    if (!this.config.enableBrowserCache) return;
    
    try {
      await this.modelCache.clear();
      this.log('IndexedDB cache cleared successfully');
    } catch (error) {
      console.warn('Failed to clear IndexedDB cache:', error);
    }
  }
}
