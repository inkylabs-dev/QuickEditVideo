import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { FfmpegProvider, useFFmpeg } from '../FFmpegCore';
import { convertVideo, createVideoBlob, downloadBlob } from '../FFmpegUtils';
import Loading from './Loading';

interface VideoConverterProps {
  targetFormat: string;
  targetFormatName: string;
}

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update display progress when context progress changes
  useEffect(() => {
    setDisplayProgress(progress);
  }, [progress]);

  // Handle file selection
  const handleFileSelect = (file: File | null) => {
    if (!file || !file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      return;
    }

    setSelectedFile(file);

    // Detect original format from file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const detectedFormat = fileExtension === 'mov' ? 'mov' :
      fileExtension === 'mkv' ? 'mkv' :
        fileExtension === 'avi' ? 'avi' :
          fileExtension === 'webm' ? 'webm' :
            fileExtension === 'gif' ? 'gif' :
              'mp4'; // default to mp4

    setOriginalFormat(detectedFormat);

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setCurrentView('converting');

    // Dispatch event to notify page about view change
    document.dispatchEvent(new CustomEvent('videoConverterViewChange', {
      detail: { currentView: 'converting' }
    }));
  };

  // Handle video metadata loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
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
    if (!ffmpegLoaded || !selectedFile || !ffmpeg.current) return;

    setIsProcessing(true);

    try {
      // Use the convertVideo utility from FFmpegUtils
      const data = await convertVideo(ffmpeg.current, selectedFile, targetFormat);

      // Validate data before creating blob
      if (!data || !(data instanceof Uint8Array) || data.length === 0) {
        throw new Error('Invalid video data returned from conversion');
      }

      // Create blob and download
      const blob = createVideoBlob(data, targetFormat);
      const outputFilename = `${selectedFile.name.split('.')[0]}_converted.${targetFormat}`;
      downloadBlob(blob, outputFilename);

    } catch (error) {
      console.error('Error converting video:', error);
      alert(`Error processing video: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
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
      <div className="bg-white rounded-lg border-4 border-dashed border-gray-900 hover:border-gray-900 transition-colors">
        <div
          className="p-16 text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) handleFileSelect(files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
        >
          <input
            type="file"
            accept="video/*"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              const target = e.target as HTMLInputElement;
              handleFileSelect(target.files?.[0] || null);
            }}
          />
          <div className="mb-6">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-400">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14,2 14,8 20,8" />
              <path d="M10 15.5L16 12L10 8.5V15.5Z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select your video</h3>
          <p className="text-gray-600 mb-6">Drop a video file here or click to browse</p>
          <div className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 px-6 py-3 font-medium transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            Choose file
          </div>
          <p className="text-xs text-gray-500 mt-4">Supports MP4, WebM, AVI, MOV and more</p>
        </div>
      </div>
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
                <div className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded whitespace-nowrap">
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

            {/* Video Info */}
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Original Format</div>
                <div className="text-lg font-medium text-gray-900 uppercase">{originalFormat}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Converting to</div>
                <div className="text-lg font-medium text-gray-900 uppercase">{targetFormatName}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Duration</div>
                <div className="text-lg font-medium text-gray-900">{formatTime(videoDuration)}</div>
              </div>
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
                disabled={isProcessing || !ffmpegLoaded}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 font-medium transition-colors disabled:bg-gray-200 disabled:border-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm w-full"
              >
                {isProcessing ?
                  <div className="flex items-center gap-2">
                    <Loading className="scale-50" />
                    <span>Converting... {displayProgress > 0 ? `${displayProgress}%` : ''}</span>
                  </div> :
                  ffmpegLoaded ?
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                      </svg>
                      Download as {targetFormatName}
                    </div> :
                    'Loading...'
                }
              </button>
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
