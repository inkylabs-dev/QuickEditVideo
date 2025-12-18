'use client';

import { useState, useRef } from 'react';
import Loading from './Loading';
import { SelectFile } from './SelectFile';
import {
  convertVideoWithMediaBunny,
  type MediaBunnyConvertOptions,
  type MediaBunnyOutputFormat,
} from '../utils/convertVideoWithMediaBunny';

interface VideoConverterProps {
  targetFormat: MediaBunnyOutputFormat;
  targetFormatName: string;
}

const MediaBunnyFormats = new Set<MediaBunnyOutputFormat>(['mp4', 'mov', 'webm', 'mkv', 'gif', 'avi']);

const VideoConverter = ({ targetFormat, targetFormatName }: VideoConverterProps) => {
  const [currentView, setCurrentView] = useState<'landing' | 'converting'>('landing');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [conversionSize, setConversionSize] = useState<MediaBunnyConvertOptions['size']>('original');
  const [conversionFps, setConversionFps] = useState<number>(10);
  const [conversionStartTime, setConversionStartTime] = useState<number>(0);
  const [conversionEndTime, setConversionEndTime] = useState<number>(0);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileSelect = (file: File | FileList | null) => {
    if (!file) return;
    const selected = file as File;
    setSelectedFile(selected);
    setErrorMessage('');
    const url = URL.createObjectURL(selected);
    setVideoUrl(url);
    setCurrentView('converting');
    setConversionStartTime(0);
    setConversionEndTime(0);
  };

  const validateVideoFile = (file: File) => file.type.startsWith('video/');

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      if (conversionEndTime === 0) {
        setConversionEndTime(duration);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

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

  const convertVideoFile = async () => {
    if (!selectedFile) return;

    if (!MediaBunnyFormats.has(targetFormat)) {
      setErrorMessage('This conversion is not supported yet.');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setErrorMessage('');

    try {
      const options: MediaBunnyConvertOptions = {
        outputFormat: targetFormat,
        size: conversionSize,
        fps: conversionFps,
        startTime: conversionStartTime > 0 ? conversionStartTime : undefined,
        endTime:
          conversionEndTime > 0 && conversionEndTime > conversionStartTime ? conversionEndTime : undefined,
      };

      const result = await convertVideoWithMediaBunny(
        selectedFile,
        options,
        (progress) => {
          setProcessingProgress(Math.max(0, Math.min(100, Math.round(progress))));
        }
      );

      const link = document.createElement('a');
      link.href = URL.createObjectURL(result.blob);
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error converting video:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

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
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Controls</h3>
              <button
                onClick={() => {
                  setCurrentView('landing');
                  setSelectedFile(null);
                  setVideoUrl('');
                  setVideoDuration(0);
                  setIsPlaying(false);
                }}
                className="text-gray-400 hover:text-gray-600"
                title="Choose different video"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-medium text-gray-900">Conversion Options</h4>

              <div>
                <label className="block text-sm text-gray-600 mb-2">Output Size</label>
                <select
                  value={conversionSize}
                  onChange={(event) => setConversionSize(event.currentTarget.value as MediaBunnyConvertOptions['size'])}
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

              <div>
                <label className="block text-sm text-gray-600 mb-2">Frame Rate (FPS)</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={conversionFps}
                    onChange={(event) => setConversionFps(Math.max(5, Math.min(30, parseInt(event.currentTarget.value))))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>5</span>
                    <input
                      type="number"
                      min="5"
                      max="30"
                      value={conversionFps}
                      onChange={(event) =>
                        setConversionFps(Math.max(5, Math.min(30, parseInt(event.currentTarget.value) || 10)))
                      }
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                    />
                    <span>30</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={togglePlayPause}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 transition-colors w-full justify-center"
              >
                {isPlaying ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6,4V20H10V4H6M14,4V20H18V4H14Z" />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                    </svg>
                    Play
                  </>
                )}
              </button>

              <button
                onClick={convertVideoFile}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 font-medium transition-colors disabled:bg-gray-200 disabled:border-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm w-full"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loading className="scale-50" />
                    <span>Converting... {processingProgress > 0 ? `${processingProgress}%` : ''}</span>
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

              <div className="text-xs text-gray-500 text-center mt-3 space-y-1">
                <div>Target format: {targetFormatName}</div>
                <div>Duration: {formatTime(videoDuration)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoConverter;
