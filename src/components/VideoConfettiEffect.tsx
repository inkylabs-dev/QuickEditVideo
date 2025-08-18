import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';
import { FfmpegProvider, useFFmpeg } from '../FFmpegCore';
import { addConfettiOverlay } from '../FFmpegUtils';
import { SelectFile } from './SelectFile';
import confetti from 'canvas-confetti';

interface ConfettiConfig {
	particleCount: number;
	spread: number;
	startVelocity: number;
	colors: string[];
	shapes: ('square' | 'circle')[];
	scalar: number;
}

const VideoConfettiEffectContent = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'editing'>('landing');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [videoDuration, setVideoDuration] = useState<number>(0);
	const [originalFormat, setOriginalFormat] = useState<string>('mp4');
	
	// Confetti timing
	const [startTime, setStartTime] = useState<number>(0);
	const [endTime, setEndTime] = useState<number>(3);
	
	// Confetti configuration
	const [confettiConfig, setConfettiConfig] = useState<ConfettiConfig>({
		particleCount: 100,
		spread: 70,
		startVelocity: 30,
		colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
		shapes: ['square', 'circle'],
		scalar: 1
	});
	
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [processingProgress, setProcessingProgress] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [confettiVideoBlob, setConfettiVideoBlob] = useState<Blob | null>(null);
	
	const videoRef = useRef<HTMLVideoElement>(null);
	const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Get FFmpeg context
	const { ffmpeg, isLoaded: ffmpegLoaded, progress, setProgress } = useFFmpeg();

	// Update processing progress from FFmpeg context
	useEffect(() => {
		setProcessingProgress(progress);
	}, [progress]);

	// Handle file selection from SelectFile component
	const handleFileSelect = (file: File | FileList | null) => {
		if (!file) return;
		
		const selectedFile = file as File;
		setSelectedFile(selectedFile);
		
		// Detect original format from file extension
		const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
		const detectedFormat = fileExtension === 'mov' ? 'mov' : 
							  fileExtension === 'mkv' ? 'mkv' :
							  fileExtension === 'avi' ? 'avi' :
							  fileExtension === 'webm' ? 'webm' :
							  'mp4';
		
		setOriginalFormat(detectedFormat);
		
		const url = URL.createObjectURL(selectedFile);
		setVideoUrl(url);
		setCurrentView('editing');
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoConfettiEffectViewChange', {
			detail: { currentView: 'editing' }
		}));
	};

	// Load video metadata
	const handleVideoLoad = () => {
		if (videoRef.current) {
			const duration = videoRef.current.duration;
			setVideoDuration(duration);
			setEndTime(Math.min(3, duration)); // Default 3 seconds or video duration
		}
	};

	// Record confetti animation to canvas and convert to video blob
	const recordConfettiAnimation = async (): Promise<Blob> => {
		const canvas = confettiCanvasRef.current;
		if (!canvas) throw new Error('Canvas not available');

		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas context not available');

		// Set canvas size to match video dimensions
		if (videoRef.current) {
			canvas.width = videoRef.current.videoWidth || 640;
			canvas.height = videoRef.current.videoHeight || 480;
		}

		// Check if MediaRecorder is supported
		if (!MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
			// Fallback to vp8 if vp9 is not supported
			if (!MediaRecorder.isTypeSupported('video/webm; codecs=vp8')) {
				// Fallback to basic webm
				if (!MediaRecorder.isTypeSupported('video/webm')) {
					throw new Error('Browser does not support video recording');
				}
			}
		}

		// Create MediaRecorder for canvas with fallback mime types
		const stream = canvas.captureStream(30); // Reduced to 30 FPS for better compatibility
		let mimeType = 'video/webm; codecs=vp9';
		if (!MediaRecorder.isTypeSupported(mimeType)) {
			mimeType = 'video/webm; codecs=vp8';
			if (!MediaRecorder.isTypeSupported(mimeType)) {
				mimeType = 'video/webm';
			}
		}

		const mediaRecorder = new MediaRecorder(stream, { mimeType });

		const chunks: Blob[] = [];
		mediaRecorder.ondataavailable = (event) => {
			if (event.data.size > 0) {
				chunks.push(event.data);
			}
		};

		// Start recording
		mediaRecorder.start(100); // Record in 100ms chunks for better data availability
		
		// Create confetti instance targeting our canvas
		const canvasConfetti = confetti.create(canvas, {
			resize: true,
			useWorker: true
		});

		// Animate confetti for the specified duration
		const duration = Math.max(1000, (endTime - startTime) * 1000); // Minimum 1 second duration
		const animationStart = Date.now();
		
		const animate = () => {
			const elapsed = Date.now() - animationStart;
			
			if (elapsed < duration) {
				// Clear canvas with transparent background
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				
				// Fire confetti with better timing
				if (elapsed % 100 < 50) { // Fire confetti every 100ms for 50ms
					canvasConfetti({
						...confettiConfig,
						origin: { x: 0.5, y: 0.5 }
					});
				}
				
				requestAnimationFrame(animate);
			} else {
				// Stop recording
				setTimeout(() => {
					mediaRecorder.stop();
				}, 100); // Small delay to ensure last frames are captured
			}
		};

		animate();

		// Return promise that resolves when recording is complete
		return new Promise((resolve, reject) => {
			mediaRecorder.onstop = () => {
				if (chunks.length === 0) {
					reject(new Error('No video data recorded'));
					return;
				}
				const blob = new Blob(chunks, { type: mimeType });
				resolve(blob);
			};
			
			mediaRecorder.onerror = (event) => {
				reject(new Error('Recording failed: ' + (event as any).error));
			};
			
			// Timeout fallback
			setTimeout(() => {
				if (mediaRecorder.state === 'recording') {
					mediaRecorder.stop();
				}
			}, duration + 2000);
		});
	};

	// Process video with confetti overlay
	const processVideo = async () => {
		if (!selectedFile || !ffmpegLoaded) {
			alert('Please ensure video is selected and FFmpeg is loaded.');
			return;
		}

		setIsProcessing(true);
		setProgress(0);

		try {
			// Generate confetti animation first
			const confettiBlob = await recordConfettiAnimation();
			setConfettiVideoBlob(confettiBlob);

			const result = await addConfettiOverlay(
				ffmpeg,
				selectedFile,
				confettiBlob,
				startTime,
				endTime
			);

			// Create download blob
			const outputBlob = new Blob([result], { type: `video/${originalFormat}` });
			const url = URL.createObjectURL(outputBlob);
			
			// Trigger download
			const a = document.createElement('a');
			a.href = url;
			a.download = `confetti_${selectedFile.name}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

		} catch (error) {
			console.error('Error processing video:', error);
			alert('Error processing video: ' + (error as Error).message);
		} finally {
			setIsProcessing(false);
		}
	};

	// Reset to file selection
	const resetFiles = () => {
		setSelectedFile(null);
		setVideoUrl('');
		setCurrentView('landing');
		setConfettiVideoBlob(null);
		setVideoDuration(0);
		setStartTime(0);
		setEndTime(3);
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoConfettiEffectViewChange', {
			detail: { currentView: 'landing' }
		}));
	};

	// Format time helper
	const formatTime = (seconds: number): string => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	// Update confetti config
	const updateConfettiConfig = (key: keyof ConfettiConfig, value: any) => {
		setConfettiConfig(prev => ({
			...prev,
			[key]: value
		}));
	};

	// Landing view - file selection
	if (currentView === 'landing') {
		return (
			<div className="w-full max-w-6xl mx-auto">
				<SelectFile
					onFileSelect={handleFileSelect}
					accept="video/*"
					title="Select your video"
					description="Choose a video file to add confetti effects"
					buttonText="Choose file"
					supportText="Supports MP4, WebM, AVI, MOV, MKV files"
				/>
			</div>
		);
	}

	// Editing view
	return (
		<div className="w-full max-w-6xl mx-auto">
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
					{/* Video Preview Section */}
					<div className="lg:col-span-2 relative">
						<div className="relative aspect-video bg-black">
							<video
								ref={videoRef}
								src={videoUrl}
								onLoadedMetadata={handleVideoLoad}
								controls
								className="w-full h-full object-contain"
								preload="metadata"
							/>
							
							{/* Confetti Canvas Overlay */}
							<canvas
								ref={confettiCanvasRef}
								className="absolute inset-0 w-full h-full pointer-events-none"
								style={{ 
									opacity: isProcessing ? 0.8 : 0,
									background: 'transparent'
								}}
							/>
						</div>

						{/* Video Info Bar */}
						<div className="p-3 border-t border-gray-200">
							<div className="flex items-center gap-2">
								<div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
									{selectedFile?.name}
								</div>
								{videoDuration > 0 && (
									<div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
										{formatTime(videoDuration)} • {originalFormat.toUpperCase()}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Controls Section */}
					<div className="lg:col-span-1">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
							<div className="flex items-center justify-between mb-4">
								<h3 className="font-semibold text-gray-900">Confetti Controls</h3>
								<button
									onClick={resetFiles}
									className="text-gray-400 hover:text-gray-600"
									title="Choose different file"
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
										<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
									</svg>
								</button>
							</div>

							{/* Timing Controls */}
							<div className="space-y-4 mb-6">
								<div>
									<h4 className="text-sm font-medium text-gray-700 mb-3">Timing</h4>
									<div className="space-y-3">
										<div>
											<label className="block text-xs text-gray-600 mb-1">Start Time (seconds)</label>
											<input
												type="number"
												value={startTime}
												onChange={(e) => setStartTime(Math.max(0, Number(e.target.value)))}
												min="0"
												max={videoDuration}
												step="0.1"
												className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
											/>
										</div>
										<div>
											<label className="block text-xs text-gray-600 mb-1">End Time (seconds)</label>
											<input
												type="number"
												value={endTime}
												onChange={(e) => setEndTime(Math.min(videoDuration, Number(e.target.value)))}
												min={startTime}
												max={videoDuration}
												step="0.1"
												className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
											/>
										</div>
									</div>
								</div>

								{/* Confetti Settings */}
								<div>
									<h4 className="text-sm font-medium text-gray-700 mb-3">Confetti Settings</h4>
									<div className="space-y-3">
										<div>
											<label className="block text-xs text-gray-600 mb-1">Particle Count</label>
											<input
												type="range"
												value={confettiConfig.particleCount}
												onChange={(e) => updateConfettiConfig('particleCount', Number(e.target.value))}
												min="10"
												max="300"
												className="w-full"
											/>
											<div className="text-xs text-gray-500">{confettiConfig.particleCount}</div>
										</div>
										<div>
											<label className="block text-xs text-gray-600 mb-1">Spread</label>
											<input
												type="range"
												value={confettiConfig.spread}
												onChange={(e) => updateConfettiConfig('spread', Number(e.target.value))}
												min="10"
												max="180"
												className="w-full"
											/>
											<div className="text-xs text-gray-500">{confettiConfig.spread}°</div>
										</div>
										<div>
											<label className="block text-xs text-gray-600 mb-1">Velocity</label>
											<input
												type="range"
												value={confettiConfig.startVelocity}
												onChange={(e) => updateConfettiConfig('startVelocity', Number(e.target.value))}
												min="10"
												max="100"
												className="w-full"
											/>
											<div className="text-xs text-gray-500">{confettiConfig.startVelocity}</div>
										</div>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="space-y-3">
								<button
									onClick={processVideo}
									disabled={!ffmpegLoaded || isProcessing}
									className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
								>
									{isProcessing ? `Processing... ${Math.round(processingProgress)}%` : 'Download'}
								</button>
							</div>

							{/* Video Info */}
							{videoDuration > 0 && (
								<div className="bg-gray-50 rounded-lg p-3 mt-4">
									<h4 className="text-sm font-medium text-gray-900 mb-2">Video Information</h4>
									<div className="space-y-1 text-xs text-gray-600">
										<div>Duration: {formatTime(videoDuration)}</div>
										<div>Format: {originalFormat.toUpperCase()}</div>
										<div>Confetti: {formatTime(startTime)} - {formatTime(endTime)}</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Main VideoConfettiEffect component with FFmpegProvider
const VideoConfettiEffect = () => {
	return (
		<FfmpegProvider>
			<VideoConfettiEffectContent />
		</FfmpegProvider>
	);
};

export default VideoConfettiEffect;