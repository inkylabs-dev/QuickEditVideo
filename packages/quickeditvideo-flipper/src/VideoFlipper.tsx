import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { FfmpegProvider, useFFmpeg, Loading, SelectFile } from 'quickeditvideo-core';
import { fetchFile } from '@ffmpeg/util';

const VideoFlipperContent = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'flipping'>('landing');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [videoDuration, setVideoDuration] = useState<number>(0);
	const [flipDirection, setFlipDirection] = useState<FlipDirection>('horizontal');
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
		setCurrentView('flipping');
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoFlipperViewChange', {
			detail: { currentView: 'flipping' }
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
		}
	};

	// Utility functions
	const formatTime = (seconds: number): string => {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
	};

	// Flip and download video
	const handleFlipVideo = async () => {
		if (!ffmpeg?.current || !ffmpegLoaded || !selectedFile) return;

		setIsProcessing(true);
		setProgress(0);

		try {
			const data = await flipVideo(ffmpeg.current, selectedFile, flipDirection);
			const outputFile = `${selectedFile.name.split('.')[0]}_flipped.${originalFormat}`;
			const blob = new Blob([data.buffer], { type: getMimeType(originalFormat) });
			
			// Download file
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = outputFile;
			a.click();
			URL.revokeObjectURL(a.href);

		} catch (error) {
			console.error('Error flipping video:', error);
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

	// CSS transform for real-time preview
	const getPreviewTransform = () => {
		return flipDirection === 'horizontal' ? 'scaleX(-1)' : 'scaleY(-1)';
	};

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
								style={{ transform: getPreviewTransform() }}
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
									{flipDirection === 'horizontal' ? 'Horizontal Flip' : 'Vertical Flip'}
								</div>
								{videoDuration > 0 && (
									<div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
										{formatTime(videoDuration)}
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
							<h3 className="font-semibold text-gray-900">Flip Controls</h3>
							<div className="flex items-center gap-2">
								<button 
									onClick={() => {
										setCurrentView('landing');
										// Dispatch event to notify page about view change
										document.dispatchEvent(new CustomEvent('videoFlipperViewChange', {
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

						{/* Flip Direction Controls */}
						<div className="space-y-4 mb-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-3">Flip Direction</label>
								<div className="space-y-2">
									<label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
										<input 
											type="radio" 
											name="flipDirection" 
											value="horizontal"
											checked={flipDirection === 'horizontal'}
											onChange={(e) => setFlipDirection(e.target.value as FlipDirection)}
											className="text-teal-600 focus:ring-teal-500"
										/>
										<div className="flex items-center gap-2">
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-600">
												<path d="M8 3H5C3.89 3 3 3.89 3 5V8M21 8V5C21 3.89 20.11 3 19 3H16"/>
												<path d="M16 21H19C20.11 21 21 20.11 21 19V16M3 16V19C3 20.11 3.89 21 5 21H8"/>
												<path d="M9 12L15 12"/>
											</svg>
											<span className="text-sm font-medium text-gray-900">Horizontal</span>
										</div>
									</label>
									<label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
										<input 
											type="radio" 
											name="flipDirection" 
											value="vertical"
											checked={flipDirection === 'vertical'}
											onChange={(e) => setFlipDirection(e.target.value as FlipDirection)}
											className="text-teal-600 focus:ring-teal-500"
										/>
										<div className="flex items-center gap-2">
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-600">
												<path d="M8 3H5C3.89 3 3 3.89 3 5V8M21 8V5C21 3.89 20.11 3 19 3H16"/>
												<path d="M16 21H19C20.11 21 21 20.11 21 19V16M3 16V19C3 20.11 3.89 21 5 21H8"/>
												<path d="M12 9L12 15"/>
											</svg>
											<span className="text-sm font-medium text-gray-900">Vertical</span>
										</div>
									</label>
								</div>
							</div>
						</div>

						{/* Flip Button */}
						<button
							onClick={handleFlipVideo}
							disabled={!ffmpegLoaded || isProcessing}
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
								<>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M8 3H5C3.89 3 3 3.89 3 5V8M21 8V5C21 3.89 20.11 3 19 3H16"/>
										<path d="M16 21H19C20.11 21 21 20.11 21 19V16M3 16V19C3 20.11 3.89 21 5 21H8"/>
										<path d="M9 12L15 12M12 9L12 15"/>
									</svg>
									<span>Flip Video</span>
								</>
							) : (
								<span>Loading...</span>
							)}
						</button>

						{/* Instructions */}
						<div className="mt-4 p-3 bg-gray-50 rounded-lg">
							<p className="text-xs text-gray-600">
								<strong>Preview:</strong> The video above shows a real-time preview of your flip. 
								Click "Flip Video" to process and download the final result.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Main VideoFlipper component with FFmpegProvider
const VideoFlipper = () => {
	return (
		<FfmpegProvider>
			<VideoFlipperContent />
		</FfmpegProvider>
	);
};

export default VideoFlipper;