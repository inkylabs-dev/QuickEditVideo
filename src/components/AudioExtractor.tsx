import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';

const AudioExtractor = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'extracting'>('landing');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [videoDuration, setVideoDuration] = useState<number>(0);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [processingProgress, setProcessingProgress] = useState<number>(0);
	const [ffmpeg, setFfmpeg] = useState<any>(null);
	const [ffmpegLoaded, setFfmpegLoaded] = useState<boolean>(false);
	const [audioFormat, setAudioFormat] = useState<'mp3' | 'wav'>('mp3');
	
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
		
		// Create video URL for preview
		const url = URL.createObjectURL(file);
		setVideoUrl(url);
		setCurrentView('extracting');
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoExtractorViewChange', {
			detail: { currentView: 'extracting' }
		}));
	};

	// Handle video loaded metadata
	const handleVideoLoaded = () => {
		if (videoRef.current) {
			setVideoDuration(videoRef.current.duration);
		}
	};

	// Utility function
	const formatTime = (seconds: number): string => {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
	};

	// Extract audio and download
	const extractAudio = async () => {
		if (!ffmpeg || !ffmpegLoaded || !selectedFile) return;

		setIsProcessing(true);
		setProcessingProgress(0);

		try {
			const { fetchFile } = (window as any).FFmpeg;
			const inputExt = selectedFile.name.split('.').pop();
			const inputFile = `input.${inputExt}`;
			const outputFile = `${selectedFile.name.split('.')[0]}_extracted.${audioFormat}`;

			ffmpeg.FS('writeFile', inputFile, await fetchFile(selectedFile));

			// Get MIME type for the output format
			const getMimeType = (fmt: string): string => {
				switch (fmt) {
					case 'wav': return 'audio/wav';
					default: return 'audio/mpeg';
				}
			};

			// Extract audio using appropriate codec
			if (audioFormat === 'mp3') {
				await ffmpeg.run(
					'-i', inputFile,
					'-vn', // No video
					'-acodec', 'libmp3lame',
					'-ab', '192k', // Audio bitrate
					outputFile
				);
			} else {
				await ffmpeg.run(
					'-i', inputFile,
					'-vn', // No video
					'-acodec', 'pcm_s16le',
					outputFile
				);
			}

			const data = ffmpeg.FS('readFile', outputFile);
			const blob = new Blob([data.buffer], { type: getMimeType(audioFormat) });
			
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
			console.error('Error extracting audio:', error);
			alert('Error processing video. Please try again.');
		} finally {
			setIsProcessing(false);
			setProcessingProgress(0);
		}
	};

	// Reset to landing view
	const resetExtraction = () => {
		setSelectedFile(null);
		setVideoUrl('');
		setVideoDuration(0);
		setCurrentView('landing');
		setIsProcessing(false);
		setProcessingProgress(0);
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoExtractorViewChange', {
			detail: { currentView: 'landing' }
		}));
		
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	// Landing view for file selection
	if (currentView === 'landing') {
		return (
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
				<div className="mb-6">
					<div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
							<polygon points="11 5,6 9,2 9,2 15,6 15,11 19,11 5"/>
							<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
							<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 mb-2">Extract Audio from Video</h2>
					<p className="text-gray-600 max-w-md mx-auto">
						Select your video file to extract the audio as MP3 or WAV. Processing happens entirely in your browser.
					</p>
				</div>
				
				<div className="mb-6">
					<input
						ref={fileInputRef}
						type="file"
						accept="video/*"
						onChange={(e) => {
							const file = (e.target as HTMLInputElement).files?.[0] || null;
							handleFileSelect(file);
						}}
						className="hidden"
						id="video-upload"
					/>
					<label 
						htmlFor="video-upload"
						className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 px-6 py-3 font-medium cursor-pointer transition-colors shadow-sm"
					>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
						</svg>
						Select your video
					</label>
				</div>
				
				<div className="text-sm text-gray-500">
					<p>Supports: MP4, WebM, AVI, MOV, MKV and more</p>
					<p className="mt-1">Your files are processed locally and never uploaded</p>
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
							</div>
						</div>
					</div>
				</div>

				{/* Controls Section */}
				<div className="lg:col-span-1">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-semibold text-gray-900">Extract Audio</h3>
							<div className="flex items-center gap-2">
								<button 
									onClick={resetExtraction}
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
										document.dispatchEvent(new CustomEvent('videoExtractorViewChange', {
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

						{/* Format Selection */}
						<div className="space-y-4 mb-6">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Audio Format</label>
								<select 
									value={audioFormat}
									onChange={(e) => setAudioFormat(e.target.value as 'mp3' | 'wav')}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
								>
									<option value="mp3">MP3 (Compressed)</option>
									<option value="wav">WAV (Uncompressed)</option>
								</select>
								<p className="text-xs text-gray-500 mt-1">
									{audioFormat === 'mp3' ? 'Smaller file size, widely compatible' : 'Larger file size, highest quality'}
								</p>
							</div>
						</div>

						{/* Extract Button */}
						<div className="w-full">
							<button 
								onClick={extractAudio}
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
											Extract As {audioFormat.toUpperCase()}
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

export default AudioExtractor;