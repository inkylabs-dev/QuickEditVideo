import { useState, useEffect, useRef } from 'react';
import type { CSSProperties, DragEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import ControlPanel from './ControlPanel';
import { SelectFile } from './SelectFile';
import { cropVideoWithMediaBunny, type CropOutputFormat } from '../utils/cropVideoWithMediaBunny';

interface AspectRatio {
  label: string;
  value: string;
  ratio: number | null;
}

// Utility functions for aspect ratio calculations
const INITIAL_CROP_FACTOR = 0.8;

const calculateAspectRatioDimensions = (
  aspectRatio: string, 
  aspectRatios: AspectRatio[], 
  baseWidth: number, 
  baseHeight: number
) => {
  const selectedRatio = aspectRatios.find(ar => ar.value === aspectRatio);
  
  if (!selectedRatio || selectedRatio.ratio === null) {
    return { width: baseWidth, height: baseHeight };
  }

  const ratio = selectedRatio.ratio;
  const currentRatio = baseWidth / baseHeight;
  
  if (Math.abs(currentRatio - ratio) > 0.01) {
    if (currentRatio > ratio) {
      return { width: Math.round(baseHeight * ratio), height: baseHeight };
    } else {
      return { width: baseWidth, height: Math.round(baseWidth / ratio) };
    }
  }
  
  return { width: baseWidth, height: baseHeight };
};

const constrainDimensions = (
  width: number, 
  height: number, 
  maxWidth: number, 
  maxHeight: number,
  left: number = 0,
  top: number = 0
) => {
  const constrainedWidth = Math.min(width, maxWidth - left);
  const constrainedHeight = Math.min(height, maxHeight - top);
  return { width: constrainedWidth, height: constrainedHeight };
};

const calculateScale = (currentWidth: number, currentHeight: number, originalWidth: number, originalHeight: number) => {
  const initialWidth = Math.round(originalWidth * INITIAL_CROP_FACTOR);
  const initialHeight = Math.round(originalHeight * INITIAL_CROP_FACTOR);
  const widthScale = (currentWidth / initialWidth) * 100;
  const heightScale = (currentHeight / initialHeight) * 100;
  return Math.round(Math.min(widthScale, heightScale));
};

const SUPPORTED_CROP_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'mkv']);

function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ?? '';
}

