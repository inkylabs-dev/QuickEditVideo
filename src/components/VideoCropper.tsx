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
  const [scale, setScale] = useState<number>(100);
  
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
      setScale(100); // Initialize scale to 100%
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

  // Calculate scale based on current crop dimensions relative to initial 80% size
  const calculateScale = (width: number, height: number): number => {
    if (!originalWidth || !originalHeight) return 100;
    const initialWidth = Math.round(originalWidth * 0.8);
    const initialHeight = Math.round(originalHeight * 0.8);
    const widthScale = (width / initialWidth) * 100;
    const heightScale = (height / initialHeight) * 100;
    return Math.round((widthScale + heightScale) / 2);
  };

  // Handle scale change - scales both dimensions proportionally
  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    
    if (!originalWidth || !originalHeight) return;
    
    const initialWidth = Math.round(originalWidth * 0.8);
    const initialHeight = Math.round(originalHeight * 0.8);
    const scaleFactor = newScale / 100;
    
    let newWidth = Math.round(initialWidth * scaleFactor);
    let newHeight = Math.round(initialHeight * scaleFactor);
    
    // Apply aspect ratio constraints if needed
    const selectedRatio = aspectRatios.find(ar => ar.value === aspectRatio);
    if (selectedRatio && selectedRatio.ratio !== null) {
      // Maintain aspect ratio when scaling
      const currentRatio = newWidth / newHeight;
      if (Math.abs(currentRatio - selectedRatio.ratio) > 0.01) {
        if (currentRatio > selectedRatio.ratio) {
          newWidth = Math.round(newHeight * selectedRatio.ratio);
        } else {
          newHeight = Math.round(newWidth / selectedRatio.ratio);
        }
      }
    }
    
    // Ensure dimensions don't exceed boundaries
    const maxWidth = originalWidth - cropLeft;
    const maxHeight = originalHeight - cropTop;
    newWidth = Math.min(newWidth, maxWidth);
    newHeight = Math.min(newHeight, maxHeight);
    
    setCropWidth(newWidth);
    setCropHeight(newHeight);
  };

  // Handle crop dimension changes
  const handleCropWidthChange = (width: number) => {
    if (width > 0 && width <= originalWidth - cropLeft) {
      setCropWidth(width);
      
      let finalHeight = cropHeight;
      const selectedRatio = aspectRatios.find(ar => ar.value === aspectRatio);
      if (selectedRatio && selectedRatio.ratio !== null) {
        const newHeight = Math.round(width / selectedRatio.ratio);
        const maxHeight = originalHeight - cropTop;
        finalHeight = Math.min(newHeight, maxHeight);
        setCropHeight(finalHeight);
      }
      
      // Update scale based on new dimensions
      setScale(calculateScale(width, finalHeight));
    }
  };

  const handleCropHeightChange = (height: number) => {
    if (height > 0 && height <= originalHeight - cropTop) {
      setCropHeight(height);
      
      let finalWidth = cropWidth;
      const selectedRatio = aspectRatios.find(ar => ar.value === aspectRatio);
      if (selectedRatio && selectedRatio.ratio !== null) {
        const newWidth = Math.round(height * selectedRatio.ratio);
        const maxWidth = originalWidth - cropLeft;
        finalWidth = Math.min(newWidth, maxWidth);
        setCropWidth(finalWidth);
      }
      
      // Update scale based on new dimensions
      setScale(calculateScale(finalWidth, height));
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
    setScale(100); // Reset scale to 100%
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

      // Validate crop parameters
      if (cropWidth <= 0 || cropHeight <= 0) {
        throw new Error('Invalid crop dimensions');
      }
      if (cropLeft < 0 || cropTop < 0) {
        throw new Error('Invalid crop position');
      }
      if (cropLeft + cropWidth > originalWidth || cropTop + cropHeight > originalHeight) {
        throw new Error('Crop area exceeds video boundaries');
      }

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

      // Build FFmpeg command for rotated crop area
      let filterChain = '';
      
      if (rotation !== 0) {
        // For rotated crop: rotate video first, then crop from rotated video
        // This extracts the tilted area as it appears in the original video
        const radians = (rotation * Math.PI) / 180;
        
        // Calculate video center
        const centerX = originalWidth / 2;
        const centerY = originalHeight / 2;
        
        // Calculate crop area center  
        const cropCenterX = cropLeft + cropWidth / 2;
        const cropCenterY = cropTop + cropHeight / 2;
        
        // Transform crop coordinates for rotated video
        // When we rotate the video, the crop area position changes
        const cos = Math.cos(-radians); // negative because we rotate video opposite direction
        const sin = Math.sin(-radians);
        
        // Translate to origin, rotate, translate back
        const relativeX = cropCenterX - centerX;
        const relativeY = cropCenterY - centerY;
        
        const rotatedX = relativeX * cos - relativeY * sin;
        const rotatedY = relativeX * sin + relativeY * cos;
        
        const newCropCenterX = rotatedX + centerX;
        const newCropCenterY = rotatedY + centerY;
        
        // Calculate new crop position (top-left corner)
        const newCropLeft = Math.round(newCropCenterX - cropWidth / 2);
        const newCropTop = Math.round(newCropCenterY - cropHeight / 2);
        
        // Rotate the entire video first
        filterChain = `rotate=${radians}:fillcolor=black:out_w=${originalWidth}:out_h=${originalHeight}`;
        
        // Then crop from the rotated video using transformed coordinates
        filterChain += `,crop=${cropWidth}:${cropHeight}:${newCropLeft}:${newCropTop}`;
        
        console.log('Transformed crop coordinates:', { 
          original: { cropLeft, cropTop, cropCenterX, cropCenterY },
          rotated: { newCropLeft, newCropTop, newCropCenterX, newCropCenterY }
        });
      } else {
        // No rotation, just crop normally
        filterChain = `crop=${cropWidth}:${cropHeight}:${cropLeft}:${cropTop}`;
      }

      console.log('FFmpeg filter chain:', filterChain);
      console.log('Crop parameters:', { cropWidth, cropHeight, cropLeft, cropTop, rotation });

      try {
        await ffmpeg.run(
          '-i', inputFile,
          '-vf', filterChain,
          '-c:a', 'copy', // Copy audio without re-encoding
          outputFile
        );
      } catch (ffmpegError) {
        console.error('FFmpeg processing error:', ffmpegError);
        
        // Try without audio copy if that was the issue
        console.log('Retrying without audio copy...');
        await ffmpeg.run(
          '-i', inputFile,
          '-vf', filterChain,
          outputFile
        );
      }

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

    // Get the container dimensions (the parent div of the video)
    const container = videoElement.parentElement;
    if (!container) {
      return {
        left: '20%',
        top: '20%',
        width: '60%',
        height: '60%'
      };
    }
    const containerRect = container.getBoundingClientRect();

    // Calculate the actual displayed video dimensions based on container, not rotated video
    // This ensures consistent sizing regardless of rotation
    const videoAspectRatio = originalWidth / originalHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;

    let displayedVideoWidth: number, displayedVideoHeight: number, offsetX = 0, offsetY = 0;

    if (videoAspectRatio > containerAspectRatio) {
      // Video is wider, fit to width
      displayedVideoWidth = containerRect.width;
      displayedVideoHeight = containerRect.width / videoAspectRatio;
      offsetY = (containerRect.height - displayedVideoHeight) / 2;
    } else {
      // Video is taller, fit to height
      displayedVideoHeight = containerRect.height;
      displayedVideoWidth = containerRect.height * videoAspectRatio;
      offsetX = (containerRect.width - displayedVideoWidth) / 2;
    }

    // Calculate crop box position and size as percentages relative to container
    const cropLeftPercent = ((cropLeft / originalWidth) * displayedVideoWidth + offsetX) / containerRect.width * 100;
    const cropTopPercent = ((cropTop / originalHeight) * displayedVideoHeight + offsetY) / containerRect.height * 100;
    const cropWidthPercent = (cropWidth / originalWidth) * (displayedVideoWidth / containerRect.width) * 100;
    const cropHeightPercent = (cropHeight / originalHeight) * (displayedVideoHeight / containerRect.height) * 100;

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
            <div className="relative bg-black w-full">
              <video 
                ref={videoRef}
                className="w-full h-full object-contain" 
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                preload="metadata"
                src={videoUrl}
                onLoadedMetadata={handleVideoLoaded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>
              
              {/* Crop Overlay */}
              <div key={overlayKey} className="absolute inset-0 pointer-events-none z-10">
                {(() => {
                  const cropStyle = getCropOverlayStyle();
                  
                  return (
                    <>
                      {/* Fixed crop area with large shadow to create overlay effect */}
                      <div 
                        className="absolute bg-transparent"
                        style={{
                          ...cropStyle,
                          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                        }}
                      ></div>
                      
                      {/* Teal crop box border - stays fixed */}
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
            <div className="p-3 border-t border-gray-200 bg-white relative z-20">
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
              <div className="flex gap-3 overflow-x-auto pb-8 scrollbar-hide" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                {aspectRatios.map(ar => (
                  <button
                    key={ar.value}
                    onClick={() => handleAspectRatioChange(ar.value)}
                    className={`flex-shrink-0 w-16 h-16 border-2 transition-all rounded-lg flex items-center justify-center relative ${
                      aspectRatio === ar.value 
                        ? 'border-teal-600 bg-teal-50' 
                        : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50'
                    }`}
                    title={ar.label}
                  >
                    {ar.value === 'freeform' ? (
                      // Four corner lines for freeform
                      <div className="relative w-8 h-8">
                        {/* Top-left corner */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-gray-400"></div>
                        {/* Top-right corner */}
                        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-gray-400"></div>
                        {/* Bottom-left corner */}
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-gray-400"></div>
                        {/* Bottom-right corner */}
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-gray-400"></div>
                      </div>
                    ) : (
                      // Visual aspect ratio box
                      <div 
                        className={`border-2 ${aspectRatio === ar.value ? 'border-teal-600' : 'border-gray-400'}`}
                        style={{
                          width: ar.ratio && ar.ratio > 1 ? '24px' : `${24 * (ar.ratio || 1)}px`,
                          height: ar.ratio && ar.ratio < 1 ? '24px' : `${24 / (ar.ratio || 1)}px`,
                          maxWidth: '24px',
                          maxHeight: '24px'
                        }}
                      ></div>
                    )}
                    
                    {/* Label below the visual */}
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                      {ar.label}
                    </div>
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
                  onInput={(e) => setRotation(parseInt(e.target.value))}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-300 rounded appearance-none outline-none range-slider"
                />
                <div className="text-sm font-medium text-gray-900 min-w-[50px]">{rotation}°</div>
              </div>
            </div>

            {/* Scale Control */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Scale</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  step="1"
                  value={scale}
                  onInput={(e) => handleScaleChange(parseInt(e.target.value))}
                  onChange={(e) => handleScaleChange(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-300 rounded appearance-none outline-none range-slider"
                />
                <div className="text-sm font-medium text-gray-900 min-w-[50px]">{scale}%</div>
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