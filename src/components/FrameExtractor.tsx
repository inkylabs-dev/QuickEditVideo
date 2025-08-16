import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { FfmpegProvider, useFFmpeg } from '../FFmpegCore';
import { extractFrames, extractFramesInRange } from '../FFmpegUtils/extractFrames';
import Loading from './Loading';
import JSZip from 'jszip';

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
  const [singleTime, setSingleTime] = useState<string>('0');
  const [startTime, setStartTime] = useState<string>('0');
  const [endTime, setEndTime] = useState<string>('1');
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

  // Validate time inputs with stricter boundary checks
  const validateTimes = (): { valid: boolean; message?: string } => {
    if (videoDuration === 0) {
      return { valid: false, message: 'Video duration not available. Please wait for video to load.' };
    }

    if (extractionMode === 'single') {
      const time = parseTime(singleTime);
      if (time < 0) {
        return { valid: false, message: 'Time cannot be negative' };
      }
      if (time > videoDuration) {
        return { valid: false, message: `Time cannot exceed video duration (${videoDuration.toFixed(1)}s)` };
      }
    } else {
      const start = parseTime(startTime);
      const end = parseTime(endTime);
      const intervalValue = parseFloat(interval) || 1;
      
      if (start < 0) {
        return { valid: false, message: 'Start time cannot be negative' };
      }
      if (start > videoDuration) {
        return { valid: false, message: `Start time cannot exceed video duration (${videoDuration.toFixed(1)}s)` };
      }
      if (end < 0) {
        return { valid: false, message: 'End time cannot be negative' };
      }
      if (end > videoDuration) {
        return { valid: false, message: `End time cannot exceed video duration (${videoDuration.toFixed(1)}s)` };
      }
      if (start >= end) {
        return { valid: false, message: 'Start time must be less than end time' };
      }
      if (intervalValue <= 0) {
        return { valid: false, message: 'Distance between frames must be greater than 0' };
      }
    }
    return { valid: true };
  };

  // Extract frames
  const handleExtractFrames = async () => {
    if (!ffmpeg || !ffmpeg.current || !ffmpegLoaded || !selectedFile) return;

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
        const result = await extractFrames(ffmpeg.current, selectedFile, [time], frameFormat);
        frames = result;
      } else {
        const start = parseTime(startTime);
        const end = parseTime(endTime);
        const intervalSeconds = parseFloat(interval) || 1;
        // Use customizable interval for range extraction
        const result = await extractFramesInRange(ffmpeg.current, selectedFile, start, end, intervalSeconds, frameFormat);
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

  // Download all frames as ZIP (only for multiple frames)
  const downloadAllFrames = async () => {
    if (extractedFrames.length <= 1) return;
    
    try {
      const zip = new JSZip();
      
      // Add each frame to the ZIP
      for (const frame of extractedFrames) {
        zip.file(frame.filename, frame.data);
      }
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extracted-frames-${extractedFrames.length}-frames.zip`;
      a.click();
      
      // Clean up URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error creating ZIP file:', error);
      alert('Error creating ZIP file. Please try again.');
    }
  };

  // Reset extraction parameters to default values (but keep selected file)
  const resetExtraction = () => {
    setIsProcessing(false);
    setProcessingProgress(0);
    setExtractedFrames([]);
    setSingleTime('0');
    setStartTime('0');
    setEndTime('1');
    setInterval('1');
    setFrameFormat('png');
  };

  // Close and return to landing view (reset everything)
  const closeExtraction = () => {
    setSelectedFile(null);
    setVideoUrl('');
    setVideoDuration(0);
    setCurrentView('landing');
    setIsProcessing(false);
    setProcessingProgress(0);
    setExtractedFrames([]);
    setSingleTime('0');
    setStartTime('0');
    setEndTime('1');
    setInterval('1');
    setFrameFormat('png');
    
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
      <div className="bg-white rounded-lg border-4 border-dashed border-gray-900 hover:border-gray-900 transition-colors">
        <div 
          className="p-16 text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFileSelect(files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
            id="video-upload"
          />
          <div className="mb-6">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-400">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14,2 14,8 20,8"/>
              <path d="M10 15.5L16 12L10 8.5V15.5Z"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Select your video</h3>
          <p className="text-gray-600 mb-6">Drop a video file here or click to browse</p>
          <div className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 px-6 py-3 font-medium transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            Choose file
          </div>
          <p className="text-xs text-gray-500 mt-4">Supports MP4, WebM, AVI, MOV and more</p>
        </div>
        
        {!ffmpegLoaded && (
          <div className="mt-4 text-sm text-yellow-600 text-center">
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
                <div className="text-xs text-gray-500">
                  {selectedFile && `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Max duration: {videoDuration.toFixed(1)}s • Use times between 0 and {videoDuration.toFixed(1)} seconds
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
            {/* Tab Header */}
            <div className="border-b border-gray-200">
              <div className="flex">
                <button 
                  onClick={() => setExtractionMode('single')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    extractionMode === 'single' 
                      ? 'border-teal-500 text-teal-600 bg-teal-50' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Single Time
                </button>
                <button 
                  onClick={() => setExtractionMode('range')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    extractionMode === 'range' 
                      ? 'border-teal-500 text-teal-600 bg-teal-50' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Time Range
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Extract Frames</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={resetExtraction}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                    title="Reset parameters to default"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                    </svg>
                    Reset
                  </button>
                  <button 
                    onClick={closeExtraction}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center w-6 h-6"
                    title="Close and select new file"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {extractionMode === 'single' ? (
                /* Single Time Tab */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time (seconds)
                    </label>
                    <input
                      type="number"
                      value={singleTime}
                      onChange={(e) => setSingleTime(e.target.value)}
                      min="0"
                      max={videoDuration.toString()}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      placeholder="0"
                    />
                  </div>

                  {/* Frame Format Selection */}
                  <div>
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
                    className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-200 text-gray-900 border-2 border-gray-900 disabled:border-gray-400 disabled:text-gray-500 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loading className="w-4 h-4" />
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
              ) : (
                /* Time Range Tab */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time (seconds)
                    </label>
                    <input
                      type="number"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      min="0"
                      max={videoDuration.toString()}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., 0"
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
                      max={videoDuration.toString()}
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distance between frames (seconds)
                    </label>
                    <input
                      type="number"
                      value={interval}
                      onChange={(e) => setInterval(e.target.value)}
                      min="0.1"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      placeholder="1"
                    />
                  </div>

                  {/* Frame Format Selection */}
                  <div>
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
                    className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-200 text-gray-900 border-2 border-gray-900 disabled:border-gray-400 disabled:text-gray-500 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loading className="w-4 h-4" />
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
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Frames Section */}
      {extractedFrames.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Extracted Frames ({extractedFrames.length})
            </h3>
            {extractedFrames.length > 1 && (
              <button
                onClick={downloadAllFrames}
                title="Download all frames as ZIP"
                className="bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 p-2 rounded-md transition-colors flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                </svg>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 text-sm font-medium py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-1"
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