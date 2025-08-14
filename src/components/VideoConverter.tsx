import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';

interface VideoConverterProps {
	targetFormat: string;
	targetFormatName: string;
}

const VideoConverter = ({ targetFormat, targetFormatName }: VideoConverterProps) => {
	const [currentView, setCurrentView] = useState<'landing' | 'converting'>('landing');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [videoDuration, setVideoDuration] = useState<number>(0);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [processingProgress, setProcessingProgress] = useState<number>(0);
	const [ffmpeg, setFfmpeg] = useState<any>(null);
	const [ffmpegLoaded, setFfmpegLoaded] = useState<boolean>(false);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [originalFormat, setOriginalFormat] = useState<string>('mp4');
	
	const videoRef = useRef<HTMLVideoElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Initialize FFmpeg
	useEffect(() => {
		const loadFFmpeg = async () => {
			try {
				if (!(window as any).FFmpeg) {
					await new Promise((resolve, reject) => {
						const script = document.createElement('script');
						script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.10.1/dist/ffmpeg.min.js';
						script.onload = resolve;
						script.onerror = reject;
						document.head.appendChild(script);
					});
				}

				const { createFFmpeg, fetchFile } = (window as any).FFmpeg;
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

	// Handle file selection
	const handleFileSelect = (file: File | null) => {
		if (!file || !file.type.startsWith('video/')) {
			alert('Please select a valid video file.');
			return;
		}

		setSelectedFile(file);
		
		// Detect original format from file extension
		const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
		const detectedFormat = fileExtension === 'mov' ? 'mov' : 
							  fileExtension === 'mkv' ? 'mkv' :
							  fileExtension === 'avi' ? 'avi' :
							  fileExtension === 'webm' ? 'webm' :
							  fileExtension === 'gif' ? 'gif' :
							  'mp4'; // default to mp4
		
		setOriginalFormat(detectedFormat);
		
		const url = URL.createObjectURL(file);
		setVideoUrl(url);
		setCurrentView('converting');
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoConverterViewChange', {
			detail: { currentView: 'converting' }
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

	// Convert and download video
	const convertVideo = async () => {
		if (!ffmpeg || !ffmpegLoaded || !selectedFile) return;

		setIsProcessing(true);
		setProcessingProgress(0);

		try {
			const { fetchFile } = (window as any).FFmpeg;
			const inputExt = selectedFile.name.split('.').pop();
			const inputFile = `input.${inputExt}`;
			const outputFile = `${selectedFile.name.split('.')[0]}_converted.${targetFormat}`;

			ffmpeg.FS('writeFile', inputFile, await fetchFile(selectedFile));

			// Get MIME type for the output format
			const getMimeType = (fmt: string): string => {
				switch (fmt) {
					case 'mov': return 'video/quicktime';
					case 'mkv': return 'video/x-matroska';
					case 'avi': return 'video/x-msvideo';
					case 'webm': return 'video/webm';
					case 'gif': return 'image/gif';
					case 'mp3': return 'audio/mpeg';
					default: return 'video/mp4';
				}
			};

			// Different conversion arguments for different formats
			if (targetFormat === 'gif') {
				await ffmpeg.run(
					'-i', inputFile,
					'-vf', 'fps=10,scale=320:-1:flags=lanczos',
					'-c:v', 'gif',
					outputFile
				);
			} else if (targetFormat === 'mp3') {
				await ffmpeg.run(
					'-i', inputFile,
					'-vn',
					'-acodec', 'libmp3lame',
					'-b:a', '192k',
					outputFile
				);
			} else {
				await ffmpeg.run(
					'-i', inputFile,
					'-c:v', 'libx264',
					'-c:a', 'aac',
					outputFile
				);
			}

			const data = ffmpeg.FS('readFile', outputFile);
			const blob = new Blob([data.buffer], { type: getMimeType(targetFormat) });
			
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
			console.error('Error converting video:', error);
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

	if (currentView === 'landing') {
		return (
			<div className="bg-white rounded-lg border-4 border-dashed border-gray-900 hover:border-gray-900 transition-colors">
				<div 
					className="p-16 text-center cursor-pointer"
					onClick={() => fileInputRef.current?.click()}
					onDrop={(e) => {
						e.preventDefault();
						const files = e.dataTransfer.files;
						if (files.length > 0) handleFileSelect(files[0]);
					}}
					onDragOver={(e) => e.preventDefault()}
					onDragEnter={(e) => e.preventDefault()}
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
									{formatTime(videoDuration)} duration
								</div>
								<div className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded whitespace-nowrap">
									Converting to {targetFormatName}
								</div>
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
									onClick={() => {
										setCurrentView('landing');
										// Dispatch event to notify page about view change
										document.dispatchEvent(new CustomEvent('videoConverterViewChange', {
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

						{/* Video Info */}
						<div className="space-y-3 mb-6">
							<div className="p-3 bg-gray-50 rounded-lg">
								<div className="text-sm text-gray-600 mb-1">Original Format</div>
								<div className="text-lg font-medium text-gray-900 uppercase">{originalFormat}</div>
							</div>
							
							<div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
								<div className="text-sm text-orange-600 mb-1">Converting to</div>
								<div className="text-lg font-medium text-orange-700 uppercase">{targetFormatName}</div>
							</div>
							
							<div className="p-3 bg-gray-50 rounded-lg">
								<div className="text-sm text-gray-600 mb-1">Duration</div>
								<div className="text-lg font-medium text-gray-900">{formatTime(videoDuration)}</div>
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
								onClick={convertVideo}
								disabled={isProcessing || !ffmpegLoaded}
								className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 font-medium transition-colors disabled:bg-gray-200 disabled:border-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm w-full"
							>
								{isProcessing ? 
									<div className="flex items-center gap-2">
										<svg className="progress-ring w-4 h-4" viewBox="0 0 24 24">
											<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"
												style={{ strokeDashoffset: 251.2 - (processingProgress / 100) * 251.2 }} />
										</svg>
										<span>Converting {processingProgress}%</span>
									</div> :
									ffmpegLoaded ? 
										<div className="flex items-center gap-2">
											<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
												<path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
											</svg>
											Download as {targetFormatName}
										</div> :
										'Loading...'
								}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default VideoConverter;