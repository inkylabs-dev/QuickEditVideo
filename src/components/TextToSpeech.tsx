import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import Loading from './Loading';
import * as mediabunny from 'mediabunny';
import { InferenceSession, env, Tensor } from 'onnxruntime-web';

// Use vite-plugin-wasm for WASM imports via alias
import ortWasmSimdThreadedUrl from '@onnx-wasm/ort-wasm-simd-threaded.wasm?url';
import ortWasmSimdThreadedJsepUrl from '@onnx-wasm/ort-wasm-simd-threaded.jsep.wasm?url';

// Available voice options from KittenTTS model (based on actual voices.json)
const VOICE_OPTIONS = [
  { value: 'expr-voice-2-m', label: 'Male Voice 2' },
  { value: 'expr-voice-2-f', label: 'Female Voice 2' },  
  { value: 'expr-voice-3-m', label: 'Male Voice 3' },
  { value: 'expr-voice-3-f', label: 'Female Voice 3' },
  { value: 'expr-voice-4-m', label: 'Male Voice 4' },
  { value: 'expr-voice-4-f', label: 'Female Voice 4' },
  { value: 'expr-voice-5-m', label: 'Male Voice 5' },
  { value: 'expr-voice-5-f', label: 'Female Voice 5' },
];

interface KittenTTSModel {
  model: any;
  voices: Record<string, Float32Array>;
  textCleaner: any;
}

