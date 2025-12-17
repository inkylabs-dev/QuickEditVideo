import { useState, useRef } from 'react';
import { SelectFile } from './SelectFile';
import { flipVideoWithMediaBunny, type FlipDirection, type FlipOutputFormat } from '../utils/flipVideoWithMediaBunny';
import ControlPanel from './ControlPanel';

const SUPPORTED_FLIP_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'mkv']);

function getFileExtension(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase();
	return ext ?? '';
}

const VideoFlipper = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'flipping'>('landing');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [videoDuration, setVideoDuration] = useState<number>(0);
	const [flipDirection, setFlipDirection] = useState<FlipDirection>('horizontal');
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [processingProgress, setProcessingProgress] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [originalFormat, setOriginalFormat] = useState<FlipOutputFormat>('mp4');
	const [errorMessage, setErrorMessage] = useState<string>('');

	const videoRef = useRef<HTMLVideoElement>(null);

	// Handle file selection from SelectFile component
	const handleFileSelect = (file: File | FileList | null) => {
		setErrorMessage('');

		// Return early if no file selected
		if (!file) {
			return;
		}

		const selectedFile = file as File;

		if (!selectedFile.type.startsWith('video/')) {
			setErrorMessage('This file is not a video.');
			return;
		}

		setSelectedFile(selectedFile);

		// Detect original format from file extension
		const fileExtension = getFileExtension(selectedFile.name);
		if (!SUPPORTED_FLIP_EXTENSIONS.has(fileExtension)) {
			setSelectedFile(null);
			setErrorMessage(`This format is not supported: .${fileExtension || '(unknown)'}. Try MP4, MOV, WebM, or MKV.`);
			return;
		}
		const detectedFormat = fileExtension as FlipOutputFormat;

		setOriginalFormat(detectedFormat);

		const url = URL.createObjectURL(selectedFile);
		setVideoUrl(url);
		setCurrentView('flipping');

		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoFlipperViewChange', {
			detail: { currentView: 'flipping' }
		}));
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
		if (!selectedFile) return;
		setIsProcessing(true);
		setProcessingProgress(0);
		setErrorMessage('');

		try {
			const result = await flipVideoWithMediaBunny(
				selectedFile,
				{
					outputFormat: originalFormat,
					direction: flipDirection,
				},
				(progress) => {
					setProcessingProgress(Math.max(0, Math.min(100, Math.round(progress))));
				}
			);

			// Download file
			const a = document.createElement('a');
			a.href = URL.createObjectURL(result.blob);
			a.download = result.filename;
			a.click();
			URL.revokeObjectURL(a.href);

		} catch (error) {
			console.error('Error flipping video:', error);
			const message = error instanceof Error ? error.message : 'Unknown error';
			setErrorMessage(message.includes('Unsupported output format')
				? 'This format is not supported. Try MP4, MOV, WebM, or MKV.'
				: 'Error flipping video. Please try again.');
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

	// Close and return to landing view
	const closeFlipper = () => {
		setCurrentView('landing');
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoFlipperViewChange', {
			detail: { currentView: 'landing' }
		}));
	};

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
					supportText="Supports MP4, WebM, MOV, MKV"
				/>
			</div>
		);
	}

	// CSS transform for real-time preview
	const getPreviewTransform = () => {
		return flipDirection === 'horizontal' ? 'scaleX(-1)' : 'scaleY(-1)';
	};

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
					<ControlPanel
						title="Flip Controls"
						onClose={closeFlipper}
						closeTitle="Choose different video"
					>

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
								onClick={handleFlipVideo}
								disabled={isProcessing || !selectedFile || Boolean(errorMessage)}
								className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 font-medium transition-colors disabled:bg-gray-200 disabled:border-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm w-full"
							>
								{isProcessing ? (
									<div className="flex items-center gap-2">
										<svg className="progress-ring w-4 h-4" viewBox="0 0 24 24">
											<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"
												style={{ strokeDashoffset: 251.2 - (processingProgress / 100) * 251.2 }} />
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

						{/* Instructions */}
						<div className="mt-4 p-3 bg-gray-50 rounded-lg">
							<p className="text-xs text-gray-600">
								<strong>Preview:</strong> The video above shows a real-time preview of your flip.
								Click "Download" to process and download the final result.
							</p>
						</div>
					</ControlPanel>
				</div>
			</div>
		</div>
	);
};

export default VideoFlipper;
