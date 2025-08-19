import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import Loading from './Loading';
import * as mediabunny from 'mediabunny';
import { KittenTTS, VOICE_OPTIONS, createAudioUrl, type VoiceId } from '@quickeditvideo/kittentts';

// Use vite-plugin-wasm for WASM imports via alias
import ortWasmSimdThreadedUrl from '@onnx-wasm/ort-wasm-simd-threaded.wasm?url';
import ortWasmSimdThreadedJsepUrl from '@onnx-wasm/ort-wasm-simd-threaded.jsep.wasm?url';

interface GeneratedAudio {
  id: string;
  text: string;
  voice: VoiceId;
  audioUrl: string | null; // null when generating
  timestamp: number;
  isGenerating?: boolean;
}

const TextToSpeech = () => {
  const [text, setText] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('expr-voice-2-m');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [processingQueue, setProcessingQueue] = useState<boolean>(false);
  const [queueLength, setQueueLength] = useState<number>(0);
  
  const kittenTTSRef = useRef<KittenTTS | null>(null);
  const queueRef = useRef<GeneratedAudio[]>([]);

  // Initialize TTS model and dependencies
  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    if (kittenTTSRef.current?.isReady()) return; // Already loaded
    
    setIsLoading(true);
    setError('');
    
    try {
      // Initialize KittenTTS
      const kittenTTS = new KittenTTS({
        modelPath: '/tts/kitten_tts_nano_v0_1.onnx',
        voicesPath: '/tts/voices.json',
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
      
      kittenTTSRef.current = kittenTTS;
      setIsModelLoaded(true);
      console.log('KittenTTS model loaded successfully');
      
    } catch (err) {
      console.error('Failed to load KittenTTS model:', err);
      setError(err instanceof Error ? err.message : 'Failed to load KittenTTS model');
    } finally {
      setIsLoading(false);
    }
  };

  // Process the generation queue
  const processQueue = async () => {
    if (processingQueue || queueRef.current.length === 0 || !kittenTTSRef.current?.isReady()) {
      return;
    }

    setProcessingQueue(true);

    while (queueRef.current.length > 0) {
      const currentItem = queueRef.current[0];
      
      try {
        const kittenTTS = kittenTTSRef.current;
        
        console.log('Generating speech for:', currentItem.text);
        
        // Generate speech using KittenTTS
        const audioData = await kittenTTS.generate(currentItem.text, {
          voice: currentItem.voice,
          speed: 1.0,
          language: 'en-us'
        });
        
        // Create audio URL for playback
        const audioUrl = createAudioUrl(audioData, kittenTTS.getSampleRate());
        
        // Update the item in the UI
        setGeneratedAudios(prev => 
          prev.map(audio => 
            audio.id === currentItem.id 
              ? { ...audio, audioUrl, isGenerating: false }
              : audio
          )
        );
        
        console.log('Speech generated successfully for:', currentItem.text);
        
      } catch (err) {
        console.error('Failed to generate speech:', err);
        
        // Remove the failed item from UI
        setGeneratedAudios(prev => prev.filter(audio => audio.id !== currentItem.id));
        
        // Show error for the most recent failure
        if (queueRef.current[0]?.id === currentItem.id) {
          setError(err instanceof Error ? err.message : 'Failed to generate speech');
        }
      }
      
      // Remove processed item from queue
      queueRef.current = queueRef.current.slice(1);
      setQueueLength(queueRef.current.length);
    }

    setProcessingQueue(false);
  };

  const generateSpeech = () => {
    if (!kittenTTSRef.current?.isReady()) {
      return;
    }

    const textToGenerate = text.trim() || 'Hello, this is a test message.';
    const voiceToUse = selectedVoice;
    const audioId = `audio_${Date.now()}`;

    // Create the queue item
    const queueItem: GeneratedAudio = {
      id: audioId,
      text: textToGenerate,
      voice: voiceToUse,
      audioUrl: null,
      timestamp: Date.now(),
      isGenerating: true
    };

    // IMMEDIATE UI UPDATES (synchronous)
    setText(''); // Clear input immediately
    setError(''); // Clear any errors
    setGeneratedAudios(prev => [queueItem, ...prev]); // Add to UI immediately
    
    // Add to processing queue
    queueRef.current = [...queueRef.current, queueItem];
    setQueueLength(queueRef.current.length);
    
    // Start processing (async, non-blocking)
    processQueue();
  };

  const downloadAudio = (audio: GeneratedAudio) => {
    if (!audio.audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audio.audioUrl;
    link.download = `tts_${audio.voice}_${audio.id}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeAudio = (audioId: string) => {
    setGeneratedAudios(prev => {
      const audioToRemove = prev.find(a => a.id === audioId);
      if (audioToRemove && audioToRemove.audioUrl) {
        URL.revokeObjectURL(audioToRemove.audioUrl);
      }
      return prev.filter(a => a.id !== audioId);
    });
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      generatedAudios.forEach(audio => {
        if (audio.audioUrl) {
          URL.revokeObjectURL(audio.audioUrl);
        }
      });
    };
  }, []);

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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
        {/* Left Panel - Generated Audio List */}
        <div className="border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Generated Audio</h3>
            <p className="text-sm text-gray-600 mt-1">Your text-to-speech conversions</p>
          </div>
          
          <div className="p-6">
            {generatedAudios.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="text-gray-400">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.824a1 1 0 011.617.824zM14 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd"/>
                    <path d="M16.5 6A1.5 1.5 0 0118 7.5v5a1.5 1.5 0 11-3 0v-5A1.5 1.5 0 0116.5 6z"/>
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No audio generated yet</p>
                <p className="text-gray-400 text-xs mt-1">Enter text and generate speech to see results here</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto">
                {generatedAudios.map((audio) => (
                  <div key={audio.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {audio.text.length > 60 ? `${audio.text.substring(0, 60)}...` : audio.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {VOICE_OPTIONS.find(v => v.value === audio.voice)?.label} • {new Date(audio.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={() => removeAudio(audio.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove audio"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                    
                    {audio.isGenerating ? (
                      <div className="w-full mb-3 bg-gray-100 rounded p-3 flex items-center justify-center gap-2">
                        <Loading className="scale-75" />
                        <span className="text-sm text-gray-600">Generating...</span>
                      </div>
                    ) : (
                      <audio 
                        src={audio.audioUrl || undefined} 
                        controls 
                        className="w-full mb-3"
                        style={{ height: '32px' }}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    )}
                    
                    <button
                      onClick={() => downloadAudio(audio)}
                      disabled={audio.isGenerating}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 text-sm rounded-md transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download WAV
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Control Panel */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Text to Speech</h3>
            <p className="text-sm text-gray-600">Enter text and select a voice to generate speech</p>
          </div>

          <div className="space-y-6">
            {/* Voice Selection */}
            <div>
              <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 mb-2">
                Voice
              </label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.currentTarget.value as VoiceId)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                Text
              </label>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.currentTarget.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="w-full px-3 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                rows={8}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-2">
                {text.length}/500 characters
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateSpeech}
              disabled={!isModelLoaded}
              className={`flex items-center justify-center gap-2 px-4 py-3 border-2 transition-all rounded-lg font-medium w-full ${
                !isModelLoaded
                  ? 'border-gray-200 bg-white text-gray-400 cursor-not-allowed'
                  : !text.trim()
                    ? 'border-gray-900 bg-white hover:border-teal-600 hover:bg-teal-50 text-gray-900'
                    : 'border-teal-600 bg-teal-50 text-teal-900'
              }`}
            >
              {!isModelLoaded ? (
                <>
                  <Loading className="scale-75" />
                  <span>Loading Model</span>
                </>
              ) : processingQueue && queueLength > 0 ? (
                <>
                  <Loading className="scale-75" />
                  <span>Processing Queue ({queueLength})</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.824a1 1 0 011.617.824zM14 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd"/>
                    <path d="M16.5 6A1.5 1.5 0 0118 7.5v5a1.5 1.5 0 11-3 0v-5A1.5 1.5 0 0116.5 6z"/>
                  </svg>
                  <span>Generate Speech</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextToSpeech;