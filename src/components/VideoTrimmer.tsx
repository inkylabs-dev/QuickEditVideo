import { useState, useRef } from 'react';
import {
	ALL_FORMATS,
	BlobSource,
	BufferTarget,
	Conversion,
	Input,
	MkvOutputFormat,
	MovOutputFormat,
	Mp4OutputFormat,
	Output,
	WebMOutputFormat,
} from 'mediabunny';
import ControlPanel from './ControlPanel';
import { SelectFile } from './SelectFile';

const SUPPORTED_TRIM_EXTENSIONS = new Set(['mp4', 'mov', 'webm', 'mkv']);

function getFileExtension(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase();
	return ext ?? '';
}

function stripFileExtension(filename: string): string {
	return filename.replace(/\.[^/.]+$/, '');
}

function getOutputFormatForExtension(extension: string): {
	format: Mp4OutputFormat | MovOutputFormat | WebMOutputFormat | MkvOutputFormat;
	fileExtension: string;
	mimeType: string;
} {
	switch (extension) {
		case 'mov': {
			const format = new MovOutputFormat();
			return { format, fileExtension: 'mov', mimeType: 'video/quicktime' };
		}
		case 'webm': {
			const format = new WebMOutputFormat();
			return { format, fileExtension: 'webm', mimeType: 'video/webm' };
		}
		case 'mkv': {
			const format = new MkvOutputFormat();
			return { format, fileExtension: 'mkv', mimeType: 'video/x-matroska' };
		}
		case 'mp4': {
			const format = new Mp4OutputFormat();
			return { format, fileExtension: 'mp4', mimeType: 'video/mp4' };
		}
		default: {
			throw new Error(`Unsupported output format: ${extension}`);
		}
	}
}

