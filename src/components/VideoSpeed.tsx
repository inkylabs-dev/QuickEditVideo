import { useState, useEffect, useRef } from 'preact/hooks';
import { FfmpegProvider, useFFmpeg } from '../FFmpegCore';
import ControlPanel from './ControlPanel';
import { SelectFile } from './SelectFile';
import { changeVideoSpeed, downloadVideo } from '../FFmpegUtils';

const VideoSpeedContent = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'editing'>('landing');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [videoDuration, setVideoDuration] = useState<number>(0);
	const [speed, setSpeed] = useState<number>(1.0);
	const [useInterpolation, setUseInterpolation] = useState<boolean>(false);
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

	// Update video playback rate when speed changes
	useEffect(() => {
		if (videoRef.current) {
			videoRef.current.playbackRate = speed;
		}
	}, [speed]);

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
		setCurrentView('editing');
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoSpeedViewChange', {
			detail: { currentView: 'editing' }
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

	// Process video with speed change
	const processVideoSpeed = async () => {
		if (!selectedFile || !ffmpegLoaded || !ffmpeg.current) return;
		
		setIsProcessing(true);
		setProgress(0);
		
		try {
			// Change video speed using FFmpeg
			const outputData = await changeVideoSpeed(ffmpeg.current, selectedFile, speed, useInterpolation);
			
			// Generate filename with speed indication
			const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
			const speedText = speed < 1 ? `${speed}x_slow` : `${speed}x_fast`;
			const downloadName = `${nameWithoutExt}_${speedText}.${originalFormat}`;
			
			// Download processed video
			downloadVideo(outputData, downloadName);
			
		} catch (error) {
			console.error('Error processing video:', error);
			alert('Error processing video. Please try again.');
		} finally {
			setIsProcessing(false);
			setProgress(0);
		}
	};

	// Reset speed to normal
	const resetSpeed = () => {
		setSpeed(1.0);
		setUseInterpolation(false);
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
	const speedPresets = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0];

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
									{speed}x speed
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
								Speed: {speed}x
							</label>
							<input
								type="range"
								min="0.25"
								max="4"
								step="0.25"
								value={speed}
								onChange={(e) => setSpeed(parseFloat((e.target as HTMLInputElement).value))}
								className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
							/>
							<div className="flex justify-between text-xs text-gray-500 mt-1">
								<span>0.25x</span>
								<span>1x</span>
								<span>4x</span>
							</div>
						</div>

						{/* Speed Presets */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Quick presets</label>
							<div className="grid grid-cols-3 gap-1">
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
										{preset}x
									</button>
								))}
							</div>
						</div>

						{/* Interpolation Toggle (only show for slow speeds) */}
						{speed < 1 && (
							<div className="border-t border-gray-200 pt-4">
								<label className="flex items-center">
									<input
										type="checkbox"
										checked={useInterpolation}
										onChange={(e) => setUseInterpolation((e.target as HTMLInputElement).checked)}
										className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
									/>
									<span className="ml-2 text-sm text-gray-700">
										Use motion interpolation
									</span>
								</label>
								<p className="text-xs text-gray-500 mt-1">
									Creates smoother slow motion by generating intermediate frames (increases processing time)
								</p>
							</div>
						)}
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
									<span>Download {speed}x Speed Video</span>
								</div> :
								<span>Loading FFmpeg...</span>
						}
					</button>

						</div>
					</ControlPanel>
				</div>
			</div>
		</div>
	);
};

const VideoSpeed = () => {
	return (
		<FfmpegProvider>
			<VideoSpeedContent />
		</FfmpegProvider>
	);
};

export default VideoSpeed;