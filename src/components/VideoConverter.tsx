import { useState, useEffect, useRef } from 'react';
import { FfmpegProvider, useFFmpeg } from '../FFmpegCore';
import { convertVideo, createVideoBlob, downloadBlob, type ConversionOptions } from '../FFmpegUtils';
import Loading from './Loading';
import { SelectFile } from './SelectFile';
import {
	convertVideoWithMediaBunny,
	type MediaBunnyOutputFormat,
} from '../utils/convertVideoWithMediaBunny';

interface VideoConverterProps {
  targetFormat: string;
  targetFormatName: string;
}

const MediaBunnyFormats = new Set<MediaBunnyOutputFormat>(['mp4', 'mov', 'webm', 'mkv']);

const VideoConverterContent = ({ targetFormat, targetFormatName }: VideoConverterProps) => {
  // Use FFmpeg context
  const ffmpegContext = useFFmpeg();
  if (!ffmpegContext) {
    throw new Error('VideoConverter must be used within an FFmpegProvider');
  }
  const { ffmpeg, loaded: ffmpegLoaded, progress, error: ffmpegError, loading: isLoading } = ffmpegContext;
  const [currentView, setCurrentView] = useState<'landing' | 'converting'>('landing');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [originalFormat, setOriginalFormat] = useState<string>('mp4');
  const [displayProgress, setDisplayProgress] = useState<number>(0);
  
  // Conversion options state
  const [conversionSize, setConversionSize] = useState<ConversionOptions['size']>('original');
  const [conversionFps, setConversionFps] = useState<number>(10);
  const [conversionStartTime, setConversionStartTime] = useState<number>(0);
  const [conversionEndTime, setConversionEndTime] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Update display progress when context progress changes
  useEffect(() => {
    setDisplayProgress(progress);
  }, [progress]);

  // Handle file selection from SelectFile component
  const handleFileSelect = (file: File | FileList | null) => {
    // Return early if no file selected
    if (!file) {
      return;
    }
    
    // SelectFile ensures file is validated before calling this
    const selectedFile = file as File;

    setSelectedFile(selectedFile);

    // Detect original format from file extension
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    const detectedFormat = fileExtension === 'mov' ? 'mov' :
      fileExtension === 'mkv' ? 'mkv' :
        fileExtension === 'avi' ? 'avi' :
          fileExtension === 'webm' ? 'webm' :
            fileExtension === 'gif' ? 'gif' :
              'mp4'; // default to mp4

    setOriginalFormat(detectedFormat);

    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
    setCurrentView('converting');

    // Dispatch event to notify page about view change
    document.dispatchEvent(new CustomEvent('videoConverterViewChange', {
      detail: { currentView: 'converting' }
    }));
  };

  // Video file validation function
  const validateVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/');
  };

  // Handle video metadata loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      // Set default end time to video duration for GIF conversion
      if (targetFormat === 'gif' && conversionEndTime === 0) {
        setConversionEndTime(duration);
      }
    }
  };

  // Show error if FFmpeg failed to load
  if (ffmpegError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 className="text-red-800 font-semibold">Failed to load video processor</h3>
        </div>
        <p className="text-red-700 mt-2">{ffmpegError}</p>
        <p className="text-red-600 text-sm mt-1">Please refresh the page to try again.</p>
      </div>
    );
  }

  // Utility functions
  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Convert and download video
  const convertVideoFile = async () => {
    if (!selectedFile) return;

    const useMediaBunny = MediaBunnyFormats.has(targetFormat as MediaBunnyOutputFormat);

    setIsProcessing(true);

    try {
      if (useMediaBunny) {
        const bunnyOptions: MediaBunnyConvertOptions = {
          outputFormat: targetFormat as MediaBunnyOutputFormat,
          size: conversionSize,
          fps: conversionFps,
          startTime: targetFormat === 'gif' ? conversionStartTime : undefined,
          endTime: targetFormat === 'gif' ? conversionEndTime : undefined,
        };

        const result = await convertVideoWithMediaBunny(selectedFile, bunnyOptions, setDisplayProgress);
        downloadBlob(result.blob, result.filename);
      } else {
        if (!ffmpegLoaded || !ffmpeg.current) {
          throw new Error('Video processor is not ready yet');
        }

        const options: ConversionOptions = {
          size: conversionSize,
          fps: conversionFps,
          startTime: targetFormat === 'gif' ? conversionStartTime : undefined,
          endTime: targetFormat === 'gif' ? conversionEndTime : undefined,
        };

        const data = await convertVideo(ffmpeg.current, selectedFile, targetFormat, [], options);

        if (!data || !(data instanceof Uint8Array) || data.length === 0) {
          throw new Error('Invalid video data returned from conversion');
        }

        const blob = createVideoBlob(data, targetFormat);
        const outputFilename = `${selectedFile.name.split('.')[0]}_converted.${targetFormat}`;
        downloadBlob(blob, outputFilename);
      }
    } catch (error) {
      console.error('Error converting video:', error);
      alert(`Error processing video: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
      setDisplayProgress(0);
    }
  };

  // Play/Pause video
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Show loading state while FFmpeg is initializing
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3">
        <Loading />
      </div>
    );
  }

  if (currentView === 'landing') {
    return (
      <SelectFile
        onFileSelect={handleFileSelect}
        validateFile={validateVideoFile}
        validationErrorMessage="Please select a valid video file."
      />
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Video Player and Controls Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="video-container-custom bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                preload="metadata"
                src={videoUrl}
                onLoadedMetadata={handleVideoLoaded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Info Bar */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                  {selectedFile?.name}
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                  {formatTime(videoDuration)} duration
                </div>
                <div
                  data-testid="converting-to-label"
                  className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded whitespace-nowrap"
                >
                  Converting to {targetFormatName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Controls</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentView('landing');
                    // Dispatch event to notify page about view change
                    document.dispatchEvent(new CustomEvent('videoConverterViewChange', {
                      detail: { currentView: 'landing' }
                    }));
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  title="Choose different video"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                  </svg>
                </button>
              </div>
            </div>


            {/* Conversion Options */}
            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-medium text-gray-900">Conversion Options</h4>
              
              {/* Size Selection */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Output Size</label>
                <select
                  value={conversionSize}
                  onChange={(e) => setConversionSize(e.currentTarget.value as ConversionOptions['size'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="original">Original (up to 800px for GIF)</option>
                  <option value="600xauto">600px × Auto</option>
                  <option value="540xauto">540px × Auto</option>
                  <option value="500xauto">500px × Auto</option>
                  <option value="480xauto">480px × Auto</option>
                  <option value="320xauto">320px × Auto</option>
                  <option value="autox480">Auto × 480px</option>
                  <option value="autox320">Auto × 320px</option>
                </select>
              </div>

              {/* FPS Control */}
              <div>
                <label className="block text-sm text-gray-600 mb-2">Frame Rate (FPS)</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={conversionFps}
                    onChange={(e) => setConversionFps(parseInt(e.currentTarget.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>5</span>
                    <input
                      type="number"
                      min="5"
                      max="30"
                      value={conversionFps}
                      onChange={(e) => setConversionFps(Math.max(5, Math.min(30, parseInt(e.currentTarget.value) || 10)))}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    />
                    <span>30</span>
                  </div>
                </div>
              </div>

              {/* Time Range (GIF only) */}
              {targetFormat === 'gif' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Start Time (seconds)</label>
                    <input
                      type="number"
                      min="0"
                      max={videoDuration || 0}
                      step="0.1"
                      value={conversionStartTime}
                      onChange={(e) => setConversionStartTime(Math.max(0, Math.min(videoDuration || 0, parseFloat(e.currentTarget.value) || 0)))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">End Time (seconds)</label>
                    <input
                      type="number"
                      min={conversionStartTime}
                      max={videoDuration || 0}
                      step="0.1"
                      value={conversionEndTime}
                      onChange={(e) => setConversionEndTime(Math.max(conversionStartTime, Math.min(videoDuration || 0, parseFloat(e.currentTarget.value) || videoDuration || 0)))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Duration: {((conversionEndTime - conversionStartTime) || 0).toFixed(1)}s
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={togglePlayPause}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 transition-colors w-full justify-center"
              >
                {isPlaying ?
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6,4V20H10V4H6M14,4V20H18V4H14Z" />
                  </svg> :
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                  </svg>
                }
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <button
                onClick={convertVideoFile}
                disabled={
                  isProcessing
                  || (!MediaBunnyFormats.has(targetFormat as MediaBunnyOutputFormat) && !ffmpegLoaded)
                }
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 font-medium transition-colors disabled:bg-gray-200 disabled:border-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm w-full"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loading className="scale-50" />
                    <span>Converting... {displayProgress > 0 ? `${displayProgress}%` : ''}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                    </svg>
                    Download as {targetFormatName}
                  </div>
                )}
              </button>
              
              {/* Video info hint */}
              <div className="text-xs text-gray-500 text-center mt-3 space-y-1">
                <div>Original: {originalFormat.toUpperCase()}</div>
                <div data-testid="target-format">Converting to: {targetFormatName}</div>
                <div>Duration: {formatTime(videoDuration)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main VideoConverter component with FFmpegProvider
const VideoConverter = ({ targetFormat, targetFormatName }: VideoConverterProps) => {
  return (
    <FfmpegProvider>
      <VideoConverterContent targetFormat={targetFormat} targetFormatName={targetFormatName} />
    </FfmpegProvider>
  );
};

export default VideoConverter;
