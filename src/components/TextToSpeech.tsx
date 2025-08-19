import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import Loading from './Loading';

// Available voice options from KittenTTS model
const VOICE_OPTIONS = [
  { value: 'expr-voice-1-f', label: 'Female Voice 1' },
  { value: 'expr-voice-2-m', label: 'Male Voice 2' },  
  { value: 'expr-voice-3-f', label: 'Female Voice 3' },
  { value: 'expr-voice-4-m', label: 'Male Voice 4' },
  { value: 'expr-voice-5-f', label: 'Female Voice 5' },
];

interface KittenTTSModel {
  phonemize: (text: string, voice?: string) => Promise<string>;
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
      // Dynamic imports for browser environment
      const [{ InferenceSession }, { phonemize }, mediabunnyModule] = await Promise.all([
        import('onnxruntime-web'),
        import('phonemizer'),
        import('mediabunny')
      ]);

      /*
       * MOCK IMPLEMENTATION NOTICE:
       * 
       * This is currently a mock implementation that generates a simple sine wave tone
       * instead of actual speech synthesis. To implement real TTS functionality:
       * 
       * 1. Download the actual ONNX model and voices from:
       *    - Model: https://huggingface.co/KittenML/kitten-tts-nano-0.1/resolve/main/model.onnx
       *    - Voices: https://huggingface.co/KittenML/kitten-tts-nano-0.1/resolve/main/voices.json
       * 
       * 2. Use InferenceSession.create() with the downloaded model buffer
       * 
       * 3. Implement proper text preprocessing and phonemization
       * 
       * 4. Create proper ONNX tensor inputs for the model
       * 
       * The current mock allows testing the complete UI workflow and audio playback/download.
       */
      console.log('Setting up TTS model (mock implementation)...');
      
      // Mock model for testing
      const model = {
        run: async (inputs: any) => {
          // Generate mock audio data (simple sine wave)
          const sampleRate = 22050;
          const duration = 2; // 2 seconds
          const frequency = 440; // A4 note
          const samples = sampleRate * duration;
          const audioData = new Float32Array(samples);
          
          for (let i = 0; i < samples; i++) {
            audioData[i] = 0.3 * Math.sin(2 * Math.PI * frequency * i / sampleRate);
          }
          
          return {
            audio: { data: audioData }
          };
        }
      };

      // Mock voices data
      const voicesData = {
        'expr-voice-1-f': Array.from({length: 256}, () => Math.random() * 2 - 1),
        'expr-voice-2-m': Array.from({length: 256}, () => Math.random() * 2 - 1),
        'expr-voice-3-f': Array.from({length: 256}, () => Math.random() * 2 - 1),
        'expr-voice-4-m': Array.from({length: 256}, () => Math.random() * 2 - 1),
        'expr-voice-5-f': Array.from({length: 256}, () => Math.random() * 2 - 1),
      };


      // Convert voices data to Float32Array format
      const voices: Record<string, Float32Array> = {};
      for (const [voiceId, voiceData] of Object.entries(voicesData)) {
        voices[voiceId] = new Float32Array(voiceData as number[]);
      }

      // Simple text cleaner (mock implementation)
      const textCleaner = {
        clean: (text: string) => {
          return text
            .toLowerCase()
            .replace(/[^\w\s.,!?-]/g, '')
            .trim();
        },
        textToIds: (text: string) => {
          // For mock implementation, just create some dummy IDs based on text length
          const ids = Array.from({length: Math.max(10, text.length)}, (_, i) => i + 1);
          return new Int32Array(ids);
        }
      };

      modelRef.current = {
        phonemize,
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
      const { phonemize, model, voices, textCleaner } = modelRef.current;
      
      // Clean and process text
      const cleanText = textCleaner.clean(text);
      console.log('Processing text:', cleanText);

      // Convert text to phonemes
      const phonemes = await phonemize(cleanText);
      console.log('Phonemes:', phonemes);

      // Convert to token IDs (simplified)
      const tokenIds = textCleaner.textToIds(phonemes);
      
      // Get voice embedding
      const voiceEmbedding = voices[selectedVoice];
      if (!voiceEmbedding) {
        throw new Error(`Voice ${selectedVoice} not found`);
      }

      // Run inference (mock implementation)
      console.log('Running inference...');
      const results = await model.run({
        text: cleanText,
        voice: selectedVoice,
        speed: 1.0
      });
      
      // Extract audio data
      const audioData = results.audio.data as Float32Array;
      
      // Use the full audio data for mock implementation
      const trimmedAudio = audioData;

      // Convert Float32Array to WAV format
      const sampleRate = 22050; // KittenTTS model output sample rate
      const wavData = createWavBlob(trimmedAudio, sampleRate);
      
      // Create blob and URL
      const blob = wavData;
      const url = URL.createObjectURL(blob);
      
      // Clean up previous URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(url);
      console.log('Speech generated successfully');
      
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