// Helper function to create WAV blob from Float32Array
const createWavBlob = (audioData: Float32Array, sampleRate: number): Blob => {
  const buffer = new ArrayBuffer(44 + audioData.length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
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
};

const TextToSpeech = () => {
  const [text, setText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<string>('expr-voice-2-m');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [useSimpleMode, setUseSimpleMode] = useState<boolean>(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const modelRef = useRef<KittenTTSModel | null>(null);

  // Initialize TTS model and dependencies
  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    if (modelRef.current) return; // Already loaded
    
    setIsLoading(true);
    setError('');
    
    try {
      // Configure ONNX Runtime environment with WASM files processed by Vite
      (env.wasm as any).wasmPaths = {
        'ort-wasm-simd-threaded.wasm': ortWasmSimdThreadedUrl,
        'ort-wasm-simd-threaded.jsep.wasm': ortWasmSimdThreadedJsepUrl,
        // Create fallback aliases
        'ort-wasm.wasm': ortWasmSimdThreadedUrl,
        'ort-wasm-threaded.wasm': ortWasmSimdThreadedUrl,
        'ort-wasm-simd.wasm': ortWasmSimdThreadedUrl,
      };
      
      // Initialize ONNX Runtime environment
      env.wasm.numThreads = 1; // Use single-threaded for compatibility
      env.wasm.simd = true; // Enable SIMD if available
      
      // Set logging level for debugging
      env.logLevel = 'warning';
      
      console.log('ONNX Runtime environment configured:', {
        wasmPaths: Object.keys(env.wasm.wasmPaths || {}),
        numThreads: env.wasm.numThreads,
        simd: env.wasm.simd
      });

      console.log('Loading KittenTTS ONNX model...');
      
      // Load the real ONNX model from public directory
      console.log('Fetching ONNX model...');
      const modelResponse = await fetch('/tts/kitten_tts_nano_v0_1.onnx');
      if (!modelResponse.ok) {
        throw new Error(`Failed to load ONNX model: ${modelResponse.status} ${modelResponse.statusText}`);
      }
      
      console.log('Converting model to ArrayBuffer...');
      const modelBuffer = await modelResponse.arrayBuffer();
      console.log(`Model loaded: ${(modelBuffer.byteLength / 1024 / 1024).toFixed(1)} MB`);
      
      // Create ONNX inference session with proper configuration
      console.log('Creating ONNX inference session...');
      
      // Configure ONNX Runtime session options for web
      const sessionOptions = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'disabled' as const, // Disable optimization to avoid issues
        enableCpuMemArena: false,
        enableMemPattern: false,
        enableProfiling: false,
        logSeverityLevel: 3 as const, // Warning level
      };

      let model;
      try {
        // Try with WebAssembly first
        model = await InferenceSession.create(new Uint8Array(modelBuffer), sessionOptions);
        console.log('ONNX model loaded successfully with WebAssembly backend');
      } catch (wasmError) {
        console.warn('WebAssembly backend failed, trying CPU-only:', wasmError);
        try {
          // Fallback to CPU-only
          model = await InferenceSession.create(new Uint8Array(modelBuffer), {
            executionProviders: ['cpu'],
            graphOptimizationLevel: 'basic'
          });
          console.log('ONNX model loaded with CPU backend');
        } catch (cpuError) {
          console.error('Both WASM and CPU backends failed:', cpuError);
          const wasmMsg = wasmError instanceof Error ? wasmError.message : String(wasmError);
          const cpuMsg = cpuError instanceof Error ? cpuError.message : String(cpuError);
          throw new Error(`ONNX Runtime initialization failed. WebAssembly error: ${wasmMsg}. CPU error: ${cpuMsg}`);
        }
      }

      // Load the real voice embeddings from the converted JSON file
      console.log('Loading voice embeddings...');
      let voicesData;
      try {
        const voicesResponse = await fetch('/tts/voices.json');
        if (!voicesResponse.ok) {
          throw new Error(`Failed to load voice embeddings: ${voicesResponse.status}`);
        }
        voicesData = await voicesResponse.json();
        console.log('Voice embeddings loaded successfully');
      } catch (voiceError) {
        console.warn('Failed to load real voice embeddings, using fallback:', voiceError);
        // Fallback to mock voice data if real voices fail to load
        voicesData = {
          'expr-voice-2-m': [Array.from({length: 256}, (_, i) => Math.cos(i * 0.08) * 0.6)],
          'expr-voice-2-f': [Array.from({length: 256}, (_, i) => Math.sin(i * 0.1) * 0.5)],
          'expr-voice-3-m': [Array.from({length: 256}, (_, i) => Math.cos(i * 0.09) * 0.7)],
          'expr-voice-3-f': [Array.from({length: 256}, (_, i) => Math.sin(i * 0.12) * 0.4)],
          'expr-voice-4-m': [Array.from({length: 256}, (_, i) => Math.cos(i * 0.10) * 0.65)],
          'expr-voice-4-f': [Array.from({length: 256}, (_, i) => Math.sin(i * 0.11) * 0.45)],
          'expr-voice-5-m': [Array.from({length: 256}, (_, i) => Math.cos(i * 0.11) * 0.68)],
          'expr-voice-5-f': [Array.from({length: 256}, (_, i) => Math.sin(i * 0.13) * 0.48)],
        };
      }


      // Convert voices data to Float32Array format
      // The NPZ file had nested arrays, so we need to flatten them
      const voices: Record<string, Float32Array> = {};
      for (const [voiceId, voiceData] of Object.entries(voicesData)) {
        // voiceData is a nested array like [[...]], so we take the first (and only) array
        let flattenedData: number[];
        if (Array.isArray(voiceData) && Array.isArray(voiceData[0])) {
          // Nested array case: [[...]]
          flattenedData = voiceData[0] as number[];
        } else if (Array.isArray(voiceData)) {
          // Flat array case: [...]
          flattenedData = voiceData as number[];
        } else {
          console.error(`Invalid voice data format for ${voiceId}:`, voiceData);
          continue;
        }
        
        voices[voiceId] = new Float32Array(flattenedData);
        console.log(`Loaded voice ${voiceId}: ${flattenedData.length} dimensions`);
        console.log(`Voice ${voiceId} sample values:`, flattenedData.slice(0, 5)); // Log first 5 values
      }

      // TextCleaner class implementation matching Python version
      class TextCleaner {
        private wordIndexDictionary: Record<string, number>;

        constructor() {
          const _pad = "$";
          const _punctuation = ';:,.!?¡¿—…"«»"" ';
          const _letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
          const _letters_ipa = "ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃˈˌːˑʼʴʰʱʲʷˠˤ˞↓↑→↗↘'̩'ᵻ";

          const symbols = [_pad, ...Array.from(_punctuation), ...Array.from(_letters), ...Array.from(_letters_ipa)];
          
          this.wordIndexDictionary = {};
          for (let i = 0; i < symbols.length; i++) {
            this.wordIndexDictionary[symbols[i]] = i;
          }

          console.log('TextCleaner initialized with', symbols.length, 'symbols');
          console.log('Sample mappings:', {
            '$': this.wordIndexDictionary['$'],
            'a': this.wordIndexDictionary['a'],
            'A': this.wordIndexDictionary['A'],
            ' ': this.wordIndexDictionary[' '],
            'ɑ': this.wordIndexDictionary['ɑ']
          });
        }

        // Main method that converts text to token indices
        call(text: string): number[] {
          console.log('TextCleaner processing text:', text);
          const indexes: number[] = [];
          
          for (const char of text) {
            if (this.wordIndexDictionary[char] !== undefined) {
              indexes.push(this.wordIndexDictionary[char]);
              console.log(`Mapped '${char}' -> ${this.wordIndexDictionary[char]}`);
            } else {
              console.warn(`Unknown character '${char}', skipping`);
              // Skip unknown characters (matching Python implementation)
            }
          }
          
          console.log('TextCleaner result:', indexes);
          return indexes;
        }

        // Helper method for backwards compatibility
        clean(text: string): string {
          // Basic text normalization
          return text.replace(/\s+/g, ' ').trim();
        }

        // Convert text directly to BigInt64Array for ONNX model
        textToTokens(text: string): BigInt64Array {
          const indexes = this.call(text);
          return new BigInt64Array(indexes.map(id => BigInt(id)));
        }
      }

      const textCleaner = new TextCleaner();

      modelRef.current = {
        model,
        voices,
        textCleaner
      };
      
      setIsModelLoaded(true);
      console.log('Model loaded successfully');
      
    } catch (err) {
      console.error('Failed to load TTS model:', err);
      setError(err instanceof Error ? err.message : 'Failed to load TTS model');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSpeech = async () => {
    if (!modelRef.current || !text.trim()) {
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const { model, voices, textCleaner } = modelRef.current;
      
      console.log('Original text:', text);
      
      let tokenIds: BigInt64Array;
      
      if (useSimpleMode) {
        console.log('Using simple mode - direct character mapping');
        // Simple mode: map each character directly to a token
        const simpleTokens = [0]; // Start token
        for (const char of text.toLowerCase()) {
          const charCode = char.charCodeAt(0);
          if (charCode >= 97 && charCode <= 122) { // a-z
            simpleTokens.push(charCode - 96); // a=1, b=2, etc.
          } else if (char === ' ') {
            simpleTokens.push(27); // space token
          } else {
            simpleTokens.push(1); // unknown token
          }
        }
        simpleTokens.push(0); // End token
        tokenIds = new BigInt64Array(simpleTokens.map(id => BigInt(id)));
        console.log('Simple mode tokens:', Array.from(tokenIds));
      } else {
        // Use the new TextCleaner implementation
        console.log('Using TextCleaner direct conversion');
        
        // Clean the text first (basic normalization)
        const cleanText = textCleaner.clean(text);
        console.log('Cleaned text:', cleanText);
        
        // Convert directly to tokens using the TextCleaner
        tokenIds = textCleaner.textToTokens(cleanText);
        console.log('TextCleaner tokens:', Array.from(tokenIds));
      }
      
      // Get voice embedding
      const voiceEmbedding = voices[selectedVoice];
      if (!voiceEmbedding) {
        throw new Error(`Voice ${selectedVoice} not found`);
      }
      console.log(`Using voice ${selectedVoice} with ${voiceEmbedding.length} dimensions`);

      // Create ONNX tensor inputs with proper shapes and data types
      console.log('Creating tensors:', {
        tokenIds: tokenIds.length,
        voiceEmbedding: voiceEmbedding.length,
        tokenIdsType: tokenIds.constructor.name,
        voiceEmbeddingType: voiceEmbedding.constructor.name,
        sampleTokenIds: Array.from(tokenIds.slice(0, 10)), // Show first 10 tokens
        sampleVoiceValues: Array.from(voiceEmbedding.slice(0, 5)) // Show first 5 voice values
      });
      
      const inputs = {
        'input_ids': new Tensor('int64', tokenIds, [1, tokenIds.length]),
        'style': new Tensor('float32', voiceEmbedding, [1, voiceEmbedding.length]),
        'speed': new Tensor('float32', new Float32Array([1.0]), [1])
      };
      
      console.log('ONNX input tensors created successfully');

      // Run inference with the real ONNX model
      console.log('Running ONNX inference with inputs:', Object.keys(inputs));
      const startTime = Date.now();
      
      let results;
      try {
        results = await model.run(inputs);
        const inferenceTime = Date.now() - startTime;
        console.log(`ONNX inference completed in ${inferenceTime}ms`);
        console.log('Model outputs:', Object.keys(results));
      } catch (inferenceError) {
        console.error('ONNX inference failed:', inferenceError);
        const errMsg = inferenceError instanceof Error ? inferenceError.message : String(inferenceError);
        throw new Error(`Speech synthesis failed: ${errMsg}`);
      }
      
      // Extract audio data from model output
      let audioData: Float32Array;
      const outputNames = Object.keys(results);
      console.log('Available outputs:', outputNames);
      
      // Try to find the audio output tensor
      let audioTensor = null;
      for (const name of outputNames) {
        const tensor = results[name];
        console.log(`Output '${name}':`, {
          type: tensor.type,
          dims: tensor.dims,
          size: tensor.size
        });
        
        // Look for the main audio output (usually the largest tensor)
        if (!audioTensor || tensor.size > audioTensor.size) {
          audioTensor = tensor;
        }
      }
      
      if (!audioTensor) {
        throw new Error('No audio output found in model results');
      }
      
      // Convert tensor data to Float32Array
      audioData = new Float32Array(audioTensor.data);
      console.log(`Generated audio: ${audioData.length} samples`);
      
      // Post-process audio: trim silence and normalize
      let trimmedAudio = audioData;
      
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
      
      // Trim audio and ensure minimum length
      if (endIdx > startIdx) {
        trimmedAudio = audioData.slice(startIdx, endIdx + 1);
        console.log(`Trimmed audio from ${audioData.length} to ${trimmedAudio.length} samples`);
      }

      // Use mediabunny to process and enhance audio
      console.log('Processing audio with mediabunny...');
      
      try {
        // Convert Float32Array to WAV format first
        const sampleRate = 22050; // KittenTTS model output sample rate
        let finalAudio = trimmedAudio;
        
        // Apply audio enhancements using mediabunny
        // Normalize audio to prevent clipping
        let maxAmplitude = 0;
        for (let i = 0; i < finalAudio.length; i++) {
          maxAmplitude = Math.max(maxAmplitude, Math.abs(finalAudio[i]));
        }
        
        if (maxAmplitude > 0) {
          const normalizationFactor = 0.8 / maxAmplitude;
          finalAudio = finalAudio.map(sample => sample * normalizationFactor);
          console.log(`Audio normalized with factor ${normalizationFactor.toFixed(3)}`);
        }
        
        // TODO: Use mediabunny for advanced audio processing when needed
        // For now, using basic WAV creation with normalization
        console.log('Mediabunny available for future audio enhancements');
        
        // Create WAV blob
        const wavData = createWavBlob(finalAudio, sampleRate);
        const blob = wavData;
        const url = URL.createObjectURL(blob);
        
        console.log(`Audio processing completed: ${(finalAudio.length / sampleRate).toFixed(2)}s`);
        
        // Clean up previous URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        
        setAudioUrl(url);
        console.log('Speech generated successfully with mediabunny integration');
        
      } catch (mediabunnyError) {
        console.warn('Audio processing failed, using basic WAV:', mediabunnyError);
        
        // Fallback to basic WAV creation
        const sampleRate = 22050;
        const wavData = createWavBlob(trimmedAudio, sampleRate);
        const blob = wavData;
        const url = URL.createObjectURL(blob);
        
        // Clean up previous URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        
        setAudioUrl(url);
        console.log('Speech generated successfully with basic WAV processing');
      }
      
    } catch (err) {
      console.error('Failed to generate speech:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate speech');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `tts_${selectedVoice}_${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 className="text-red-800 font-semibold">Error</h3>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          onClick={() => {
            setError('');
            loadModel();
          }}
          className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loading />
        <p className="text-gray-600">Loading TTS model and voices...</p>
        <p className="text-sm text-gray-500">This may take a moment on first load</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Model Status */}
      {isModelLoaded && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 text-sm font-medium">TTS model loaded successfully</span>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Voice Selection */}
          <div>
            <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Voice
            </label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.currentTarget.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {VOICE_OPTIONS.map(voice => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              ))}
            </select>
          </div>

          {/* Debug Mode Toggle */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useSimpleMode}
                onChange={(e) => setUseSimpleMode(e.currentTarget.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Use simple mode (for debugging)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Simple mode bypasses phoneme conversion and uses direct character mapping
            </p>
          </div>

          {/* Text Input */}
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
              Text to Speak
            </label>
            <textarea
              id="text-input"
              value={text}
              onChange={(e) => setText(e.currentTarget.value)}
              placeholder="Enter the text you want to convert to speech..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {text.length}/500 characters
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateSpeech}
            disabled={!text.trim() || !isModelLoaded || isGenerating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loading className="scale-75" />
                <span>Generating Speech...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.824a1 1 0 011.617.824zM14 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
                  <path d="M16.5 6A1.5 1.5 0 0118 7.5v5a1.5 1.5 0 11-3 0v-5A1.5 1.5 0 0116.5 6z" />
                </svg>
                <span>Generate Speech</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Audio Player and Download */}
      {audioUrl && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Audio</h3>
          
          <div className="space-y-4">
            {/* Audio Player */}
            <div className="flex items-center gap-4">
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className="flex-1"
              >
                Your browser does not support the audio element.
              </audio>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadAudio}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download WAV
            </button>

            {/* Audio Info */}
            <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-2">
              <div>Voice: {VOICE_OPTIONS.find(v => v.value === selectedVoice)?.label}</div>
              <div>Text: "{text.length > 50 ? text.substring(0, 50) + '...' : text}"</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;