import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';

interface AspectRatio {
  label: string;
  value: string;
  ratio: number | null;
}

const VideoCropper = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'cropping'>('landing');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  
  // Crop settings
  const [aspectRatio, setAspectRatio] = useState<string>('freeform');
  const [cropWidth, setCropWidth] = useState<number>(0);
  const [cropHeight, setCropHeight] = useState<number>(0);
  const [cropLeft, setCropLeft] = useState<number>(0);
  const [cropTop, setCropTop] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [ffmpeg, setFfmpeg] = useState<any>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [originalFormat, setOriginalFormat] = useState<string>('mp4');
  const [overlayKey, setOverlayKey] = useState<number>(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Aspect ratio options
  const aspectRatios: AspectRatio[] = [
    { label: 'Freeform', value: 'freeform', ratio: null },
    { label: '1:1', value: '1:1', ratio: 1 },
    { label: '16:9', value: '16:9', ratio: 16/9 },
    { label: '9:16', value: '9:16', ratio: 9/16 },
    { label: '5:4', value: '5:4', ratio: 5/4 },
    { label: '4:5', value: '4:5', ratio: 4/5 },
    { label: '4:3', value: '4:3', ratio: 4/3 },
    { label: '3:4', value: '3:4', ratio: 3/4 },
    { label: '3:2', value: '3:2', ratio: 3/2 },
    { label: '2:3', value: '2:3', ratio: 2/3 }
  ];

  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        if (!(window as any).FFmpeg) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.10.1/dist/ffmpeg.min.js';
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const { createFFmpeg } = (window as any).FFmpeg;
        const ffmpegInstance = createFFmpeg({ 
          log: true,
          progress: ({ ratio }: { ratio: number }) => {
            if (ratio > 0) {
              setProcessingProgress(Math.round(ratio * 100));
            }
          },
          corePath: 'https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
        });
        
        await ffmpegInstance.load();
        setFfmpeg(ffmpegInstance);
        setFfmpegLoaded(true);
      } catch (error) {
        console.error('Failed to load FFmpeg:', error);
      }
    };
    
    loadFFmpeg();
  }, []);

  // Update overlay when crop values change
  useEffect(() => {
    setOverlayKey(prev => prev + 1);
  }, [cropWidth, cropHeight, cropLeft, cropTop, originalWidth, originalHeight]);

  // Handle file selection
  const handleFileSelect = (file: File | null) => {
    if (!file || !file.type.startsWith('video/')) {
      alert('Please select a valid video file.');
      return;
    }

    setSelectedFile(file);
    
    // Detect original format from file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const detectedFormat = fileExtension === 'mov' ? 'mov' : 
                          fileExtension === 'mkv' ? 'mkv' :
                          fileExtension === 'avi' ? 'avi' :
                          fileExtension === 'webm' ? 'webm' :
                          'mp4'; // default to mp4
    
    setOriginalFormat(detectedFormat);
    
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setCurrentView('cropping');
    
    // Dispatch event to notify page about view change
    document.dispatchEvent(new CustomEvent('videoCropperViewChange', {
      detail: { currentView: 'cropping' }
    }));
  };

  // Handle video metadata loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      
      setVideoDuration(duration);
      setOriginalWidth(width);
      setOriginalHeight(height);
      
      // Initialize crop to center 80% of video
      const initialWidth = Math.round(width * 0.8);
      const initialHeight = Math.round(height * 0.8);
      setCropWidth(initialWidth);
      setCropHeight(initialHeight);
      setCropLeft(Math.round((width - initialWidth) / 2));
      setCropTop(Math.round((height - initialHeight) / 2));
    }
  };

  // Utility functions
  const formatTime = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Handle aspect ratio change
  const handleAspectRatioChange = (newRatio: string) => {
    setAspectRatio(newRatio);
    
    const selectedRatio = aspectRatios.find(ar => ar.value === newRatio);
    if (selectedRatio && selectedRatio.ratio !== null) {
      // Calculate maximum possible dimensions for this aspect ratio
      let maxWidth: number, maxHeight: number;
      
      // Try filling to full width first
      const widthBasedHeight = Math.round(originalWidth / selectedRatio.ratio);
      if (widthBasedHeight <= originalHeight) {
        // Width-constrained: use full width
        maxWidth = originalWidth;
        maxHeight = widthBasedHeight;
      } else {
        // Height-constrained: use full height
        maxHeight = originalHeight;
        maxWidth = Math.round(originalHeight * selectedRatio.ratio);
      }
      
      // Center the crop area
      const newCropLeft = Math.round((originalWidth - maxWidth) / 2);
      const newCropTop = Math.round((originalHeight - maxHeight) / 2);
      
      setCropWidth(maxWidth);
      setCropHeight(maxHeight);
      setCropLeft(newCropLeft);
      setCropTop(newCropTop);
    }
  };

  // Handle crop dimension changes
  const handleCropWidthChange = (width: number) => {
    if (width > 0 && width <= originalWidth - cropLeft) {
      setCropWidth(width);
      
      const selectedRatio = aspectRatios.find(ar => ar.value === aspectRatio);
      if (selectedRatio && selectedRatio.ratio !== null) {
        const newHeight = Math.round(width / selectedRatio.ratio);
        const maxHeight = originalHeight - cropTop;
        setCropHeight(Math.min(newHeight, maxHeight));
      }
    }
  };

  const handleCropHeightChange = (height: number) => {
    if (height > 0 && height <= originalHeight - cropTop) {
      setCropHeight(height);
      
      const selectedRatio = aspectRatios.find(ar => ar.value === aspectRatio);
      if (selectedRatio && selectedRatio.ratio !== null) {
        const newWidth = Math.round(height * selectedRatio.ratio);
        const maxWidth = originalWidth - cropLeft;
        setCropWidth(Math.min(newWidth, maxWidth));
      }
    }
  };

  const handleCropLeftChange = (left: number) => {
    if (left >= 0 && left + cropWidth <= originalWidth) {
      setCropLeft(left);
    }
  };

  const handleCropTopChange = (top: number) => {
    if (top >= 0 && top + cropHeight <= originalHeight) {
      setCropTop(top);
    }
  };

  // Reset crop to center 80%
  const resetCrop = () => {
    const initialWidth = Math.round(originalWidth * 0.8);
    const initialHeight = Math.round(originalHeight * 0.8);
    setCropWidth(initialWidth);
    setCropHeight(initialHeight);
    setCropLeft(Math.round((originalWidth - initialWidth) / 2));
    setCropTop(Math.round((originalHeight - initialHeight) / 2));
    setAspectRatio('freeform');
    setRotation(0);
  };

  // Crop and download video
  const cropVideo = async () => {
    if (!ffmpeg || !ffmpegLoaded || !selectedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const { fetchFile } = (window as any).FFmpeg;
      const inputExt = selectedFile.name.split('.').pop();
      const inputFile = `input.${inputExt}`;
      const outputFile = `${selectedFile.name.split('.')[0]}_cropped.${originalFormat}`;

      ffmpeg.FS('writeFile', inputFile, await fetchFile(selectedFile));

      // Get MIME type for the output format
      const getMimeType = (fmt: string): string => {
        switch (fmt) {
          case 'mov': return 'video/quicktime';
          case 'mkv': return 'video/x-matroska';
          case 'avi': return 'video/x-msvideo';
          case 'webm': return 'video/webm';
          default: return 'video/mp4';
        }
      };

      // Build FFmpeg command with rotation and crop
      let filterChain = '';
      
      if (rotation !== 0) {
        // Convert rotation to radians for FFmpeg
        const radians = (rotation * Math.PI) / 180;
        filterChain = `rotate=${radians}:fillcolor=black:ow=rotw(${radians}):oh=roth(${radians}),`;
      }
      
      filterChain += `crop=${cropWidth}:${cropHeight}:${cropLeft}:${cropTop}`;

      await ffmpeg.run(
        '-i', inputFile,
        '-vf', filterChain,
        '-c:a', 'copy', // Copy audio without re-encoding
        outputFile
      );

      const data = ffmpeg.FS('readFile', outputFile);
      const blob = new Blob([data.buffer], { type: getMimeType(originalFormat) });
      
      // Download file
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = outputFile;
      a.click();
      URL.revokeObjectURL(a.href);

      // Cleanup
      ffmpeg.FS('unlink', inputFile);
      ffmpeg.FS('unlink', outputFile);

    } catch (error) {
      console.error('Error cropping video:', error);
      alert('Error processing video. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
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

  // Calculate crop overlay position and size
  const getCropOverlayStyle = (): JSX.CSSProperties => {
    if (!videoRef.current || !originalWidth || !originalHeight) {
      return {
        left: '20%',
        top: '20%',
        width: '60%',
        height: '60%'
      };
    }

    const videoElement = videoRef.current;
    const videoRect = videoElement.getBoundingClientRect();

    // Calculate the actual displayed video dimensions (accounting for object-contain)
    const videoAspectRatio = originalWidth / originalHeight;
    const containerAspectRatio = videoRect.width / videoRect.height;

    let displayedVideoWidth: number, displayedVideoHeight: number, offsetX = 0, offsetY = 0;

    if (videoAspectRatio > containerAspectRatio) {
      // Video is wider, fit to width
      displayedVideoWidth = videoRect.width;
      displayedVideoHeight = videoRect.width / videoAspectRatio;
      offsetY = (videoRect.height - displayedVideoHeight) / 2;
    } else {
      // Video is taller, fit to height
      displayedVideoHeight = videoRect.height;
      displayedVideoWidth = videoRect.height * videoAspectRatio;
      offsetX = (videoRect.width - displayedVideoWidth) / 2;
    }

    // Calculate crop box position and size as percentages
    const cropLeftPercent = ((cropLeft / originalWidth) * displayedVideoWidth + offsetX) / videoRect.width * 100;
    const cropTopPercent = ((cropTop / originalHeight) * displayedVideoHeight + offsetY) / videoRect.height * 100;
    const cropWidthPercent = (cropWidth / originalWidth) * (displayedVideoWidth / videoRect.width) * 100;
    const cropHeightPercent = (cropHeight / originalHeight) * (displayedVideoHeight / videoRect.height) * 100;

    return {
      left: `${cropLeftPercent}%`,
      top: `${cropTopPercent}%`,
      width: `${cropWidthPercent}%`,
      height: `${cropHeightPercent}%`
    };
  };

  const handleDrop = (e: JSX.TargetedDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  };

  const handleDragOver = (e: JSX.TargetedDragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  if (currentView === 'landing') {
    return (
      <div className="bg-white rounded-lg border-4 border-dashed border-gray-900 hover:border-gray-900 transition-colors">
        <div 
          className="p-16 text-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
        >
          <input 
            type="file" 
            accept="video/*" 
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
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
            <div className="relative bg-black max-h-[calc(100vh-400px)] md:max-h-[calc(100vh-400px)] max-md:max-h-[40vh]">
              <video 
                ref={videoRef}
                className="w-full h-full object-contain" 
                preload="metadata"
                src={videoUrl}
                onLoadedMetadata={handleVideoLoaded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>
              
              {/* Crop Overlay */}
              <div key={overlayKey} className="absolute inset-0 pointer-events-none">
                {(() => {
                  const cropStyle = getCropOverlayStyle();
                  return (
                    <>
                      {/* Dark overlay for non-cropped areas - split into 4 sections */}
                      {/* Top section */}
                      <div className="absolute bg-black bg-opacity-50" style={{
                        left: '0%',
                        top: '0%',
                        width: '100%',
                        height: cropStyle.top
                      }}></div>
                      
                      {/* Bottom section */}
                      <div className="absolute bg-black bg-opacity-50" style={{
                        left: '0%',
                        top: `calc(${cropStyle.top} + ${cropStyle.height})`,
                        width: '100%',
                        height: `calc(100% - ${cropStyle.top} - ${cropStyle.height})`
                      }}></div>
                      
                      {/* Left section */}
                      <div className="absolute bg-black bg-opacity-50" style={{
                        left: '0%',
                        top: cropStyle.top,
                        width: cropStyle.left,
                        height: cropStyle.height
                      }}></div>
                      
                      {/* Right section */}
                      <div className="absolute bg-black bg-opacity-50" style={{
                        left: `calc(${cropStyle.left} + ${cropStyle.width})`,
                        top: cropStyle.top,
                        width: `calc(100% - ${cropStyle.left} - ${cropStyle.width})`,
                        height: cropStyle.height
                      }}></div>
                      
                      {/* Teal crop box border only */}
                      <div 
                        className="absolute border-2 border-teal-400 transition-all duration-200"
                        style={cropStyle}
                      >
                        {/* Corner indicators */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-teal-400 border border-white rounded-full"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 border border-white rounded-full"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-teal-400 border border-white rounded-full"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-teal-400 border border-white rounded-full"></div>
                        
                        {/* Center label */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-teal-600 text-white px-2 py-1 rounded text-xs font-medium">
                          Crop Area
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            {/* Video Info Bar */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                  {selectedFile?.name}
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
                  {originalWidth}×{originalHeight} → {cropWidth}×{cropHeight}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Crop Controls</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={resetCrop}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
                  </svg>
                  Reset
                </button>
                <button 
                  onClick={() => {
                    setCurrentView('landing');
                    // Dispatch event to notify page about view change
                    document.dispatchEvent(new CustomEvent('videoCropperViewChange', {
                      detail: { currentView: 'landing' }
                    }));
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  title="Choose different video"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Aspect Ratio Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-1">
                {aspectRatios.map(ar => (
                  <button
                    key={ar.value}
                    onClick={() => handleAspectRatioChange(ar.value)}
                    className={`px-3 py-2 text-sm font-medium border-2 transition-all rounded ${
                      aspectRatio === ar.value 
                        ? 'border-teal-600 bg-teal-600 text-white' 
                        : 'border-gray-200 bg-white text-gray-900 hover:border-teal-600 hover:bg-teal-50'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rotation Control */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rotation</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-300 rounded appearance-none outline-none range-slider"
                />
                <div className="text-sm font-medium text-gray-900 min-w-[50px]">{rotation}°</div>
              </div>
            </div>

            {/* Crop Dimension Controls */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={originalWidth}
                    value={cropWidth}
                    onChange={(e) => handleCropWidthChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={originalHeight}
                    value={cropHeight}
                    onChange={(e) => handleCropHeightChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Left</label>
                  <input 
                    type="number" 
                    min="0" 
                    max={originalWidth - cropWidth}
                    value={cropLeft}
                    onChange={(e) => handleCropLeftChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Top</label>
                  <input 
                    type="number" 
                    min="0" 
                    max={originalHeight - cropHeight}
                    value={cropTop}
                    onChange={(e) => handleCropTopChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={togglePlayPause}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 transition-colors w-full justify-center"
              >
                {isPlaying ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6,4V20H10V4H6M14,4V20H18V4H14Z"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                  </svg>
                )}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <button 
                onClick={cropVideo}
                disabled={isProcessing || !ffmpegLoaded}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 font-medium transition-colors disabled:bg-gray-200 disabled:border-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm w-full"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 -rotate-90" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" className="transition-all duration-100 ease-linear"
                        style={{ 
                          strokeDasharray: '251.2', 
                          strokeDashoffset: 251.2 - (processingProgress / 100) * 251.2 
                        }} />
                    </svg>
                    <span>Processing {processingProgress}%</span>
                  </div>
                ) : ffmpegLoaded ? (
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                    </svg>
                    Download {originalFormat.toUpperCase()}
                  </div>
                ) : (
                  'Loading...'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Crop Information Section */}
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Crop Information</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-600 mb-1">Original</div>
              <div className="font-medium text-gray-900">{originalWidth} × {originalHeight}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 mb-1">Crop Size</div>
              <div className="font-medium text-teal-600">{cropWidth} × {cropHeight}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 mb-1">Position</div>
              <div className="font-medium text-gray-900">{cropLeft}, {cropTop}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-600 mb-1">Rotation</div>
              <div className="font-medium text-gray-900">{rotation}°</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCropper;