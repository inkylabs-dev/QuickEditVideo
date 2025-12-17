import { useState, useEffect, useRef } from 'react';
import ControlPanel from './ControlPanel';
import { SelectFile } from './SelectFile';
import { changeVideoSpeedWithMediaBunny, type SpeedOutputFormat } from '../utils/changeVideoSpeedWithMediaBunny';

const SUPPORTED_SPEED_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'mkv']);

function getFileExtension(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase();
	return ext ?? '';
}

const VideoSpeed = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'editing'>('landing');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [videoDuration, setVideoDuration] = useState<number>(0);
	const [speed, setSpeed] = useState<number>(1.0);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [processingProgress, setProcessingProgress] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [originalFormat, setOriginalFormat] = useState<SpeedOutputFormat>('mp4');
	const [errorMessage, setErrorMessage] = useState<string>('');

	const videoRef = useRef<HTMLVideoElement>(null);

	// Update video playback rate when speed changes
	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.playbackRate = speed;
		}
	}, [speed]);

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
		if (!SUPPORTED_SPEED_EXTENSIONS.has(fileExtension)) {
			setSelectedFile(null);
			setErrorMessage(`This format is not supported: .${fileExtension || '(unknown)'}. Try MP4, MOV, WebM, or MKV.`);
			return;
		}
		const detectedFormat = fileExtension as SpeedOutputFormat;

		setOriginalFormat(detectedFormat);

		const url = URL.createObjectURL(selectedFile);
		setVideoUrl(url);
		setCurrentView('editing');

		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoSpeedViewChange', {
			detail: { currentView: 'editing' }
		}));
	};

	// Handle video metadata loaded
	const handleVideoLoaded = () => {
		if (videoRef.current) {
			const duration = videoRef.current.duration;
			setVideoDuration(duration);
			// Set initial playback rate
			videoRef.current.playbackRate = speed;
		}
	};

	// Utility function to format time
	const formatTime = (seconds: number): string => {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
	};

	// Utility function to format speed display
	const formatSpeed = (speed: number): string => {
		if (speed >= 1) {
			return speed % 1 === 0 ? `${speed}` : speed.toFixed(2).replace(/\.?0+$/, '');
		} else {
			return speed.toFixed(2).replace(/\.?0+$/, '');
		}
	};

	// Process video with speed change
	const processVideoSpeed = async () => {
		if (!selectedFile) return;

		setIsProcessing(true);
		setProcessingProgress(0);
		setErrorMessage('');

		try {
			const result = await changeVideoSpeedWithMediaBunny(
				selectedFile,
				{
					outputFormat: originalFormat,
					speed: speed,
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
			console.error('Error processing video:', error);
			const message = error instanceof Error ? error.message : 'Unknown error';
			setErrorMessage(message.includes('Unsupported output format')
				? 'This format is not supported. Try MP4, MOV, WebM, or MKV.'
				: 'Error processing video. Please try again.');
		} finally {
			setIsProcessing(false);
			setProcessingProgress(0);
		}
	};

	// Reset speed to normal
	const resetSpeed = () => {
		setSpeed(1.0);
	};

	// Close and return to landing view
	const closeSpeedChanger = () => {
		setCurrentView('landing');
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoSpeedViewChange', {
			detail: { currentView: 'landing' }
		}));
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

	// Speed presets
	const speedPresets = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 4.0];

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
									{formatSpeed(speed)}x speed
								</div>
								<div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
									{formatTime(videoDuration / speed)} final duration
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Controls Section */}
				<div className="lg:col-span-1">
					<ControlPanel
						title="Speed Controls"
						onReset={resetSpeed}
						onClose={closeSpeedChanger}
						resetTitle="Reset to normal speed"
						closeTitle="Choose different video"
					>
						<div>
							{/* Speed Slider */}
					<div className="space-y-4 mb-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Speed: {formatSpeed(speed)}x
							</label>
							
							{/* Speed Input Field */}
							<div className="mb-3">
								<div className="flex items-center gap-2">
									<input
										type="number"
										min="0.25"
										max="4"
										step="0.01"
										value={speed}
										onChange={(e) => {
											const value = parseFloat((e.target as HTMLInputElement).value);
											if (!isNaN(value) && value >= 0.25 && value <= 4) {
												setSpeed(value);
											}
										}}
										onBlur={(e) => {
											const value = parseFloat((e.target as HTMLInputElement).value);
											if (isNaN(value) || value < 0.25) {
												setSpeed(0.25);
											} else if (value > 4) {
												setSpeed(4);
											}
										}}
										className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-transparent"
										placeholder="1.0"
									/>
									<span className="text-sm text-gray-500">x speed</span>
								</div>
							</div>

							<input
								type="range"
								min="0.25"
								max="4"
								step="0.01"
								value={speed}
								onChange={(e) => setSpeed(parseFloat((e.target as HTMLInputElement).value))}
								className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
							/>
							<div className="relative text-xs text-gray-500 mt-1">
								<span className="absolute left-0">0.25x</span>
								<span className="absolute" style={{ left: '20%' }}>1x</span>
								<span className="absolute" style={{ left: '46.6%' }}>2x</span>
								<span className="absolute right-0">4x</span>
							</div>
						</div>

						{/* Speed Presets */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Quick presets</label>
							<div className="grid grid-cols-4 gap-1">
								{speedPresets.map((preset) => (
									<button
										key={preset}
										onClick={() => setSpeed(preset)}
										className={`px-2 py-1 text-xs rounded border transition-colors ${
											speed === preset
												? 'bg-teal-100 border-teal-500 text-teal-700'
												: 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
										}`}
									>
										{formatSpeed(preset)}x
									</button>
								))}
							</div>
						</div>

					</div>

					{/* Play/Pause Button */}
					<button
						onClick={togglePlayPause}
						className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 transition-colors w-full justify-center mb-4"
					>
						{isPlaying ? 
							<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
								<path d="M6,4V20H10V4H6M14,4V20H18V4H14Z"/>
							</svg> :
							<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
								<path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
							</svg>
						}
						{isPlaying ? 'Pause' : 'Play'} Preview
					</button>

					{/* Process Button */}
					<button
						onClick={processVideoSpeed}
						disabled={isProcessing || !selectedFile || Boolean(errorMessage)}
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
							<div className="flex items-center gap-2">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
									<path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
								</svg>
								<span>Download {originalFormat.toUpperCase()}</span>
							</div>
						}
					</button>

						</div>
					</ControlPanel>
				</div>
			</div>
		</div>
	);
};

export default VideoSpeed;
