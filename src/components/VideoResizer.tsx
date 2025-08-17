import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { FfmpegProvider, useFFmpeg } from '../FFmpegCore';
import { fetchFile } from '@ffmpeg/util';
import ControlPanel from './ControlPanel';
import { SelectFile } from './SelectFile';

const VideoResizerContent = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'resizing'>('landing');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [videoDuration, setVideoDuration] = useState<number>(0);
	const [originalWidth, setOriginalWidth] = useState<number>(0);
	const [originalHeight, setOriginalHeight] = useState<number>(0);
	const [scale, setScale] = useState<number>(100);
	const [newWidth, setNewWidth] = useState<number>(0);
	const [newHeight, setNewHeight] = useState<number>(0);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [processingProgress, setProcessingProgress] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [originalFormat, setOriginalFormat] = useState<string>('mp4');
	
	const videoRef = useRef<HTMLVideoElement>(null);

	// Get FFmpeg context
	const { ffmpeg, isLoaded: ffmpegLoaded, progress, setProgress } = useFFmpeg();

	// Update processing progress from FFmpeg context
	useEffect(() => {
		setProcessingProgress(progress);
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
							  'mp4'; // default to mp4
		
		setOriginalFormat(detectedFormat);
		
		const url = URL.createObjectURL(selectedFile);
		setVideoUrl(url);
		setCurrentView('resizing');
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoResizerViewChange', {
			detail: { currentView: 'resizing' }
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
			const width = videoRef.current.videoWidth;
			const height = videoRef.current.videoHeight;
			
			setVideoDuration(duration);
			setOriginalWidth(width);
			setOriginalHeight(height);
			setNewWidth(width);
			setNewHeight(height);
			setScale(100);
		}
	};

	// Utility functions
	const formatTime = (seconds: number): string => {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
	};

	// Handle scale change
	const handleScaleChange = (newScale: number) => {
		setScale(newScale);
		const scaleRatio = newScale / 100;
		setNewWidth(Math.round(originalWidth * scaleRatio));
		setNewHeight(Math.round(originalHeight * scaleRatio));
	};

	// Handle width change
	const handleWidthChange = (width: number) => {
		if (width > 0 && originalWidth > 0) {
			setNewWidth(width);
			const aspectRatio = originalHeight / originalWidth;
			const calculatedHeight = Math.round(width * aspectRatio);
			setNewHeight(calculatedHeight);
			const newScale = Math.round((width / originalWidth) * 100);
			setScale(newScale);
		}
	};

	// Handle height change
	const handleHeightChange = (height: number) => {
		if (height > 0 && originalHeight > 0) {
			setNewHeight(height);
			const aspectRatio = originalWidth / originalHeight;
			const calculatedWidth = Math.round(height * aspectRatio);
			setNewWidth(calculatedWidth);
			const newScale = Math.round((height / originalHeight) * 100);
			setScale(newScale);
		}
	};

	// Reset resize to original dimensions
	const resetResize = () => {
		setScale(100);
		setNewWidth(originalWidth);
		setNewHeight(originalHeight);
	};

	// Close and return to landing view
	const closeResizer = () => {
		setCurrentView('landing');
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoResizerViewChange', {
			detail: { currentView: 'landing' }
		}));
	};

	// Resize and download video
	const resizeVideo = async () => {
		if (!ffmpeg?.current || !ffmpegLoaded || !selectedFile) return;

		setIsProcessing(true);
		setProgress(0);

		try {
			const inputExt = selectedFile.name.split('.').pop();
			const inputFile = `input.${inputExt}`;
			const outputFile = `${selectedFile.name.split('.')[0]}_resized.${originalFormat}`;

			await ffmpeg.current.writeFile(inputFile, await fetchFile(selectedFile));

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

			// Use FFmpeg scale filter to resize
			await ffmpeg.current.exec([
				'-i', inputFile,
				'-vf', `scale=${newWidth}:${newHeight}`,
				'-c:a', 'copy', // Copy audio without re-encoding
				outputFile
			]);

			const data = await ffmpeg.current.readFile(outputFile);
			const blob = new Blob([data.buffer], { type: getMimeType(originalFormat) });
			
			// Download file
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = outputFile;
			a.click();
			URL.revokeObjectURL(a.href);

			// Cleanup would be handled automatically by the new FFmpeg API

		} catch (error) {
			console.error('Error resizing video:', error);
			alert('Error processing video. Please try again.');
		} finally {
			setIsProcessing(false);
			setProgress(0);
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
									{originalWidth}×{originalHeight} → {newWidth}×{newHeight}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Controls Section */}
				<div className="lg:col-span-1">
					<ControlPanel
						title="Resize Controls"
						onReset={resetResize}
						onClose={closeResizer}
						resetTitle="Reset to original dimensions"
						closeTitle="Choose different video"
					>

						{/* Scale Controls */}
						<div className="space-y-4 mb-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Scale</label>
								<div className="flex items-center gap-3">
									<input 
										type="range" 
										min="10" 
										max="200" 
										step="5"
										value={scale}
										onChange={(e) => handleScaleChange(parseInt(e.target.value))}
										className="range-slider flex-1"
									/>
									<div className="text-sm font-medium text-gray-900 min-w-[60px]">{scale}%</div>
								</div>
							</div>
							
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
								<div className="flex items-center">
									<input 
										type="number" 
										min="1" 
										max="7680"
										value={newWidth}
										onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
									/>
									<span className="ml-2 text-sm text-gray-500 flex-shrink-0">px</span>
								</div>
							</div>
							
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
								<div className="flex items-center">
									<input 
										type="number" 
										min="1" 
										max="4320"
										value={newHeight}
										onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
									/>
									<span className="ml-2 text-sm text-gray-500 flex-shrink-0">px</span>
								</div>
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
										<path d="M6,4V20H10V4H6M14,4V20H18V4H14Z"/>
									</svg> :
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
										<path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
									</svg>
								}
								{isPlaying ? 'Pause' : 'Play'}
							</button>
							
							<button 
								onClick={resizeVideo}
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
					</ControlPanel>
				</div>
			</div>

			{/* Dimensions Info Section */}
			<div className="w-full">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<h3 className="font-semibold text-gray-900 mb-4">Resize Information</h3>
					
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div className="text-center">
							<div className="text-gray-600 mb-1">Original</div>
							<div className="font-medium text-gray-900">{originalWidth} × {originalHeight}</div>
						</div>
						<div className="text-center">
							<div className="text-gray-600 mb-1">New Size</div>
							<div className="font-medium text-teal-600">{newWidth} × {newHeight}</div>
						</div>
						<div className="text-center">
							<div className="text-gray-600 mb-1">Scale Factor</div>
							<div className="font-medium text-gray-900">{scale}%</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Main VideoResizer component with FFmpegProvider
const VideoResizer = () => {
	return (
		<FfmpegProvider>
			<VideoResizerContent />
		</FfmpegProvider>
	);
};

export default VideoResizer;