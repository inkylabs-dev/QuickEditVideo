import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { FfmpegProvider, useFFmpeg } from '../FFmpegCore';
import { extractFrames, extractFramesInRange } from '../FFmpegUtils/extractFrames';

interface ExtractedFrame {
  time: number;
  data: Uint8Array;
  filename: string;
  blobUrl?: string;
}

const FrameExtractorContent = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'extracting'>('landing');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  
  // Frame extraction settings
  const [extractionMode, setExtractionMode] = useState<'single' | 'range'>('single');
  const [singleTime, setSingleTime] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [interval, setInterval] = useState<string>('1');
  const [frameFormat, setFrameFormat] = useState<'png' | 'jpg'>('png');
  
  // Extracted frames
  const [extractedFrames, setExtractedFrames] = useState<ExtractedFrame[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get FFmpeg context
  const { ffmpeg, isLoaded: ffmpegLoaded, progress, setProgress } = useFFmpeg();

  // Update processing progress from FFmpeg context
  useEffect(() => {
    setProcessingProgress(progress);
  }, [progress]);

  // Clean up blob URLs when component unmounts or frames change
  useEffect(() => {
    return () => {
      extractedFrames.forEach(frame => {
        if (frame.blobUrl) {
          URL.revokeObjectURL(frame.blobUrl);
        }
      });
    };
  }, [extractedFrames]);

  // Handle file selection
  const handleFileSelect = (file: File | null) => {
    if (!file || !file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      return;
    }

    setSelectedFile(file);
    
    // Create video URL for preview
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setCurrentView('extracting');
    
    // Dispatch event to notify page about view change
    document.dispatchEvent(new CustomEvent('frameExtractorViewChange', {
      detail: { currentView: 'extracting' }
    }));
  };

  // Handle video loaded metadata
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  };

  // Convert time string (seconds) to number
  const parseTime = (timeStr: string): number => {
    const time = parseFloat(timeStr);
    return isNaN(time) ? 0 : Math.max(0, time);
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Validate time inputs
  const validateTimes = (): { valid: boolean; message?: string } => {
    if (extractionMode === 'single') {
      const time = parseTime(singleTime);
      if (time < 0 || time > videoDuration) {
        return { valid: false, message: `Time must be between 0 and ${videoDuration.toFixed(1)} seconds` };
      }
    } else {
      const start = parseTime(startTime);
      const end = parseTime(endTime);
      const intervalVal = parseFloat(interval);
      
      if (start < 0 || start > videoDuration) {
        return { valid: false, message: `Start time must be between 0 and ${videoDuration.toFixed(1)} seconds` };
      }
      if (end < 0 || end > videoDuration) {
        return { valid: false, message: `End time must be between 0 and ${videoDuration.toFixed(1)} seconds` };
      }
      if (start >= end) {
        return { valid: false, message: 'Start time must be less than end time' };
      }
      if (intervalVal <= 0) {
        return { valid: false, message: 'Interval must be greater than 0' };
      }
    }
    return { valid: true };
  };

  // Extract frames
  const handleExtractFrames = async () => {
    if (!ffmpeg || !ffmpegLoaded || !selectedFile) return;

    const validation = validateTimes();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setExtractedFrames([]); // Clear previous frames

    try {
      let frames: ExtractedFrame[];

      if (extractionMode === 'single') {
        const time = parseTime(singleTime);
        const result = await extractFrames(ffmpeg, selectedFile, [time], frameFormat);
        frames = result;
      } else {
        const start = parseTime(startTime);
        const end = parseTime(endTime);
        const intervalVal = parseFloat(interval);
        const result = await extractFramesInRange(ffmpeg, selectedFile, start, end, intervalVal, frameFormat);
        frames = result;
      }

      // Create blob URLs for display
      const framesWithUrls = frames.map(frame => ({
        ...frame,
        blobUrl: URL.createObjectURL(new Blob([frame.data], { 
          type: frameFormat === 'png' ? 'image/png' : 'image/jpeg' 
        }))
      }));

      setExtractedFrames(framesWithUrls);

    } catch (error) {
      console.error('Error extracting frames:', error);
      alert('Error extracting frames. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Download frame
  const downloadFrame = (frame: ExtractedFrame) => {
    if (!frame.blobUrl) return;
    
    const a = document.createElement('a');
    a.href = frame.blobUrl;
    a.download = frame.filename;
    a.click();
  };

  // Reset to landing view
  const resetExtraction = () => {
    setSelectedFile(null);
    setVideoUrl('');
    setVideoDuration(0);
    setCurrentView('landing');
    setIsProcessing(false);
    setProcessingProgress(0);
    setExtractedFrames([]);
    setSingleTime('');
    setStartTime('');
    setEndTime('');
    setInterval('1');
    
    // Dispatch event to notify page about view change
    document.dispatchEvent(new CustomEvent('frameExtractorViewChange', {
      detail: { currentView: 'landing' }
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Landing view for file selection
  if (currentView === 'landing') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="M8 12h8"/>
              <path d="M12 8v8"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Extract Frames from Video</h2>
          <p className="text-gray-600 mb-6">Upload a video to extract frames at specific times or intervals</p>
        </div>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-teal-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
            id="video-upload"
          />
          <label htmlFor="video-upload" className="cursor-pointer">
            <div className="text-gray-600 mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">Drop your video here or click to upload</p>
            <p className="text-sm text-gray-500">Supports MP4, WebM, AVI, MOV and more</p>
          </label>
        </div>
        
        {!ffmpegLoaded && (
          <div className="mt-4 text-sm text-yellow-600">
            Loading video processing engine...
          </div>
        )}
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
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            {/* Video Info Bar */}
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                    {selectedFile?.name}
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                    {formatTime(videoDuration)} duration
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Extract Frames</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={resetExtraction}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                  </svg>
                  Reset
                </button>
              </div>
            </div>

            {/* Extraction Mode Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Extraction Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExtractionMode('single')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                    extractionMode === 'single' 
                      ? 'bg-teal-50 border-teal-300 text-teal-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Single Time
                </button>
                <button
                  onClick={() => setExtractionMode('range')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                    extractionMode === 'range' 
                      ? 'bg-teal-50 border-teal-300 text-teal-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Time Range
                </button>
              </div>
            </div>

            {/* Time Input Controls */}
            {extractionMode === 'single' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time (seconds)
                </label>
                <input
                  type="number"
                  value={singleTime}
                  onChange={(e) => setSingleTime(e.target.value)}
                  min="0"
                  max={videoDuration}
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                  placeholder="e.g., 30.5"
                />
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time (seconds)
                  </label>
                  <input
                    type="number"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time (seconds)
                  </label>
                  <input
                    type="number"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    min="0"
                    max={videoDuration}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., 30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    min="0.1"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., 1"
                  />
                </div>
              </div>
            )}

            {/* Frame Format Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Frame Format</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFrameFormat('png')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                    frameFormat === 'png' 
                      ? 'bg-teal-50 border-teal-300 text-teal-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  PNG
                </button>
                <button
                  onClick={() => setFrameFormat('jpg')}
                  className={`flex-1 px-3 py-2 text-sm rounded-md border ${
                    frameFormat === 'jpg' 
                      ? 'bg-teal-50 border-teal-300 text-teal-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  JPG
                </button>
              </div>
            </div>

            {/* Extract Button */}
            <button
              onClick={handleExtractFrames}
              disabled={isProcessing || !ffmpegLoaded}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Extracting... {processingProgress}%
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                  </svg>
                  Extract Frames
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Extracted Frames Section */}
      {extractedFrames.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Extracted Frames ({extractedFrames.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {extractedFrames.map((frame, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-100">
                  {frame.blobUrl && (
                    <img
                      src={frame.blobUrl}
                      alt={`Frame at ${formatTime(frame.time)}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {formatTime(frame.time)}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {frame.filename}
                  </div>
                  <button
                    onClick={() => downloadFrame(frame)}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Main FrameExtractor component with FFmpegProvider
const FrameExtractor = () => {
  return (
    <FfmpegProvider>
      <FrameExtractorContent />
    </FfmpegProvider>
  );
};

export default FrameExtractor;