const VideoTrimmer = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'trimming'>('landing');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [videoDuration, setVideoDuration] = useState<number>(0);
	const [startTime, setStartTime] = useState<number>(0);
	const [endTime, setEndTime] = useState<number>(0);
	const [startPos, setStartPos] = useState<number>(0);
	const [endPos, setEndPos] = useState<number>(100);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [processingProgress, setProcessingProgress] = useState<number>(0);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [originalFormat, setOriginalFormat] = useState<string>('mp4');
	const [errorMessage, setErrorMessage] = useState<string>('');
	
	const videoRef = useRef<HTMLVideoElement>(null);
	const timelineRef = useRef<HTMLDivElement>(null);

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
		if (!SUPPORTED_TRIM_EXTENSIONS.has(fileExtension)) {
			setSelectedFile(null);
			setErrorMessage(`This format is not supported: .${fileExtension || '(unknown)'}. Try MP4, MOV, WebM, or MKV.`);
			return;
		}
		const detectedFormat = fileExtension;
		
		setOriginalFormat(detectedFormat);
		
		const url = URL.createObjectURL(selectedFile);
		setVideoUrl(url);
		setCurrentView('trimming');
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoTrimmerViewChange', {
			detail: { currentView: 'trimming' }
		}));
	};

	// Handle video metadata loaded
	const handleVideoLoaded = () => {
		if (videoRef.current) {
			const duration = videoRef.current.duration;
			setVideoDuration(duration);
			setEndTime(duration);
			setStartTime(0);
			setStartPos(0);
			setEndPos(100);
		}
	};

	// Utility functions
	const formatTime = (seconds: number): string => {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
	};

	const formatTimeWithDecimal = (seconds: number): string => {
		const min = Math.floor(seconds / 60);
		const sec = (seconds % 60).toFixed(1);
		return `${min.toString().padStart(2, '0')}:${sec.padStart(4, '0')}`;
	};

	const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

	// Handle timeline drag (mouse and touch)
	const handlePointerDown = (e: MouseEvent | TouchEvent, handle: string) => {
		e.preventDefault();
		
		const getPosition = (event: MouseEvent | TouchEvent): number => {
			if (!timelineRef.current) return 0;
			const rect = timelineRef.current.getBoundingClientRect();
			const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
			return clamp((clientX - rect.left) / rect.width * 100, 0, 100);
		};
		
		const handlePointerMove = (e: MouseEvent | TouchEvent) => {
			const position = getPosition(e);
			
			if (handle === 'start') {
				const newPos = Math.min(position, endPos - 2);
				const newTime = (newPos / 100) * videoDuration;
				setStartPos(newPos);
				setStartTime(newTime);
				if (videoRef.current) videoRef.current.currentTime = newTime;
			} else {
				const newPos = Math.max(position, startPos + 2);
				const newTime = (newPos / 100) * videoDuration;
				setEndPos(newPos);
				setEndTime(newTime);
				if (videoRef.current) videoRef.current.currentTime = newTime;
			}
		};
		
		const handlePointerUp = () => {
			document.removeEventListener('mousemove', handlePointerMove);
			document.removeEventListener('mouseup', handlePointerUp);
			document.removeEventListener('touchmove', handlePointerMove);
			document.removeEventListener('touchend', handlePointerUp);
		};
		
		document.addEventListener('mousemove', handlePointerMove);
		document.addEventListener('mouseup', handlePointerUp);
		document.addEventListener('touchmove', handlePointerMove, { passive: false });
		document.addEventListener('touchend', handlePointerUp);
	};

	// Trim and download video
	const trimVideo = async () => {
		if (!selectedFile) return;
		if (endTime <= startTime) return;
		setIsProcessing(true);
		setProcessingProgress(0);
		setErrorMessage('');

		try {
			const { format, fileExtension, mimeType } = getOutputFormatForExtension(originalFormat);
			const outputFile = `${stripFileExtension(selectedFile.name)}_trimmed.${fileExtension}`;

			const input = new Input({
				source: new BlobSource(selectedFile),
				formats: ALL_FORMATS,
			});

			const output = new Output({
				format,
				target: new BufferTarget(),
			});

			const conversion = await Conversion.init({
				input,
				output,
				trim: { start: startTime, end: endTime },
			});

			conversion.onProgress = (progress) => {
				setProcessingProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
			};

			await conversion.execute();

			const buffer = (output.target as BufferTarget).buffer;
			if (!buffer) {
				throw new Error('No output buffer generated from MediaBunny');
			}

			const blob = new Blob([buffer], { type: mimeType });
			
			// Download file
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = outputFile;
			a.click();
			URL.revokeObjectURL(a.href);

		} catch (error) {
			console.error('Error trimming video:', error);
			const message = error instanceof Error ? error.message : 'Unknown error';
			setErrorMessage(message.includes('Unsupported output format')
				? 'This format is not supported. Try MP4, MOV, WebM, or MKV.'
				: 'Error trimming video. Please try again.');
		} finally {
			setIsProcessing(false);
			setProcessingProgress(0);
		}
	};

	// Reset trim to full video
	const resetTrim = () => {
		setStartPos(0);
		setEndPos(100);
		setStartTime(0);
		setEndTime(videoDuration);
	};

	// Close and return to landing view
	const closeTrimmer = () => {
		setCurrentView('landing');
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoTrimmerViewChange', {
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
									{formatTimeWithDecimal(endTime - startTime)} selected
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Controls Section */}
				<div className="lg:col-span-1">
					<ControlPanel
						title="Controls"
						onReset={resetTrim}
						onClose={closeTrimmer}
						resetTitle="Reset to full video"
						closeTitle="Choose different video"
					>

					{/* Time Controls */}
					<div className="space-y-4 mb-6">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Start time</label>
							<div className="flex items-center">
								<input 
									type="number" 
									step="0.1" 
									min="0" 
									max={endTime - 0.1}
									value={startTime.toFixed(1)}
									onChange={(e) => {
										const newStartTime = parseFloat((e.target as HTMLInputElement).value);
										if (newStartTime >= 0 && newStartTime < endTime) {
											setStartTime(newStartTime);
											setStartPos((newStartTime / videoDuration) * 100);
										}
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											const newStartTime = parseFloat((e.target as HTMLInputElement).value);
											if (newStartTime >= 0 && newStartTime < endTime && videoRef.current) {
												videoRef.current.currentTime = newStartTime;
											}
										}
									}}
									onBlur={(e) => {
										const newStartTime = parseFloat((e.target as HTMLInputElement).value);
										if (newStartTime >= 0 && newStartTime < endTime && videoRef.current) {
											videoRef.current.currentTime = newStartTime;
										}
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
								/>
								<span className="ml-2 text-sm text-gray-500 flex-shrink-0">sec</span>
							</div>
						</div>
						
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">End time</label>
							<div className="flex items-center">
								<input 
									type="number" 
									step="0.1" 
									min={startTime + 0.1}
									max={videoDuration}
									value={endTime.toFixed(1)}
									onChange={(e) => {
										const newEndTime = parseFloat((e.target as HTMLInputElement).value);
										if (newEndTime > startTime && newEndTime <= videoDuration) {
											setEndTime(newEndTime);
											setEndPos((newEndTime / videoDuration) * 100);
										}
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											const newEndTime = parseFloat((e.target as HTMLInputElement).value);
											if (newEndTime > startTime && newEndTime <= videoDuration && videoRef.current) {
												videoRef.current.currentTime = newEndTime;
											}
										}
									}}
									onBlur={(e) => {
										const newEndTime = parseFloat((e.target as HTMLInputElement).value);
										if (newEndTime > startTime && newEndTime <= videoDuration && videoRef.current) {
											videoRef.current.currentTime = newEndTime;
										}
									}}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
								/>
								<span className="ml-2 text-sm text-gray-500 flex-shrink-0">sec</span>
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
							onClick={trimVideo}
							disabled={isProcessing || !selectedFile || endTime <= startTime || Boolean(errorMessage)}
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
									Download {originalFormat.toUpperCase()}
								</div>
							}
						</button>
					</div>
					</ControlPanel>
				</div>
			</div>

			{/* Timeline Section */}
			<div className="w-full hidden md:block">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
					<h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
					
					{/* Timeline */}
					<div className="relative mb-4 mx-2">
						<div 
							ref={timelineRef}
							className="h-16 bg-gray-100 rounded-lg relative overflow-hidden touch-pan-x"
						>
							{/* Selection area */}
							<div 
								className="absolute top-0 bottom-0 bg-teal-500 bg-opacity-20 border-t-2 border-b-2 border-teal-500"
								style={{ left: `${startPos}%`, width: `${endPos - startPos}%` }}
							></div>
							
							{/* Start handle */}
							<div 
								className="timeline-handle absolute top-0 bottom-0 w-6 bg-white hover:bg-gray-50 border-2 border-gray-900 transition-colors flex items-center justify-center touch-manipulation"
								style={{ left: `${startPos}%`, marginLeft: '-12px' }}
								onMouseDown={(e) => handlePointerDown(e, 'start')}
								onTouchStart={(e) => handlePointerDown(e, 'start')}
							>
								<div className="w-1 h-8 bg-gray-900"></div>
							</div>
							
							{/* End handle */}
							<div 
								className="timeline-handle absolute top-0 bottom-0 w-6 bg-white hover:bg-gray-50 border-2 border-gray-900 transition-colors flex items-center justify-center touch-manipulation"
								style={{ left: `${endPos}%`, marginLeft: '-12px' }}
								onMouseDown={(e) => handlePointerDown(e, 'end')}
								onTouchStart={(e) => handlePointerDown(e, 'end')}
							>
								<div className="w-1 h-8 bg-gray-900"></div>
							</div>
						</div>
						
						{/* Time indicators */}
						<div className="flex justify-between mt-2 text-sm text-gray-500">
							<span>0:00</span>
							<span>{formatTime(videoDuration)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default VideoTrimmer;
