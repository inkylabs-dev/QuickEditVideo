'use client';

import { useState, useEffect, useRef } from 'react';
import { SelectFile } from './SelectFile';
import { analyzeVideoWithMediaBunny, type VideoMetadata } from '../utils/analyzeVideoWithMediaBunny';
import { formatDuration, formatFileSize, formatBitrate } from '../utils/formatters';

const VideoInfoContent = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'analyzing'>('landing');
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [videoUrl, setVideoUrl] = useState<string>('');
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
	const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
	const [error, setError] = useState<string>('');
	
	const videoRef = useRef<HTMLVideoElement>(null);

	// Handle file selection from SelectFile component
	const handleFileSelect = (file: File | FileList | null) => {
		// Return early if no file selected
		if (!file) {
			return;
		}
		
		// SelectFile ensures file is validated before calling this
		const selectedFile = file as File;

		setSelectedFile(selectedFile);
		setError('');
		setMetadata(null);
		
		const url = URL.createObjectURL(selectedFile);
		setVideoUrl(url);
		setCurrentView('analyzing');
		
		// Dispatch event to notify page about view change
		document.dispatchEvent(new CustomEvent('videoInfoViewChange', {
			detail: { currentView: 'analyzing' }
		}));
	};

	// Video file validation function
	const validateVideoFile = (file: File): boolean => {
		return file.type.startsWith('video/');
	};

	// Analyze video metadata when video is loaded
	const analyzeVideo = async () => {
		if (!selectedFile || isAnalyzing) {
			return;
		}

		setIsAnalyzing(true);
		setError('');

		try {
			const videoMetadata = await analyzeVideoWithMediaBunny(selectedFile);
			setMetadata(videoMetadata);
		} catch (error) {
			console.error('Video analysis failed:', error);
			setError(error instanceof Error ? error.message : 'Failed to analyze video');
		} finally {
			setIsAnalyzing(false);
		}
	};

	// Auto-analyze when video loads
	useEffect(() => {
		if (selectedFile && currentView === 'analyzing' && !metadata && !isAnalyzing && !error) {
			analyzeVideo();
		}
	}, [selectedFile, currentView, metadata, isAnalyzing, error]);

	// Handle video play/pause
	const togglePlayPause = () => {
		if (videoRef.current) {
			if (isPlaying) {
				videoRef.current.pause();
			} else {
				videoRef.current.play();
			}
		}
	};

	// Cleanup video URL on unmount
	useEffect(() => {
		return () => {
			if (videoUrl) {
				URL.revokeObjectURL(videoUrl);
			}
		};
	}, [videoUrl]);

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
			{/* Video Player and Metadata Row */}
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
								{metadata && (
									<div className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded whitespace-nowrap">
										Analysis Complete
									</div>
								)}
								{isAnalyzing && (
									<div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded whitespace-nowrap">
										Analyzing...
									</div>
								)}
								{error && (
									<div className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded whitespace-nowrap">
										Analysis Failed
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Metadata Panel */}
				<div className="lg:col-span-1">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-full">
						<div className="flex items-center justify-between mb-4">
							<h3 className="font-semibold text-gray-900">Video Information</h3>
							<div className="flex items-center gap-2">
								<button 
									onClick={() => {
										setCurrentView('landing');
										// Dispatch event to notify page about view change
										document.dispatchEvent(new CustomEvent('videoInfoViewChange', {
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

						{/* Analysis Status */}
						{isAnalyzing && (
							<div className="text-center py-8">
								<div className="inline-flex items-center gap-2 text-blue-600">
									<div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
									<span className="text-sm">Analyzing video...</span>
								</div>
							</div>
						)}

						{error && (
							<div className="text-center py-8">
								<div className="text-red-600 text-sm">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mx-auto mb-2">
										<path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
									</svg>
									{error}
								</div>
								<button 
									onClick={analyzeVideo}
									disabled={isAnalyzing}
									className="mt-3 px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
								>
									Retry Analysis
								</button>
							</div>
						)}

						{/* Video Controls */}
						<div className="space-y-3 mb-4">
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
						</div>

						{/* Metadata Display */}
						{metadata && (
							<div className="space-y-4">
								{/* File Information */}
								<div className="border-b border-gray-200 pb-3">
									<h4 className="font-medium text-gray-800 mb-2 text-sm">File Information</h4>
									<div className="space-y-1 text-xs">
										<div className="flex justify-between">
											<span className="text-gray-500">Format:</span>
											<span className="font-medium">{metadata.format.format_name.toUpperCase()}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-500">Size:</span>
											<span className="font-medium">{formatFileSize(metadata.format.size)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-500">Duration:</span>
											<span className="font-medium">{formatDuration(metadata.format.duration)}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-500">Bitrate:</span>
											<span className="font-medium">{formatBitrate(metadata.format.bit_rate)}</span>
										</div>
									</div>
								</div>

								{/* Video Streams */}
								{metadata.videoStreams.length > 0 && (
									<div className="border-b border-gray-200 pb-3">
										<h4 className="font-medium text-gray-800 mb-2 text-sm">Video Stream</h4>
										{metadata.videoStreams.map((stream, index) => (
											<div key={index} className="space-y-1 text-xs">
												<div className="flex justify-between">
													<span className="text-gray-500">Codec:</span>
													<span className="font-medium">{stream.codec_name.toUpperCase()}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-500">Resolution:</span>
													<span className="font-medium">{stream.width}×{stream.height}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-500">Frame Rate:</span>
													<span className="font-medium">{stream.avg_frame_rate || 'Unknown'} fps</span>
												</div>
												{stream.bit_rate && (
													<div className="flex justify-between">
														<span className="text-gray-500">V.Bitrate:</span>
														<span className="font-medium">{formatBitrate(stream.bit_rate)}</span>
													</div>
												)}
											</div>
										))}
									</div>
								)}

								{/* Audio Streams */}
								{metadata.audioStreams.length > 0 && (
									<div className="border-b border-gray-200 pb-3">
										<h4 className="font-medium text-gray-800 mb-2 text-sm">Audio Stream</h4>
										{metadata.audioStreams.map((stream, index) => (
											<div key={index} className="space-y-1 text-xs">
												<div className="flex justify-between">
													<span className="text-gray-500">Codec:</span>
													<span className="font-medium">{stream.codec_name.toUpperCase()}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-500">Channels:</span>
													<span className="font-medium">{stream.channels || 'Unknown'}</span>
												</div>
												<div className="flex justify-between">
													<span className="text-gray-500">Sample Rate:</span>
													<span className="font-medium">{stream.sample_rate ? `${(parseInt(stream.sample_rate) / 1000).toFixed(1)} kHz` : 'Unknown'}</span>
												</div>
												{stream.bit_rate && (
													<div className="flex justify-between">
														<span className="text-gray-500">A.Bitrate:</span>
														<span className="font-medium">{formatBitrate(stream.bit_rate)}</span>
													</div>
												)}
											</div>
										))}
									</div>
								)}

								{/* Technical Details */}
								<div>
									<h4 className="font-medium text-gray-800 mb-2 text-sm">Technical Details</h4>
									<div className="space-y-1 text-xs">
										<div className="flex justify-between">
											<span className="text-gray-500">Streams:</span>
											<span className="font-medium">{metadata.format.nb_streams}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-gray-500">Container:</span>
											<span className="font-medium">{metadata.format.format_long_name}</span>
										</div>
										{metadata.format.start_time && (
											<div className="flex justify-between">
												<span className="text-gray-500">Start Time:</span>
												<span className="font-medium">{formatDuration(metadata.format.start_time)}</span>
											</div>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Instructions */}
						<div className="mt-4 p-3 bg-gray-50 rounded-lg">
							<p className="text-xs text-gray-600">
								<strong>About:</strong> This tool analyzes your video file and displays comprehensive metadata including format, codecs, resolution, bitrate, and more. All analysis happens locally in your browser.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const VideoInfo = () => {
	return <VideoInfoContent />;
};

export default VideoInfo;
