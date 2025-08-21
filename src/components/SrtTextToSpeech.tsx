import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import Loading from './Loading';
import { VOICE_OPTIONS, type VoiceId } from '@quickeditvideo/kittentts';
import TextToSpeechWorkerUrl from '../workers/TextToSpeechWorker.ts?worker&url';
import type { WorkerResponse, QueueItem } from '../workers/TextToSpeechWorker';
import { registerMp3Encoder } from '@mediabunny/mp3-encoder';
import { 
  Input, 
  Output, 
  BlobSource, 
  BufferTarget, 
  Mp3OutputFormat, 
  ALL_FORMATS, 
  Conversion,
  canEncodeAudio 
} from 'mediabunny';

interface SrtSubtitle {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  startSeconds: number;
  endSeconds: number;
}

interface GeneratedAudio {
  id: string;
  subtitleId: number;
  text: string;
  voice: VoiceId;
  audioUrl: string | null;
  timestamp: number;
  isGenerating?: boolean;
  startTime: string;
  endTime: string;
  regenerationAttempts?: number;
  lastSpeed?: number;
}

const SrtTextToSpeech = () => {
  const [, setSrtFile] = useState<File | null>(null);
  const [subtitles, setSubtitles] = useState<SrtSubtitle[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('expr-voice-3-f');
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [processingQueue, setProcessingQueue] = useState<boolean>(false);
  const [queueLength, setQueueLength] = useState<number>(0);
  const [currentView, setCurrentView] = useState<'landing' | 'editor'>('landing');
  const [isMerging, setIsMerging] = useState<boolean>(false);
  
  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subtitlesRef = useRef<SrtSubtitle[]>([]);

  // Keep subtitles ref updated
  useEffect(() => {
    subtitlesRef.current = subtitles;
  }, [subtitles]);

  // Dispatch view change event for header visibility
  useEffect(() => {
    document.dispatchEvent(new CustomEvent('srtTtsViewChange', {
      detail: { currentView }
    }));
  }, [currentView]);

  // Initialize worker
  useEffect(() => {
    try {
      const worker = new Worker(TextToSpeechWorkerUrl, { type: 'module' });
      workerRef.current = worker;
      
      // Listen for worker messages
      worker.addEventListener('message', handleWorkerMessage);
      
      return () => {
        worker.removeEventListener('message', handleWorkerMessage);
        worker.terminate();
      };
    } catch (err) {
      console.error('Failed to initialize TTS worker:', err);
      setError('Failed to initialize text-to-speech worker');
      setIsModelLoading(false);
    }
  }, []);

  const handleWorkerMessage = (e: MessageEvent<WorkerResponse>) => {
    const response = e.data;
    
    switch (response.type) {
      case 'model-loaded':
        setIsModelLoaded(true);
        setIsModelLoading(false);
        setError('');
        console.log('TTS model loaded successfully');
        break;
        
      case 'model-error':
        setIsModelLoaded(false);
        setIsModelLoading(false);
        setError(response.error || 'Failed to load TTS model');
        console.error('TTS model failed to load:', response.error);
        break;
        
      case 'queue-updated':
        setQueueLength(response.queueLength || 0);
        setProcessingQueue(response.processing || false);
        break;
        
      case 'speech-generated':
        if (response.id && response.audioUrl) {
          // First update the state with the generated audio, then check duration
          setGeneratedAudios(prev => {
            const updated = prev.map(audio => 
              audio.id === response.id 
                ? { ...audio, audioUrl: response.audioUrl!, isGenerating: false }
                : audio
            );
            
            // Find the audio that was just updated
            const updatedAudio = updated.find(a => a.id === response.id);
            if (updatedAudio) {
              // Check duration asynchronously after state update
              setTimeout(() => {
                checkAudioDurationAndRegenerateIfNeeded(updatedAudio, response.audioUrl!);
              }, 100);
            }
            
            return updated;
          });
        }
        break;
        
      case 'speech-error':
        if (response.id) {
          setGeneratedAudios(prev => prev.filter(audio => audio.id !== response.id));
          console.error('Speech generation failed for ID:', response.id, ':', response.error);
        }
        break;
        
      default:
        console.log('Unknown response from worker:', response);
        break;
    }
  };

  // Check audio duration and auto-regenerate if needed with increased speed
  const checkAudioDurationAndRegenerateIfNeeded = useCallback(async (currentAudio: GeneratedAudio, audioUrl: string) => {
    try {
      // Create a temporary audio element to get duration
      const audioElement = new Audio(audioUrl);
      
      // Load audio metadata with timeout
      const audioDuration = await new Promise<number>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Timeout loading audio metadata'));
        }, 5000);
        
        const cleanup = () => {
          clearTimeout(timeoutId);
          audioElement.removeEventListener('loadedmetadata', onLoad);
          audioElement.removeEventListener('error', onError);
        };
        
        const onLoad = () => {
          cleanup();
          resolve(audioElement.duration);
        };
        
        const onError = () => {
          cleanup();
          reject(new Error('Failed to load audio metadata'));
        };
        
        audioElement.addEventListener('loadedmetadata', onLoad);
        audioElement.addEventListener('error', onError);
      });
      
      // Find subtitle using ref to avoid closure issues
      const subtitle = subtitlesRef.current.find(s => s.id === currentAudio.subtitleId);
      if (!subtitle) {
        console.warn(`Subtitle with ID ${currentAudio.subtitleId} not found for auto-regeneration`);
        return;
      }
      
      const subtitleDuration = subtitle.endSeconds - subtitle.startSeconds;
      const regenerationAttempts = currentAudio.regenerationAttempts || 0;
      const maxRegenerationAttempts = 5;
      
      // Auto-regenerate if audio is too long and we haven't exceeded max attempts
      if (audioDuration > subtitleDuration && regenerationAttempts < maxRegenerationAttempts) {
        // Calculate optimal speed using progressive strategy:
        // - First attempt: base calculation from duration ratio
        // - Subsequent attempts: use previous speed and increase progressively
        // - Ensure minimum speed progression for vigorous scenarios
        let finalSpeed: number;
        
        if (regenerationAttempts > 0 && currentAudio.lastSpeed) {
          // For regenerations, use the previous speed as baseline and increase progressively
          const speedIncrease = 1 + (0.5 * regenerationAttempts); // 50% increase per attempt
          finalSpeed = Math.min(currentAudio.lastSpeed * speedIncrease, 3.0);
        } else {
          // For first regeneration, calculate from audio/subtitle duration ratio
          const baseSpeedMultiplier = audioDuration / subtitleDuration;
          const speedWithBuffer = baseSpeedMultiplier * 1.2; // 20% safety margin
          finalSpeed = Math.min(speedWithBuffer, 3.0);
        }
        
        // Ensure minimum speed progression for vigorous scenarios
        const minimumSpeed = 1.5 + (regenerationAttempts * 0.3);
        finalSpeed = Math.max(finalSpeed, minimumSpeed);
        
        // Final cap at maximum speed
        finalSpeed = Math.min(finalSpeed, 3.0);
        
        console.log(`Auto-regenerating subtitle ${subtitle.id}: ${audioDuration.toFixed(2)}s > ${subtitleDuration.toFixed(2)}s, using ${finalSpeed.toFixed(2)}x speed (attempt ${regenerationAttempts + 1}${currentAudio.lastSpeed ? `, prev: ${currentAudio.lastSpeed.toFixed(1)}x` : ''})`);
        
        // Clean up current audio and regenerate
        URL.revokeObjectURL(audioUrl);
        setGeneratedAudios(prev => prev.filter(a => a.id !== currentAudio.id));
        
        setTimeout(() => {
          generateSpeechForSubtitle(subtitle, finalSpeed, regenerationAttempts + 1);
        }, 50);
        return;
      }
      
      // Log if we've reached max attempts but audio is still too long
      if (regenerationAttempts >= maxRegenerationAttempts && audioDuration > subtitleDuration) {
        console.warn(`Audio for subtitle ${subtitle.id} still exceeds duration after ${maxRegenerationAttempts} attempts. Keeping final version.`);
      }
      
    } catch (error) {
      console.error('Error checking audio duration for auto-regeneration:', error);
    }
  }, [setGeneratedAudios]);

  // Parse SRT time format (HH:MM:SS,mmm) to seconds
  const parseTimeToSeconds = (timeString: string): number => {
    const [time, ms] = timeString.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + (parseInt(ms) / 1000);
  };

  // Parse SRT file content
  const parseSrtContent = (content: string): SrtSubtitle[] => {
    const blocks = content.trim().split(/\n\s*\n/);
    const subtitles: SrtSubtitle[] = [];

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      const id = parseInt(lines[0]);
      const timeLine = lines[1];
      const textLines = lines.slice(2);

      // Parse time format: 00:00:20,000 --> 00:00:24,400
      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) continue;

      const startTime = timeMatch[1];
      const endTime = timeMatch[2];
      const text = textLines.join(' ').trim();

      if (text && !isNaN(id)) {
        subtitles.push({
          id,
          startTime,
          endTime,
          text,
          startSeconds: parseTimeToSeconds(startTime),
          endSeconds: parseTimeToSeconds(endTime)
        });
      }
    }

    return subtitles.sort((a, b) => a.startSeconds - b.startSeconds);
  };

  const handleFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.srt')) {
      setError('Please select a valid SRT file');
      return;
    }

    try {
      const content = await file.text();
      const parsedSubtitles = parseSrtContent(content);
      
      if (parsedSubtitles.length === 0) {
        setError('No valid subtitles found in the SRT file');
        return;
      }

      setSrtFile(file);
      setSubtitles(parsedSubtitles);
      setCurrentView('editor');
      setError('');
      setGeneratedAudios([]);
    } catch (err) {
      console.error('Error parsing SRT file:', err);
      setError('Failed to parse SRT file');
    }
  };

  const generateSpeechForSubtitle = (subtitle: SrtSubtitle, customSpeed?: number, regenerationAttempts?: number) => {
    if (!workerRef.current || !isModelLoaded) return;

    const audioId = `srt_${subtitle.id}_${Date.now()}`;
    const speed = customSpeed || 1.0;
    const attempts = regenerationAttempts || 0;
    
    const audioItem: GeneratedAudio = {
      id: audioId,
      subtitleId: subtitle.id,
      text: subtitle.text,
      voice: selectedVoice,
      audioUrl: null,
      timestamp: Date.now(),
      isGenerating: true,
      startTime: subtitle.startTime,
      endTime: subtitle.endTime,
      regenerationAttempts: attempts,
      lastSpeed: speed
    };

    setGeneratedAudios(prev => {
      const filtered = prev.filter(a => a.subtitleId !== subtitle.id);
      return [audioItem, ...filtered];
    });

    const queueItem: QueueItem = {
      id: audioId,
      text: subtitle.text,
      voice: selectedVoice,
      speed: speed,
      language: 'en-us'
    };
    
    workerRef.current.postMessage({
      type: 'generate-speech',
      data: queueItem
    });
  };

  const generateAllSpeech = () => {
    if (!workerRef.current || !isModelLoaded || subtitles.length === 0) return;

    setGeneratedAudios([]);

    subtitles.forEach((subtitle, index) => {
      setTimeout(() => {
        generateSpeechForSubtitle(subtitle);
      }, index * 100); // Stagger requests slightly
    });
  };

  const downloadAudio = (audio: GeneratedAudio) => {
    if (!audio.audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audio.audioUrl;
    link.download = `srt_subtitle_${audio.subtitleId}_${audio.voice}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAudio = async () => {
    const completedAudios = generatedAudios.filter(a => a.audioUrl && !a.isGenerating);
    
    if (completedAudios.length === 0) {
      setError('No audio files available for download');
      return;
    }

    try {
      // Simple approach: create a zip file with all audio files
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();

      for (const audio of completedAudios) {
        if (audio.audioUrl) {
          const response = await fetch(audio.audioUrl);
          const blob = await response.blob();
          zip.file(`subtitle_${audio.subtitleId}_${audio.startTime.replace(/[:,.]/g, '-')}.wav`, blob);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `srt_audio_${selectedVoice}_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Error creating zip file:', err);
      setError('Failed to create zip file');
    }
  };


  const mergeAndDownloadMp3 = async () => {
    const completedAudios = generatedAudios.filter(a => a.audioUrl && !a.isGenerating);
    
    if (completedAudios.length === 0) {
      setError('No audio files available for merging');
      return;
    }

    setIsMerging(true);
    setError('');

    try {
      // Sort audios by start time to maintain proper order
      const sortedAudios = completedAudios
        .map(audio => {
          const subtitle = subtitles.find(s => s.id === audio.subtitleId);
          return { audio, subtitle };
        })
        .filter(item => item.subtitle)
        .sort((a, b) => a.subtitle!.startSeconds - b.subtitle!.startSeconds);

      // Create an audio context for processing
      const audioContext = new AudioContext();
      const audioBuffers: { buffer: AudioBuffer; startTime: number; endTime: number }[] = [];

      // Load and decode all audio files
      for (const item of sortedAudios) {
        const { audio, subtitle } = item;
        if (!audio.audioUrl || !subtitle) continue;

        const response = await fetch(audio.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        audioBuffers.push({
          buffer: audioBuffer,
          startTime: subtitle.startSeconds,
          endTime: subtitle.endSeconds
        });
      }

      if (audioBuffers.length === 0) {
        throw new Error('No audio buffers to merge');
      }

      // Calculate the total duration needed
      const maxEndTime = Math.max(...audioBuffers.map(ab => ab.endTime));
      const totalSamples = Math.ceil(maxEndTime * audioContext.sampleRate);
      
      // Create output buffer
      const outputBuffer = audioContext.createBuffer(
        1, // mono
        totalSamples,
        audioContext.sampleRate
      );
      
      const outputData = outputBuffer.getChannelData(0);

      // Mix audio buffers at their proper timing
      for (const item of audioBuffers) {
        const { buffer, startTime } = item;
        const startSample = Math.floor(startTime * audioContext.sampleRate);
        const sourceData = buffer.getChannelData(0);
        
        // Copy audio to output at the correct timing
        for (let i = 0; i < sourceData.length && (startSample + i) < totalSamples; i++) {
          outputData[startSample + i] = sourceData[i];
        }
      }

      // Convert to WAV first, then to MP3
      const wavBlob = audioBufferToWav(outputBuffer);
      
      // Register MP3 encoder if not natively supported
      if (!(await canEncodeAudio('mp3'))) {
        registerMp3Encoder();
      }

      // Convert WAV to MP3 using Mediabunny
      const input = new Input({
        source: new BlobSource(wavBlob),
        formats: ALL_FORMATS,
      });
      
      const output = new Output({
        format: new Mp3OutputFormat(),
        target: new BufferTarget(),
      });

      const conversion = await Conversion.init({ input, output });
      await conversion.execute();

      // Create MP3 blob from the buffer
      if (!output.target.buffer) {
        throw new Error('MP3 conversion failed - no buffer returned');
      }
      const mp3Blob = new Blob([output.target.buffer], { type: 'audio/mpeg' });

      // Download the MP3 file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(mp3Blob);
      link.download = `srt_merged_${selectedVoice}_${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

    } catch (err) {
      console.error('Error merging audio files:', err);
      setError('Failed to merge audio files: ' + (err as Error).message);
    } finally {
      setIsMerging(false);
    }
  };

  // Helper function to convert AudioBuffer to WAV blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const byteRate = sampleRate * numberOfChannels * bytesPerSample;
    const blockAlign = numberOfChannels * bytesPerSample;
    const dataLength = length * numberOfChannels * bytesPerSample;
    const bufferLength = 44 + dataLength;
    
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Convert float32 audio data to int16
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
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

  const resetTool = () => {
    setCurrentView('landing');
    setSrtFile(null);
    setSubtitles([]);
    setGeneratedAudios([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  if (error && currentView === 'landing') {
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
            window.location.reload();
          }}
          className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md text-sm"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (isModelLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <Loading />
        <p className="text-gray-600">Loading TTS model and voices...</p>
        <p className="text-sm text-gray-500">This may take a moment on first load</p>
      </div>
    );
  }

  if (currentView === 'landing') {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" className="text-teal-600">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14,2 14,8 20,8"/>
              <path d="M8 13h8M8 17h6"/>
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload SRT File</h2>
          <p className="text-gray-600 mb-6">Convert your subtitle file to speech with AI voices</p>
          
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".srt"
              onChange={handleFileUpload}
              className="hidden"
              id="srt-upload"
            />
            
            <label
              htmlFor="srt-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">SRT files only</p>
              </div>
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
        {/* Left Panel - Subtitles */}
        <div className="p-6 order-2 lg:order-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Subtitles</h3>
              <p className="text-sm text-gray-600">{subtitles.length} subtitles found</p>
            </div>
            <button
              onClick={resetTool}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              New File
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {subtitles.map((subtitle) => {
              const hasAudio = generatedAudios.some(a => a.subtitleId === subtitle.id && a.audioUrl);
              const isGenerating = generatedAudios.some(a => a.subtitleId === subtitle.id && a.isGenerating);
              const audioEntry = generatedAudios.find(a => a.subtitleId === subtitle.id);
              const regenerationAttempts = audioEntry?.regenerationAttempts || 0;
              const lastSpeed = audioEntry?.lastSpeed || 1.0;
              
              return (
                <div key={subtitle.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-1">
                        {subtitle.startTime} → {subtitle.endTime}
                        <span className="ml-2 text-gray-400">
                          ({(subtitle.endSeconds - subtitle.startSeconds).toFixed(1)}s)
                        </span>
                        {regenerationAttempts > 0 && (
                          <span className="ml-2 text-orange-600 font-medium">
                            (Attempt {regenerationAttempts + 1}, Speed: {lastSpeed.toFixed(1)}x)
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-900">{subtitle.text}</p>
                    </div>
                    
                    <div className="ml-3 flex items-center gap-2">
                      {hasAudio && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Audio generated" />
                      )}
                      {isGenerating && (
                        <div className="flex items-center gap-1">
                          <Loading className="scale-50" />
                          {regenerationAttempts > 0 && (
                            <span className="text-xs text-orange-600">Regenerating</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {hasAudio && (
                    <div className="mt-3">
                      {(() => {
                        const audio = generatedAudios.find(a => a.subtitleId === subtitle.id && a.audioUrl);
                        return audio?.audioUrl ? (
                          <audio 
                            src={audio.audioUrl} 
                            controls 
                            className="w-full"
                            style={{ height: '32px' }}
                          />
                        ) : null;
                      })()}
                    </div>
                  )}

                  <button
                    onClick={() => generateSpeechForSubtitle(subtitle)}
                    disabled={isGenerating || !isModelLoaded}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-teal-50 hover:bg-teal-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-teal-700 text-sm rounded-md transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.824a1 1 0 011.617.824zM14 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                    {isGenerating ? (
                      regenerationAttempts > 0 ? `Regenerating (${regenerationAttempts + 1})...` : 'Generating...'
                    ) : hasAudio ? (
                      regenerationAttempts > 0 ? `Regenerate (${lastSpeed.toFixed(1)}x)` : 'Regenerate'
                    ) : 'Generate Speech'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Control Panel */}
        <div className="border-l-0 lg:border-l border-gray-200 border-t lg:border-t-0 order-1 lg:order-2">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Control Panel</h3>
            <p className="text-sm text-gray-600 mt-1">Configure voice and generate speech</p>
            {processingQueue && queueLength > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <Loading className="scale-50" />
                <span>Processing queue ({queueLength})</span>
              </div>
            )}
          </div>
          
          <div className="p-6">
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

              {/* Generate All Button */}
              <button
                onClick={generateAllSpeech}
                disabled={!isModelLoaded || subtitles.length === 0}
                className={`flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 transition-colors w-full justify-center ${
                  !isModelLoaded || subtitles.length === 0
                    ? 'border-gray-200 bg-white text-gray-400 cursor-not-allowed'
                    : ''
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.824a1 1 0 011.617.824zM14 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd"/>
                  <path d="M16.5 6A1.5 1.5 0 0118 7.5v5a1.5 1.5 0 11-3 0v-5A1.5 1.5 0 0116.5 6z"/>
                </svg>
                Generate All Speech
              </button>

              {/* Download Buttons */}
              <div className="space-y-3">
                {/* Download All ZIP Button */}
                <button
                  onClick={downloadAllAudio}
                  disabled={!generatedAudios.some(a => a.audioUrl && !a.isGenerating)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors w-full justify-center rounded-md"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Download All (ZIP)
                </button>
                
                {/* Merge and Download MP3 Button */}
                <button
                  onClick={mergeAndDownloadMp3}
                  disabled={isMerging || !generatedAudios.some(a => a.audioUrl && !a.isGenerating)}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors w-full justify-center rounded-md"
                >
                  {isMerging ? (
                    <>
                      <Loading className="scale-50" />
                      <span>Merging...</span>
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M8 3L4 7L8 11M16 21L20 17L16 13M4 7H16M20 17H8"/>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      </svg>
                      <span>Merge & Download MP3</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Audio List */}
              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Generated Audio</h4>
                {generatedAudios.length === 0 ? (
                  <p className="text-sm text-gray-500">No audio generated yet</p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {generatedAudios
                      .sort((a, b) => {
                        const subtitleA = subtitles.find(s => s.id === a.subtitleId);
                        const subtitleB = subtitles.find(s => s.id === b.subtitleId);
                        return (subtitleA?.startSeconds || 0) - (subtitleB?.startSeconds || 0);
                      })
                      .map((audio) => (
                      <div key={audio.id} className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">#{audio.subtitleId}</span>
                        {audio.isGenerating ? (
                          <Loading className="scale-50" />
                        ) : audio.audioUrl ? (
                          <button
                            onClick={() => downloadAudio(audio)}
                            className="text-teal-600 hover:text-teal-800"
                          >
                            Download
                          </button>
                        ) : (
                          <span className="text-red-500">Failed</span>
                        )}
                        <button
                          onClick={() => removeAudio(audio.id)}
                          className="ml-auto text-gray-400 hover:text-red-500"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SrtTextToSpeech;