const VideoCropperContent = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'cropping'>('landing');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Crop settings
  const [aspectRatio, setAspectRatio] = useState<string>('freeform');
  const [cropWidth, setCropWidth] = useState<number>(0);
  const [cropHeight, setCropHeight] = useState<number>(0);
  const [cropLeft, setCropLeft] = useState<number>(0);
  const [cropTop, setCropTop] = useState<number>(0);
  const [scale, setScale] = useState<number>(100);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [originalFormat, setOriginalFormat] = useState<CropOutputFormat>('mp4');
  const [overlayKey, setOverlayKey] = useState<number>(0);
  
  // Drag state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; cropLeft: number; cropTop: number }>({ x: 0, y: 0, cropLeft: 0, cropTop: 0 });
  
  // Resize state
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; cropWidth: number; cropHeight: number; cropLeft: number; cropTop: number }>({ 
    x: 0, y: 0, cropWidth: 0, cropHeight: 0, cropLeft: 0, cropTop: 0 
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Update overlay when crop values change
  useEffect(() => {
    setOverlayKey(prev => prev + 1);
  }, [cropWidth, cropHeight, cropLeft, cropTop, originalWidth, originalHeight]);

  // Handle file selection from SelectFile component
  const handleFileSelect = (file: File | FileList | null) => {
    // Return early if no file selected
    setErrorMessage('');
    if (!file) {
      return;
    }
    
    // SelectFile ensures file is validated before calling this
    const selectedFile = file as File;

    setSelectedFile(selectedFile);
    
    // Detect original format from file extension
    const fileExtension = getFileExtension(selectedFile.name);
    setOriginalFormat((SUPPORTED_CROP_EXTENSIONS.has(fileExtension) ? fileExtension : 'mp4') as CropOutputFormat);
    
    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
    setCurrentView('cropping');
    
    // Dispatch event to notify page about view change
    document.dispatchEvent(new CustomEvent('videoCropperViewChange', {
      detail: { currentView: 'cropping' }
    }));
  };

  // Video file validation function
  const validateVideoFile = (file: File): boolean => {
    if (!file.type.startsWith('video/')) return false;
    const ext = getFileExtension(file.name);
    return SUPPORTED_CROP_EXTENSIONS.has(ext);
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
      const initialWidth = Math.round(width * INITIAL_CROP_FACTOR);
      const initialHeight = Math.round(height * INITIAL_CROP_FACTOR);
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

  // Handle aspect ratio change - simplified with utility functions
  const handleAspectRatioChange = (newRatio: string) => {
    setAspectRatio(newRatio);
    
    const selectedRatio = aspectRatios.find(ar => ar.value === newRatio);
    if (selectedRatio && selectedRatio.ratio !== null) {
      // Calculate maximum dimensions that fit the video with this aspect ratio
      const { width: maxWidth, height: maxHeight } = calculateAspectRatioDimensions(
        newRatio, aspectRatios, originalWidth, originalHeight
      );
      
      // Center the crop area
      const newCropLeft = Math.round((originalWidth - maxWidth) / 2);
      const newCropTop = Math.round((originalHeight - maxHeight) / 2);
      
      setCropWidth(maxWidth);
      setCropHeight(maxHeight);
      setCropLeft(newCropLeft);
      setCropTop(newCropTop);
    }
  };

  // Handle scale change - simplified with utility functions
  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
    
    if (!originalWidth || !originalHeight) return;
    
    const initialWidth = Math.round(originalWidth * INITIAL_CROP_FACTOR);
    const initialHeight = Math.round(originalHeight * INITIAL_CROP_FACTOR);
    const scaleFactor = newScale / 100;
    
    let newWidth = Math.round(initialWidth * scaleFactor);
    let newHeight = Math.round(initialHeight * scaleFactor);
    
    // Apply aspect ratio constraints
    const dimensions = calculateAspectRatioDimensions(aspectRatio, aspectRatios, newWidth, newHeight);
    
    // Constrain to video boundaries
    const constrained = constrainDimensions(
      dimensions.width, dimensions.height, originalWidth, originalHeight, cropLeft, cropTop
    );
    
    setCropWidth(constrained.width);
    setCropHeight(constrained.height);
  };

  // Generic crop change handler - consolidates repetitive logic
  const handleCropChange = (dimension: 'width' | 'height' | 'left' | 'top', value: number) => {
    const setters = {
      width: setCropWidth,
      height: setCropHeight,
      left: setCropLeft,
      top: setCropTop
    };

    const bounds = {
      width: { min: 1, max: originalWidth - cropLeft },
      height: { min: 1, max: originalHeight - cropTop },
      left: { min: 0, max: originalWidth - cropWidth },
      top: { min: 0, max: originalHeight - cropHeight }
    };

    // Validate bounds
    if (value < bounds[dimension].min || value > bounds[dimension].max) return;

    // Update the dimension
    setters[dimension](value);

    // Handle aspect ratio constraints for width/height changes
    if (dimension === 'width' || dimension === 'height') {
      const selectedRatio = aspectRatios.find(ar => ar.value === aspectRatio);
      if (selectedRatio && selectedRatio.ratio !== null) {
        if (dimension === 'width') {
          const newHeight = Math.round(value / selectedRatio.ratio);
          const constrainedHeight = Math.min(newHeight, originalHeight - cropTop);
          setCropHeight(constrainedHeight);
          setScale(calculateScale(value, constrainedHeight, originalWidth, originalHeight));
        } else {
          const newWidth = Math.round(value * selectedRatio.ratio);
          const constrainedWidth = Math.min(newWidth, originalWidth - cropLeft);
          setCropWidth(constrainedWidth);
          setScale(calculateScale(constrainedWidth, value, originalWidth, originalHeight));
        }
      } else {
        // Update scale for freeform
        const finalWidth = dimension === 'width' ? value : cropWidth;
        const finalHeight = dimension === 'height' ? value : cropHeight;
        setScale(calculateScale(finalWidth, finalHeight, originalWidth, originalHeight));
      }
    }
  };

  // Reset crop to center 80%
  const resetCrop = () => {
    const initialWidth = Math.round(originalWidth * INITIAL_CROP_FACTOR);
    const initialHeight = Math.round(originalHeight * INITIAL_CROP_FACTOR);
    setCropWidth(initialWidth);
    setCropHeight(initialHeight);
    setCropLeft(Math.round((originalWidth - initialWidth) / 2));
    setCropTop(Math.round((originalHeight - initialHeight) / 2));
    setAspectRatio('freeform');
    setScale(100);
  };

  // Close and return to landing view
  const closeCropper = () => {
    setCurrentView('landing');
    // Dispatch event to notify page about view change
    document.dispatchEvent(new CustomEvent('videoCropperViewChange', {
      detail: { currentView: 'landing' }
    }));
  };

  // Crop and download video
  const cropVideo = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setErrorMessage('');

    try {
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
      const result = await cropVideoWithMediaBunny(
        selectedFile,
        {
          outputFormat: originalFormat,
          crop: {
            left: cropLeft,
            top: cropTop,
            width: cropWidth,
            height: cropHeight,
          },
        },
        setProcessingProgress,
      );
      
      // Download file
      const a = document.createElement('a');
      a.href = URL.createObjectURL(result.blob);
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(a.href);

    } catch (error) {
      console.error('Error cropping video:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
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
  const getCropOverlayStyle = (): CSSProperties => {
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

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Drag handlers for crop area positioning
  const handleCropDragStart = (e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragStart({
      x: clientX,
      y: clientY,
      cropLeft: cropLeft,
      cropTop: cropTop
    });
  };

  const handleCropDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !videoRef.current) return;
    
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // Get video container dimensions to calculate the scale factor
    const videoElement = videoRef.current;
    const container = videoElement.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const videoAspectRatio = originalWidth / originalHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;
    
    let displayedVideoWidth: number, displayedVideoHeight: number;
    
    if (videoAspectRatio > containerAspectRatio) {
      // Video is wider, fit to width
      displayedVideoWidth = containerRect.width;
      displayedVideoHeight = containerRect.width / videoAspectRatio;
    } else {
      // Video is taller, fit to height
      displayedVideoHeight = containerRect.height;
      displayedVideoWidth = containerRect.height * videoAspectRatio;
    }
    
    // Convert pixel movement to video coordinate movement
    const scaleX = originalWidth / displayedVideoWidth;
    const scaleY = originalHeight / displayedVideoHeight;
    
    const videoDeltaX = deltaX * scaleX;
    const videoDeltaY = deltaY * scaleY;
    
    // Calculate new position
    const newLeft = Math.round(dragStart.cropLeft + videoDeltaX);
    const newTop = Math.round(dragStart.cropTop + videoDeltaY);
    
    // Constrain to video boundaries
    const constrainedLeft = Math.max(0, Math.min(newLeft, originalWidth - cropWidth));
    const constrainedTop = Math.max(0, Math.min(newTop, originalHeight - cropHeight));
    
    setCropLeft(constrainedLeft);
    setCropTop(constrainedTop);
  };

  const handleCropDragEnd = () => {
    setIsDragging(false);
  };

  // Resize handlers for corner dragging
  const handleResizeStart = (e: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: clientX,
      y: clientY,
      cropWidth: cropWidth,
      cropHeight: cropHeight,
      cropLeft: cropLeft,
      cropTop: cropTop
    });
  };

  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizing || !videoRef.current) return;
    
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - resizeStart.x;
    const deltaY = clientY - resizeStart.y;
    
    // Get video container dimensions to calculate the scale factor
    const videoElement = videoRef.current;
    const container = videoElement.parentElement;
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const videoAspectRatio = originalWidth / originalHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;
    
    let displayedVideoWidth: number, displayedVideoHeight: number;
    
    if (videoAspectRatio > containerAspectRatio) {
      displayedVideoWidth = containerRect.width;
      displayedVideoHeight = containerRect.width / videoAspectRatio;
    } else {
      displayedVideoHeight = containerRect.height;
      displayedVideoWidth = containerRect.height * videoAspectRatio;
    }
    
    // Convert pixel movement to video coordinate movement
    const scaleX = originalWidth / displayedVideoWidth;
    const scaleY = originalHeight / displayedVideoHeight;
    
    const videoDeltaX = deltaX * scaleX;
    const videoDeltaY = deltaY * scaleY;
    
    let newWidth = resizeStart.cropWidth;
    let newHeight = resizeStart.cropHeight;
    let newLeft = resizeStart.cropLeft;
    let newTop = resizeStart.cropTop;
    
    // Calculate new dimensions based on which corner is being dragged
    switch (resizeHandle) {
      case 'bottom-right':
        newWidth = resizeStart.cropWidth + videoDeltaX;
        newHeight = resizeStart.cropHeight + videoDeltaY;
        break;
      case 'bottom-left':
        newWidth = resizeStart.cropWidth - videoDeltaX;
        newHeight = resizeStart.cropHeight + videoDeltaY;
        newLeft = resizeStart.cropLeft + videoDeltaX;
        break;
      case 'top-right':
        newWidth = resizeStart.cropWidth + videoDeltaX;
        newHeight = resizeStart.cropHeight - videoDeltaY;
        newTop = resizeStart.cropTop + videoDeltaY;
        break;
      case 'top-left':
        newWidth = resizeStart.cropWidth - videoDeltaX;
        newHeight = resizeStart.cropHeight - videoDeltaY;
        newLeft = resizeStart.cropLeft + videoDeltaX;
        newTop = resizeStart.cropTop + videoDeltaY;
        break;
    }
    
    // Apply minimum size constraints first
    newWidth = Math.max(50, newWidth); // Minimum 50px width
    newHeight = Math.max(50, newHeight); // Minimum 50px height
    
    // Apply aspect ratio constraints and boundary checks
    const selectedRatio = aspectRatios.find(ar => ar.value === aspectRatio);
    if (selectedRatio && selectedRatio.ratio !== null) {
      const ratio = selectedRatio.ratio;
      
      // Determine which dimension to constrain based on which changed more
      const widthChange = Math.abs(newWidth - resizeStart.cropWidth);
      const heightChange = Math.abs(newHeight - resizeStart.cropHeight);
      
      let constrainedWidth = newWidth;
      let constrainedHeight = newHeight;
      let constrainedLeft = newLeft;
      let constrainedTop = newTop;
      
      if (widthChange > heightChange) {
        // Width changed more, calculate height from width to maintain ratio
        constrainedHeight = constrainedWidth / ratio;
        
        // Adjust position for handles that affect left edge
        if (resizeHandle === 'top-left' || resizeHandle === 'bottom-left') {
          constrainedLeft = resizeStart.cropLeft + (resizeStart.cropWidth - constrainedWidth);
        }
        
        // Adjust position for handles that affect top edge
        if (resizeHandle === 'top-left' || resizeHandle === 'top-right') {
          constrainedTop = resizeStart.cropTop + (resizeStart.cropHeight - constrainedHeight);
        }
      } else {
        // Height changed more, calculate width from height to maintain ratio
        constrainedWidth = constrainedHeight * ratio;
        
        // Adjust position for handles that affect left edge
        if (resizeHandle === 'top-left' || resizeHandle === 'bottom-left') {
          constrainedLeft = resizeStart.cropLeft + (resizeStart.cropWidth - constrainedWidth);
        }
        
        // Adjust position for handles that affect top edge
        if (resizeHandle === 'top-left' || resizeHandle === 'top-right') {
          constrainedTop = resizeStart.cropTop + (resizeStart.cropHeight - constrainedHeight);
        }
      }
      
      // Check if the constrained dimensions would exceed boundaries
      const wouldExceedRight = constrainedLeft + constrainedWidth > originalWidth;
      const wouldExceedBottom = constrainedTop + constrainedHeight > originalHeight;
      const wouldExceedLeft = constrainedLeft < 0;
      const wouldExceedTop = constrainedTop < 0;
      
      // If any boundary would be exceeded, constrain to the maximum possible size that maintains aspect ratio
      if (wouldExceedRight || wouldExceedBottom || wouldExceedLeft || wouldExceedTop) {
        let maxWidth = originalWidth - Math.max(0, constrainedLeft);
        let maxHeight = originalHeight - Math.max(0, constrainedTop);
        
        // For left/top edge handles, also consider the position constraints
        if (resizeHandle === 'top-left' || resizeHandle === 'bottom-left') {
          maxWidth = Math.min(maxWidth, resizeStart.cropLeft + resizeStart.cropWidth);
        }
        if (resizeHandle === 'top-left' || resizeHandle === 'top-right') {
          maxHeight = Math.min(maxHeight, resizeStart.cropTop + resizeStart.cropHeight);
        }
        
        // Calculate the maximum size that maintains aspect ratio
        const maxWidthByHeight = maxHeight * ratio;
        const maxHeightByWidth = maxWidth / ratio;
        
        if (maxWidthByHeight <= maxWidth) {
          // Height is the limiting factor
          constrainedWidth = maxWidthByHeight;
          constrainedHeight = maxHeight;
        } else {
          // Width is the limiting factor
          constrainedWidth = maxWidth;
          constrainedHeight = maxHeightByWidth;
        }
        
        // Recalculate positions based on constrained dimensions
        if (resizeHandle === 'top-left' || resizeHandle === 'bottom-left') {
          constrainedLeft = resizeStart.cropLeft + (resizeStart.cropWidth - constrainedWidth);
        }
        if (resizeHandle === 'top-left' || resizeHandle === 'top-right') {
          constrainedTop = resizeStart.cropTop + (resizeStart.cropHeight - constrainedHeight);
        }
      }
      
      // Apply the constrained values
      newWidth = constrainedWidth;
      newHeight = constrainedHeight;
      newLeft = constrainedLeft;
      newTop = constrainedTop;
    }
    
    // Final boundary constraints for freeform mode
    newLeft = Math.max(0, Math.min(newLeft, originalWidth - newWidth));
    newTop = Math.max(0, Math.min(newTop, originalHeight - newHeight));
    newWidth = Math.min(newWidth, originalWidth - newLeft);
    newHeight = Math.min(newHeight, originalHeight - newTop);
    
    // Update crop values
    setCropWidth(Math.round(newWidth));
    setCropHeight(Math.round(newHeight));
    setCropLeft(Math.round(newLeft));
    setCropTop(Math.round(newTop));
    
    // Update scale
    setScale(calculateScale(newWidth, newHeight, originalWidth, originalHeight));
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeHandle('');
  };

  // Add global event listeners for drag and resize
  useEffect(() => {
    if (isDragging || isResizing) {
      // Add dragging class to prevent text selection
      document.body.classList.add('crop-dragging');
      
      const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
          handleCropDragMove(e);
        } else if (isResizing) {
          handleResizeMove(e);
        }
      };
      
      const handleMouseUp = () => {
        if (isDragging) {
          handleCropDragEnd();
        } else if (isResizing) {
          handleResizeEnd();
        }
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        if (isDragging) {
          handleCropDragMove(e);
        } else if (isResizing) {
          handleResizeMove(e);
        }
      };
      
      const handleTouchEnd = () => {
        if (isDragging) {
          handleCropDragEnd();
        } else if (isResizing) {
          handleResizeEnd();
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.body.classList.remove('crop-dragging');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, cropLeft, cropTop, cropWidth, cropHeight, originalWidth, originalHeight, aspectRatio]);

  if (currentView === 'landing') {
    return (
      <div className="space-y-3">
        {errorMessage ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        ) : null}
        <SelectFile
          onFileSelect={handleFileSelect}
          validateFile={validateVideoFile}
          validationErrorMessage="Please select a valid video file (MP4, MOV, WebM, MKV)."
          supportText="Supports MP4, WebM, MOV, MKV"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {errorMessage ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      ) : null}
      {/* Video Player and Controls Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative bg-black w-full">
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
                      
                      {/* Draggable crop box border */}
                      <div 
                        className={`absolute border-2 border-teal-400 transition-all duration-200 pointer-events-auto ${
                          isDragging ? 'cursor-grabbing' : isResizing ? 'cursor-grabbing' : 'cursor-grab'
                        } hover:border-teal-500`}
                        style={cropStyle}
                        onMouseDown={handleCropDragStart}
                        onTouchStart={handleCropDragStart}
                      >
                        {/* Resizable corner handles */}
                        <div 
                          className="absolute -top-1 -left-1 w-4 h-4 bg-teal-400 border border-white rounded-full cursor-nw-resize pointer-events-auto hover:bg-teal-500 transition-colors"
                          onMouseDown={(e) => handleResizeStart(e, 'top-left')}
                          onTouchStart={(e) => handleResizeStart(e, 'top-left')}
                        ></div>
                        <div 
                          className="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 border border-white rounded-full cursor-ne-resize pointer-events-auto hover:bg-teal-500 transition-colors"
                          onMouseDown={(e) => handleResizeStart(e, 'top-right')}
                          onTouchStart={(e) => handleResizeStart(e, 'top-right')}
                        ></div>
                        <div 
                          className="absolute -bottom-1 -left-1 w-4 h-4 bg-teal-400 border border-white rounded-full cursor-sw-resize pointer-events-auto hover:bg-teal-500 transition-colors"
                          onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
                          onTouchStart={(e) => handleResizeStart(e, 'bottom-left')}
                        ></div>
                        <div 
                          className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-400 border border-white rounded-full cursor-se-resize pointer-events-auto hover:bg-teal-500 transition-colors"
                          onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
                          onTouchStart={(e) => handleResizeStart(e, 'bottom-right')}
                        ></div>
                        
                        {/* Center label with drag/resize hint */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-teal-600 text-white px-2 py-1 rounded text-xs font-medium pointer-events-none flex items-center gap-1">
                          {isDragging ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z"/>
                              </svg>
                              Moving
                            </>
                          ) : isResizing ? (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10,21V19H6.41L10.91,14.5L9.5,13.09L5,17.59V14H3V21H10M14.5,10.91L19,6.41V10H21V3H14V5H17.59L13.09,9.5L14.5,10.91Z"/>
                              </svg>
                              Resizing
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z"/>
                              </svg>
                              Drag to move or resize corners
                            </>
                          )}
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
          <ControlPanel
            title="Crop Controls"
            onReset={resetCrop}
            onClose={closeCropper}
            resetTitle="Reset crop to center 80%"
            closeTitle="Choose different video"
          >

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
                    onChange={(e) => handleCropChange('width', parseInt(e.target.value) || 0)}
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
                    onChange={(e) => handleCropChange('height', parseInt(e.target.value) || 0)}
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
                    onChange={(e) => handleCropChange('left', parseInt(e.target.value) || 0)}
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
                    onChange={(e) => handleCropChange('top', parseInt(e.target.value) || 0)}
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
                disabled={isProcessing}
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
                ) : (
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                    </svg>
                    Download {originalFormat.toUpperCase()}
                  </div>
                )}
              </button>
            </div>
          </ControlPanel>
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
              <div className="text-gray-600 mb-1">Format</div>
              <div className="font-medium text-gray-900">{originalFormat.toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main VideoCropper component
const VideoCropper = () => {
  return <VideoCropperContent />;
};

export default VideoCropper;
