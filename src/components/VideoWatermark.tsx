import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { FfmpegProvider, useFFmpeg } from '../FFmpegCore';
import { addWatermark } from '../FFmpegUtils';

const VideoWatermarkContent = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'watermarking'>('landing');
	const [videoFile, setVideoFile] = useState<File | null>(null);
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [logoUrl, setLogoUrl] = useState<string>('');
	const [videoDuration, setVideoDuration] = useState<number>(0);
	const [originalWidth, setOriginalWidth] = useState<number>(0);
	const [originalHeight, setOriginalHeight] = useState<number>(0);
	
	// Watermark settings
	const [logoWidth, setLogoWidth] = useState<number>(100);
	const [logoHeight, setLogoHeight] = useState<number>(100);
	const [logoLeft, setLogoLeft] = useState<number>(10);
	const [logoTop, setLogoTop] = useState<number>(10);
	const [logoAspectRatio, setLogoAspectRatio] = useState<number>(1);
	
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [processingProgress, setProcessingProgress] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [originalFormat, setOriginalFormat] = useState<string>('mp4');
	
	// Drag state
	const [isDragging, setIsDragging] = useState<boolean>(false);
	const [dragStart, setDragStart] = useState<{ x: number; y: number; logoLeft: number; logoTop: number }>({ 
		x: 0, y: 0, logoLeft: 0, logoTop: 0 
	});
	
	// Resize state
	const [isResizing, setIsResizing] = useState<boolean>(false);
	const [resizeHandle, setResizeHandle] = useState<string>('');
	const [resizeStart, setResizeStart] = useState<{ 
		x: number; y: number; logoWidth: number; logoHeight: number; logoLeft: number; logoTop: number 
	}>({ 
		x: 0, y: 0, logoWidth: 0, logoHeight: 0, logoLeft: 0, logoTop: 0 
	});
	
	const videoRef = useRef<HTMLVideoElement>(null);
	const videoFileInputRef = useRef<HTMLInputElement>(null);
	const logoFileInputRef = useRef<HTMLInputElement>(null);

	// Get FFmpeg context
	const { ffmpeg, isLoaded: ffmpegLoaded, progress, setProgress } = useFFmpeg();

	// Update processing progress from FFmpeg context
	useEffect(() => {
		setProcessingProgress(progress);
	}, [progress]);

	// Handle video file selection
	const handleVideoFileSelect = (file: File | null) => {
		if (!file || !file.type.startsWith('video/')) {
			alert('Please select a valid video file.');
			return;
		}

		setVideoFile(file);
		
		// Detect original format from file extension
		const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
		const detectedFormat = fileExtension === 'mov' ? 'mov' : 
							  fileExtension === 'mkv' ? 'mkv' :
							  fileExtension === 'avi' ? 'avi' :
							  fileExtension === 'webm' ? 'webm' :
							  'mp4'; // default to mp4
		
		setOriginalFormat(detectedFormat);
		
		const url = URL.createObjectURL(file);
		setVideoUrl(url);
		
		// If logo is already selected, switch to watermarking view
		if (logoFile) {
			setCurrentView('watermarking');
			
			// Dispatch event to notify page about view change
			document.dispatchEvent(new CustomEvent('videoWatermarkViewChange', {
				detail: { currentView: 'watermarking' }
			}));
		}
	};

	// Handle logo file selection
	const handleLogoFileSelect = (file: File | null) => {
		if (!file || !file.type.startsWith('image/')) {
			alert('Please select a valid image file (PNG, JPG, etc.).');
			return;
		}

		setLogoFile(file);
		
		const url = URL.createObjectURL(file);
		setLogoUrl(url);
		
		// Calculate aspect ratio of the logo
		const img = new Image();
		img.onload = () => {
			const aspectRatio = img.width / img.height;
			setLogoAspectRatio(aspectRatio);
		};
		img.src = url;
		
		// If video is already selected, switch to watermarking view
		if (videoFile) {
			setCurrentView('watermarking');
			
			// Dispatch event to notify page about view change
			document.dispatchEvent(new CustomEvent('videoWatermarkViewChange', {
				detail: { currentView: 'watermarking' }
			}));
		}
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
			
			// Set initial logo size and position
			const defaultLogoSize = Math.min(width, height) * 0.15; // 15% of the smaller dimension
			const defaultWidth = Math.round(defaultLogoSize);
			const defaultHeight = Math.round(defaultLogoSize / logoAspectRatio);
			
			setLogoWidth(defaultWidth);
			setLogoHeight(defaultHeight);
			setLogoLeft(10);
			setLogoTop(10);
		}
	};

	// Reset to default values
	const resetToDefaults = () => {
		if (originalWidth && originalHeight) {
			const defaultLogoSize = Math.min(originalWidth, originalHeight) * 0.15; // 15% of the smaller dimension
			const defaultWidth = Math.round(defaultLogoSize);
			const defaultHeight = Math.round(defaultLogoSize / logoAspectRatio);
			
			setLogoWidth(defaultWidth);
			setLogoHeight(defaultHeight);
			setLogoLeft(10);
			setLogoTop(10);
		} else {
			// Fallback defaults
			setLogoWidth(100);
			setLogoHeight(Math.round(100 / logoAspectRatio));
			setLogoLeft(10);
			setLogoTop(10);
		}
	};

	// Handle width change with aspect ratio maintenance
	const handleWidthChange = (newWidth: number) => {
		const constrainedWidth = Math.max(20, Math.min(originalWidth - logoLeft, newWidth));
		const newHeight = Math.round(constrainedWidth / logoAspectRatio);
		const constrainedHeight = Math.max(20, Math.min(originalHeight - logoTop, newHeight));
		
		setLogoWidth(constrainedWidth);
		setLogoHeight(constrainedHeight);
	};

	// Handle height change with aspect ratio maintenance
	const handleHeightChange = (newHeight: number) => {
		const constrainedHeight = Math.max(20, Math.min(originalHeight - logoTop, newHeight));
		const newWidth = Math.round(constrainedHeight * logoAspectRatio);
		const constrainedWidth = Math.max(20, Math.min(originalWidth - logoLeft, newWidth));
		
		setLogoHeight(constrainedHeight);
		setLogoWidth(constrainedWidth);
	};

	// Calculate logo overlay position as percentage for display
	const getLogoDisplayPosition = () => {
		const video = videoRef.current;
		if (!video) return { left: '10px', top: '10px', width: '100px', height: '100px' };

		const videoRect = video.getBoundingClientRect();
		const containerRect = video.parentElement?.getBoundingClientRect();
		if (!containerRect) return { left: '10px', top: '10px', width: '100px', height: '100px' };

		// Calculate the actual displayed video dimensions (accounting for object-fit)
		const videoAspectRatio = originalWidth / originalHeight;
		const containerAspectRatio = containerRect.width / containerRect.height;
		
		let displayedVideoWidth, displayedVideoHeight;
		if (videoAspectRatio > containerAspectRatio) {
			displayedVideoWidth = containerRect.width;
			displayedVideoHeight = containerRect.width / videoAspectRatio;
		} else {
			displayedVideoWidth = containerRect.height * videoAspectRatio;
			displayedVideoHeight = containerRect.height;
		}

		// Convert logo position from video coordinates to display coordinates
		const leftPercent = (logoLeft / originalWidth) * (displayedVideoWidth / containerRect.width) * 100;
		const topPercent = (logoTop / originalHeight) * (displayedVideoHeight / containerRect.height) * 100;
		const widthPercent = (logoWidth / originalWidth) * (displayedVideoWidth / containerRect.width) * 100;
		const heightPercent = (logoHeight / originalHeight) * (displayedVideoHeight / containerRect.height) * 100;

		return {
			left: `${leftPercent}%`,
			top: `${topPercent}%`,
			width: `${widthPercent}%`,
			height: `${heightPercent}%`
		};
	};

	// Drag handlers for logo positioning
	const handleLogoDragStart = (e: JSX.TargetedMouseEvent<HTMLDivElement> | JSX.TargetedTouchEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		
		setIsDragging(true);
		setDragStart({
			x: clientX,
			y: clientY,
			logoLeft: logoLeft,
			logoTop: logoTop
		});
	};

	const handleLogoDragMove = (e: MouseEvent | TouchEvent) => {
		if (!isDragging || !videoRef.current) return;
		
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		
		const deltaX = clientX - dragStart.x;
		const deltaY = clientY - dragStart.y;
		
		const videoRect = videoRef.current.getBoundingClientRect();
		const containerRect = videoRef.current.parentElement?.getBoundingClientRect();
		if (!containerRect) return;

		// Calculate scale factors
		const scaleX = originalWidth / containerRect.width;
		const scaleY = originalHeight / containerRect.height;
		
		// Calculate new position
		const newLeft = Math.max(0, Math.min(originalWidth - logoWidth, dragStart.logoLeft + (deltaX * scaleX)));
		const newTop = Math.max(0, Math.min(originalHeight - logoHeight, dragStart.logoTop + (deltaY * scaleY)));
		
		setLogoLeft(Math.round(newLeft));
		setLogoTop(Math.round(newTop));
	};

	const handleLogoDragEnd = () => {
		setIsDragging(false);
	};

	// Resize handlers for logo sizing
	const handleResizeStart = (e: JSX.TargetedMouseEvent<HTMLDivElement> | JSX.TargetedTouchEvent<HTMLDivElement>, handle: string) => {
		e.preventDefault();
		e.stopPropagation();
		
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		
		setIsResizing(true);
		setResizeHandle(handle);
		setResizeStart({
			x: clientX,
			y: clientY,
			logoWidth: logoWidth,
			logoHeight: logoHeight,
			logoLeft: logoLeft,
			logoTop: logoTop
		});
	};

	const handleResizeMove = (e: MouseEvent | TouchEvent) => {
		if (!isResizing || !videoRef.current) return;
		
		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		
		const deltaX = clientX - resizeStart.x;
		const deltaY = clientY - resizeStart.y;
		
		const containerRect = videoRef.current.parentElement?.getBoundingClientRect();
		if (!containerRect) return;

		// Calculate scale factors
		const scaleX = originalWidth / containerRect.width;
		const scaleY = originalHeight / containerRect.height;
		
		if (resizeHandle === 'bottom-right') {
			// Use the larger delta to determine the resize direction, maintaining aspect ratio
			const deltaXScaled = deltaX * scaleX;
			const deltaYScaled = deltaY * scaleY;
			
			// Use width as primary dimension and calculate height from aspect ratio
			const newWidth = resizeStart.logoWidth + deltaXScaled;
			const constrainedWidth = Math.max(20, Math.min(originalWidth - logoLeft, newWidth));
			const newHeight = Math.round(constrainedWidth / logoAspectRatio);
			const constrainedHeight = Math.max(20, Math.min(originalHeight - logoTop, newHeight));
			
			// If height constraint is more restrictive, use it to calculate width
			if (constrainedHeight !== newHeight) {
				const adjustedWidth = Math.round(constrainedHeight * logoAspectRatio);
				setLogoWidth(adjustedWidth);
				setLogoHeight(constrainedHeight);
			} else {
				setLogoWidth(constrainedWidth);
				setLogoHeight(constrainedHeight);
			}
		}
	};

	const handleResizeEnd = () => {
		setIsResizing(false);
		setResizeHandle('');
	};

	// Add global event listeners for drag and resize
	useEffect(() => {
		if (isDragging || isResizing) {
			// Add dragging class to prevent text selection
			document.body.classList.add('watermark-dragging');
			
			const handleMouseMove = (e: MouseEvent) => {
				if (isDragging) {
					handleLogoDragMove(e);
				} else if (isResizing) {
					handleResizeMove(e);
				}
			};
			
			const handleMouseUp = () => {
				if (isDragging) {
					handleLogoDragEnd();
				} else if (isResizing) {
					handleResizeEnd();
				}
			};
			
			const handleTouchMove = (e: TouchEvent) => {
				e.preventDefault(); // Prevent scrolling while dragging
				if (isDragging) {
					handleLogoDragMove(e);
				} else if (isResizing) {
					handleResizeMove(e);
				}
			};
			
			const handleTouchEnd = () => {
				if (isDragging) {
					handleLogoDragEnd();
				} else if (isResizing) {
					handleResizeEnd();
				}
			};
			
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			document.addEventListener('touchmove', handleTouchMove, { passive: false });
			document.addEventListener('touchend', handleTouchEnd);
			
			return () => {
				document.body.classList.remove('watermark-dragging');
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
				document.removeEventListener('touchmove', handleTouchMove);
				document.removeEventListener('touchend', handleTouchEnd);
			};
		}
	}, [isDragging, isResizing, dragStart, resizeStart, logoLeft, logoTop, logoWidth, logoHeight, originalWidth, originalHeight]);

	// Process watermark
	const processWatermark = async () => {
		if (!ffmpeg?.current || !ffmpegLoaded || !videoFile || !logoFile) {
			alert('Please ensure FFmpeg is loaded and both video and logo files are selected.');
			return;
		}

		setIsProcessing(true);
		setProgress(0);

		try {
			const watermarkedData = await addWatermark(
				ffmpeg,
				videoFile,
				logoFile,
				logoLeft,
				logoTop,
				logoWidth,
				logoHeight
			);

			// Create blob and download
			const blob = new Blob([watermarkedData], { type: `video/${originalFormat}` });
			const url = URL.createObjectURL(blob);
			
			const a = document.createElement('a');
			a.href = url;
			a.download = `watermarked_${videoFile.name}`;
			a.click();
			
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Error processing watermark:', error);
			alert('Error processing watermark. Please try again.');
		} finally {
			setIsProcessing(false);
			setProgress(0);
		}
	};

	// Utility functions
	const formatTime = (seconds: number): string => {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		return `${min}:${sec.toString().padStart(2, '0')}`;
	};

	const handleDrop = (e: JSX.TargetedDragEvent<HTMLDivElement>, type: 'video' | 'logo') => {
		e.preventDefault();
		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			if (type === 'video') {
				handleVideoFileSelect(files[0]);
			} else {
				handleLogoFileSelect(files[0]);
			}
		}
	};

	const handleDragOver = (e: JSX.TargetedDragEvent<HTMLDivElement>) => {
		e.preventDefault();
	};

	const resetFiles = () => {
		setVideoFile(null);
		setLogoFile(null);
		setVideoUrl('');
		setLogoUrl('');
		setCurrentView('landing');
		setLogoAspectRatio(1);
		
		// Clear file inputs
		if (videoFileInputRef.current) videoFileInputRef.current.value = '';
		if (logoFileInputRef.current) logoFileInputRef.current.value = '';
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoWatermarkViewChange', {
			detail: { currentView: 'landing' }
		}));
	};

	if (currentView === 'landing') {
		return (
			<>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
					{/* Video Upload - Left Side */}
					<div 
						className="bg-white rounded-lg border-4 border-dashed border-gray-900 hover:border-gray-900 transition-colors p-16 text-center cursor-pointer"
						onDrop={(e) => handleDrop(e, 'video')}
						onDragOver={handleDragOver}
						onClick={() => videoFileInputRef.current?.click()}
					>
						{videoFile && videoUrl ? (
							<div className="space-y-3">
								<div className="w-32 h-24 mx-auto rounded-lg overflow-hidden bg-black">
									<video
										src={videoUrl}
										className="w-full h-full object-cover"
										muted
									/>
								</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Select your video</h3>
								<div className="text-sm text-teal-600 font-medium">✓ {videoFile.name}</div>
							</div>
						) : (
							<div className="space-y-3">
								<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
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
						)}
						<input
							ref={videoFileInputRef}
							type="file"
							accept="video/*"
							onChange={(e) => handleVideoFileSelect(e.currentTarget.files?.[0] || null)}
							className="hidden"
						/>
					</div>

					{/* Logo Upload - Right Side */}
					<div 
						className="bg-white rounded-lg border-4 border-dashed border-gray-900 hover:border-gray-900 transition-colors p-16 text-center cursor-pointer"
						onDrop={(e) => handleDrop(e, 'logo')}
						onDragOver={handleDragOver}
						onClick={() => logoFileInputRef.current?.click()}
					>
						{logoFile && logoUrl ? (
							<div className="space-y-3">
								<div className="w-32 h-24 mx-auto rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
									<img
										src={logoUrl}
										alt="Logo preview"
										className="max-w-full max-h-full object-contain"
									/>
								</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Select your logo</h3>
								<div className="text-sm text-teal-600 font-medium">✓ {logoFile.name}</div>
							</div>
						) : (
							<div className="space-y-3">
								<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
										<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
										<circle cx="9" cy="9" r="2"/>
										<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
									</svg>
								</div>
								<h3 className="text-xl font-semibold text-gray-900 mb-2">Select your logo</h3>
								<p className="text-gray-600 mb-6">Drop a logo file here or click to browse</p>
								<div className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 px-6 py-3 font-medium transition-colors">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
										<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
									</svg>
									Choose file
								</div>
								<p className="text-xs text-gray-500 mt-4">Supports PNG, JPG, SVG and more</p>
							</div>
						)}
						<input
							ref={logoFileInputRef}
							type="file"
							accept="image/*"
							onChange={(e) => handleLogoFileSelect(e.currentTarget.files?.[0] || null)}
							className="hidden"
						/>
					</div>
				</div>

				{videoFile && logoFile && (
					<div className="mt-6 text-center">
						<button
							onClick={() => {
								setCurrentView('watermarking');
								document.dispatchEvent(new CustomEvent('videoWatermarkViewChange', {
									detail: { currentView: 'watermarking' }
								}));
							}}
							className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 px-6 py-3 font-medium transition-colors"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
							</svg>
							Continue to Editor
						</button>
					</div>
				)}
				
				<p className="text-xs text-gray-500 mt-4 text-center">Your files never leave your device</p>
			</>
		);
	}

	return (
		<div className="space-y-6 p-4">
			{/* Video Player and Controls Row */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Video Section */}
				<div className="lg:col-span-2">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
						<div className="video-container-custom bg-black relative">
							{videoUrl && (
								<video
									ref={videoRef}
									src={videoUrl}
									className="w-full h-full object-contain"
									controls
									onLoadedMetadata={handleVideoLoaded}
									onPlay={() => setIsPlaying(true)}
									onPause={() => setIsPlaying(false)}
								/>
							)}
							
							{/* Logo Overlay */}
							{logoUrl && originalWidth > 0 && (
								<div 
									className="absolute border-2 border-teal-500 cursor-move"
									style={getLogoDisplayPosition()}
									onMouseDown={handleLogoDragStart}
									onTouchStart={handleLogoDragStart}
								>
									{/* Mobile drag icon - positioned inside the logo overlay */}
									<div className="sm:hidden absolute top-0 left-0 right-0 bg-teal-500 text-white px-2 py-1 text-xs flex items-center justify-center gap-1 z-10">
										<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
											<path d="M13,6V11H18V7.75L22.25,12L18,16.25V13H13V18H16.25L12,22.25L7.75,18H11V13H6V16.25L1.75,12L6,7.75V11H11V6H7.75L12,1.75L16.25,6H13Z"/>
										</svg>
										Drag
									</div>
									
									<img 
										src={logoUrl} 
										alt="Logo"
										className="w-full h-full object-contain pointer-events-none"
										draggable={false}
									/>
									
									{/* Resize handle */}
									<div 
										className="absolute bottom-0 right-0 w-3 h-3 bg-teal-500 cursor-se-resize"
										onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
										onTouchStart={(e) => handleResizeStart(e, 'bottom-right')}
									></div>
								</div>
							)}
						</div>
						
						{/* Video Info Bar */}
						<div className="p-3 border-t border-gray-200">
							<div className="flex items-center gap-2">
								<div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
									{videoFile?.name}
								</div>
								{videoDuration > 0 && (
									<div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
										{formatTime(videoDuration)} • {originalWidth} × {originalHeight}
									</div>
								)}
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
									onClick={resetToDefaults}
									className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
									title="Reset to defaults"
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
										<path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
									</svg>
									Reset
								</button>
								<button 
									onClick={resetFiles}
									className="text-gray-400 hover:text-gray-600"
									title="Choose different files"
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
										<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
									</svg>
								</button>
							</div>
						</div>

						{/* Position Controls */}
						<div className="space-y-4 mb-6">
							<div>
								<h4 className="text-sm font-medium text-gray-700 mb-3">Position Controls</h4>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">Left (px)</label>
										<input
											type="number"
											value={logoLeft}
											onChange={(e) => setLogoLeft(Math.max(0, Math.min(originalWidth - logoWidth, parseInt(e.currentTarget.value) || 0)))}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
											min="0"
											max={originalWidth - logoWidth}
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">Top (px)</label>
										<input
											type="number"
											value={logoTop}
											onChange={(e) => setLogoTop(Math.max(0, Math.min(originalHeight - logoHeight, parseInt(e.currentTarget.value) || 0)))}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
											min="0"
											max={originalHeight - logoHeight}
										/>
									</div>
								</div>
							</div>

							{/* Size Controls */}
							<div>
								<h4 className="text-sm font-medium text-gray-700 mb-3">Size Controls (Aspect Ratio Locked)</h4>
								<div className="grid grid-cols-2 gap-3">
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">Width (px)</label>
										<input
											type="number"
											value={logoWidth}
											onChange={(e) => handleWidthChange(parseInt(e.currentTarget.value) || 0)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
											min="20"
											max={originalWidth - logoLeft}
										/>
									</div>
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">Height (px)</label>
										<input
											type="number"
											value={logoHeight}
											onChange={(e) => handleHeightChange(parseInt(e.currentTarget.value) || 0)}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
											min="20"
											max={originalHeight - logoTop}
										/>
									</div>
								</div>
								<div className="mt-2 text-xs text-gray-500">
									Aspect Ratio: {logoAspectRatio.toFixed(2)}
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className="space-y-3">
							<button 
								onClick={() => {
									if (videoRef.current) {
										if (videoRef.current.paused) {
											videoRef.current.play();
											setIsPlaying(true);
										} else {
											videoRef.current.pause();
											setIsPlaying(false);
										}
									}
								}}
								className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 transition-colors w-full justify-center"
							>
								{isPlaying ? 
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
										<path d="M6,4V20H10V4H6M14,4V20H18V4H14Z"/>
									</svg> :
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
										<path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
									</svg>
								}
								{isPlaying ? 'Pause' : 'Play'}
							</button>
							
							<button 
								onClick={processWatermark}
								disabled={isProcessing || !ffmpegLoaded}
								className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 font-medium transition-colors disabled:bg-gray-200 disabled:border-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm w-full"
							>
								{isProcessing ? 
									<div className="flex items-center gap-2">
										<svg className="progress-ring w-4 h-4" viewBox="0 0 24 24">
											<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"
												style={{ strokeDashoffset: 251.2 - (processingProgress / 100) * 251.2 }} />
										</svg>
										<span>Processing {processingProgress}%</span>
									</div> :
									ffmpegLoaded ? 
										<div className="flex items-center gap-2">
											<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
												<path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
											</svg>
											Download {originalFormat.toUpperCase()}
										</div> :
										'Loading...'
								}
							</button>
						</div>

						{/* Video Info */}
						{videoDuration > 0 && (
							<div className="bg-gray-50 rounded-lg p-3 mt-4">
								<h4 className="text-sm font-medium text-gray-900 mb-2">Video Information</h4>
								<div className="space-y-1 text-xs text-gray-600">
									<div>Duration: {formatTime(videoDuration)}</div>
									<div>Resolution: {originalWidth} × {originalHeight}</div>
									<div>Format: {originalFormat.toUpperCase()}</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

// Main VideoWatermark component with FFmpegProvider
const VideoWatermark = () => {
	return (
		<FfmpegProvider>
			<VideoWatermarkContent />
		</FfmpegProvider>
	);
};

export default VideoWatermark;