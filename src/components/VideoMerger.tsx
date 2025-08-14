import { useState, useEffect, useRef } from 'preact/hooks';
import type { JSX } from 'preact';

interface VideoClip {
	id: string;
	file: File;
	url: string;
	duration: number;
	customDuration: number;
	name: string;
	format: string;
	width: number;
	height: number;
	thumbnail?: string;
}

const VideoMerger = () => {
	const [currentView, setCurrentView] = useState<'landing' | 'editing'>('landing');
	const [clips, setClips] = useState<VideoClip[]>([]);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [processingProgress, setProcessingProgress] = useState<number>(0);
	const [ffmpeg, setFfmpeg] = useState<any>(null);
	const [ffmpegLoaded, setFfmpegLoaded] = useState<boolean>(false);
	const [isPlaying, setIsPlaying] = useState<boolean>(false);
	const [currentClipIndex, setCurrentClipIndex] = useState<number>(0);
	const [globalWidth, setGlobalWidth] = useState<number>(0);
	const [globalHeight, setGlobalHeight] = useState<number>(0);
	const [useGlobalDimensions, setUseGlobalDimensions] = useState<boolean>(false);
	const [draggedClip, setDraggedClip] = useState<string | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [rightPanelTab, setRightPanelTab] = useState<'clips' | 'settings'>('clips');
	
	const videoRef = useRef<HTMLVideoElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Generate thumbnail from video first frame
	const generateThumbnail = (videoUrl: string): Promise<string> => {
		return new Promise((resolve) => {
			const video = document.createElement('video');
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			
			video.onloadeddata = () => {
				video.currentTime = 0.1; // Seek to 0.1s to avoid black frame
			};
			
			video.onseeked = () => {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				ctx?.drawImage(video, 0, 0);
				const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
				resolve(thumbnail);
			};
			
			video.src = videoUrl;
		});
	};

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

	// Handle file selection (single or multiple)
	const handleFileSelect = async (files: FileList | null) => {
		if (!files || files.length === 0) return;

		const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
		if (videoFiles.length === 0) {
			alert('Please select valid video files.');
			return;
		}

		const newClips: VideoClip[] = [];

		for (const file of videoFiles) {
			const url = URL.createObjectURL(file);
			const video = document.createElement('video');
			video.src = url;
			
			await new Promise(async (resolve) => {
				video.onloadedmetadata = async () => {
					const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
					const detectedFormat = fileExtension === 'mov' ? 'mov' : 
										  fileExtension === 'mkv' ? 'mkv' :
										  fileExtension === 'avi' ? 'avi' :
										  fileExtension === 'webm' ? 'webm' :
										  'mp4';

					// Generate thumbnail
					const thumbnail = await generateThumbnail(url);

					const clip: VideoClip = {
						id: `${Date.now()}-${Math.random()}`,
						file,
						url,
						duration: video.duration,
						customDuration: video.duration,
						name: file.name,
						format: detectedFormat,
						width: video.videoWidth,
						height: video.videoHeight,
						thumbnail,
					};

					newClips.push(clip);
					
					// Set global dimensions from first video if not set
					if (newClips.length === 1 && !useGlobalDimensions) {
						setGlobalWidth(video.videoWidth);
						setGlobalHeight(video.videoHeight);
					}
					
					resolve(null);
				};
			});
		}

		setClips(prevClips => [...prevClips, ...newClips]);
		
		if (clips.length === 0 && newClips.length > 0) {
			setCurrentView('editing');
			// Dispatch event to notify page about view change
			document.dispatchEvent(new CustomEvent('videoMergerViewChange', {
				detail: { currentView: 'editing' }
			}));
		}
	};

	// Handle drag and drop reordering
	const handleDragStart = (e: DragEvent, clipId: string) => {
		setDraggedClip(clipId);
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	};

	const handleDragOver = (e: DragEvent, index: number) => {
		e.preventDefault();
		setDragOverIndex(index);
		if (e.dataTransfer) {
			e.dataTransfer.dropEffect = 'move';
		}
	};

	const handleDragLeave = () => {
		setDragOverIndex(null);
	};

	const handleDrop = (e: DragEvent, dropIndex: number) => {
		e.preventDefault();
		setDragOverIndex(null);
		
		if (!draggedClip) return;

		const draggedIndex = clips.findIndex(clip => clip.id === draggedClip);
		if (draggedIndex === -1 || draggedIndex === dropIndex) return;

		const newClips = [...clips];
		const [draggedItem] = newClips.splice(draggedIndex, 1);
		newClips.splice(dropIndex, 0, draggedItem);
		
		setClips(newClips);
		setDraggedClip(null);
	};

	// Update clip duration
	const updateClipDuration = (clipId: string, newDuration: number) => {
		setClips(prevClips =>
			prevClips.map(clip =>
				clip.id === clipId
					? { ...clip, customDuration: Math.max(0.1, newDuration) }
					: clip
			)
		);
	};

	// Remove clip
	const removeClip = (clipId: string) => {
		setClips(prevClips => {
			const newClips = prevClips.filter(clip => clip.id !== clipId);
			if (newClips.length === 0) {
				setCurrentView('landing');
				document.dispatchEvent(new CustomEvent('videoMergerViewChange', {
					detail: { currentView: 'landing' }
				}));
			}
			return newClips;
		});
	};

	// Format time utility
	const formatTime = (seconds: number): string => {
		const min = Math.floor(seconds / 60);
		const sec = Math.floor(seconds % 60);
		return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
	};

	// Calculate total duration
	const getTotalDuration = (): number => {
		return clips.reduce((total, clip) => total + clip.customDuration, 0);
	};

	// Handle video play with sequential playback
	const handleVideoEnded = () => {
		if (currentClipIndex < clips.length - 1) {
			setCurrentClipIndex(currentClipIndex + 1);
		} else {
			setIsPlaying(false);
			setCurrentClipIndex(0);
		}
	};

	// Play/Pause functionality
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

	// Merge videos using FFmpeg
	const mergeVideos = async () => {
		if (!ffmpeg || !ffmpegLoaded || clips.length === 0) return;

		setIsProcessing(true);
		setProcessingProgress(0);

		try {
			const { fetchFile } = (window as any).FFmpeg;
			
			// Determine output dimensions
			const outputWidth = useGlobalDimensions ? globalWidth : clips[0].width;
			const outputHeight = useGlobalDimensions ? globalHeight : clips[0].height;
			
			// Process each clip
			const processedFiles: string[] = [];
			
			for (let i = 0; i < clips.length; i++) {
				const clip = clips[i];
				const inputExt = clip.file.name.split('.').pop();
				const inputFile = `input_${i}.${inputExt}`;
				const outputFile = `processed_${i}.mp4`;
				
				// Write input file
				ffmpeg.FS('writeFile', inputFile, await fetchFile(clip.file));
				
				// Calculate if looping is needed
				const needsLooping = clip.customDuration > clip.duration;
				
				if (needsLooping) {
					// Create looped version
					const loopCount = Math.ceil(clip.customDuration / clip.duration);
					await ffmpeg.run(
						'-stream_loop', (loopCount - 1).toString(),
						'-i', inputFile,
						'-t', clip.customDuration.toString(),
						'-vf', `scale=${outputWidth}:${outputHeight}`,
						'-c:v', 'libx264',
						'-c:a', 'aac',
						'-y',
						outputFile
					);
				} else {
					// Just resize and trim
					await ffmpeg.run(
						'-i', inputFile,
						'-t', clip.customDuration.toString(),
						'-vf', `scale=${outputWidth}:${outputHeight}`,
						'-c:v', 'libx264',
						'-c:a', 'aac',
						'-y',
						outputFile
					);
				}
				
				processedFiles.push(outputFile);
				ffmpeg.FS('unlink', inputFile);
			}
			
			// Create concat file
			const concatContent = processedFiles
				.map(file => `file '${file}'`)
				.join('\n');
			
			ffmpeg.FS('writeFile', 'concat.txt', new TextEncoder().encode(concatContent));
			
			// Concatenate all processed videos
			const finalOutput = 'merged_video.mp4';
			await ffmpeg.run(
				'-f', 'concat',
				'-safe', '0',
				'-i', 'concat.txt',
				'-c', 'copy',
				finalOutput
			);
			
			// Download the result
			const data = ffmpeg.FS('readFile', finalOutput);
			const blob = new Blob([data.buffer], { type: 'video/mp4' });
			
			const a = document.createElement('a');
			a.href = URL.createObjectURL(blob);
			a.download = 'merged_video.mp4';
			a.click();
			URL.revokeObjectURL(a.href);
			
			// Cleanup
			processedFiles.forEach(file => ffmpeg.FS('unlink', file));
			ffmpeg.FS('unlink', 'concat.txt');
			ffmpeg.FS('unlink', finalOutput);
			
		} catch (error) {
			console.error('Error merging videos:', error);
			alert('Error processing videos. Please try again.');
		} finally {
			setIsProcessing(false);
			setProcessingProgress(0);
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
						if (files.length > 0) handleFileSelect(files);
					}}
					onDragOver={(e) => e.preventDefault()}
					onDragEnter={(e) => e.preventDefault()}
				>
					<input 
						type="file" 
						accept="video/*" 
						multiple
						className="hidden"
						ref={fileInputRef}
						onChange={(e) => handleFileSelect(e.target.files)}
					/>
					<div className="mb-6">
						<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-400">
							<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
							<polyline points="14,2 14,8 20,8"/>
							<path d="M10 15.5L16 12L10 8.5V15.5Z"/>
						</svg>
					</div>
					<h3 className="text-xl font-semibold text-gray-900 mb-2">Select your videos</h3>
					<p className="text-gray-600 mb-6">Drop multiple video files here or click to browse</p>
					<div className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 px-6 py-3 font-medium transition-colors">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
							<path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
						</svg>
						Choose files
					</div>
					<p className="text-xs text-gray-500 mt-4">Supports MP4, WebM, AVI, MOV and more</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4">
			{/* Video Preview and Controls Row */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Video Preview Section */}
				<div className="lg:col-span-2">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
						<div className="video-container-custom bg-black">
							{clips.length > 0 && (
								<video 
									ref={videoRef}
									className="w-full h-full object-contain" 
									controls 
									preload="metadata"
									src={clips[currentClipIndex]?.url}
									onEnded={handleVideoEnded}
									onPlay={() => setIsPlaying(true)}
									onPause={() => setIsPlaying(false)}
								>
									Your browser does not support the video tag.
								</video>
							)}
						</div>
						
						{/* Video Info Bar */}
						<div className="p-3 border-t border-gray-200">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="text-sm font-medium text-gray-900">
										Preview ({currentClipIndex + 1}/{clips.length})
									</div>
									<div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
										{formatTime(getTotalDuration())} total
									</div>
								</div>
								{clips.length > 0 && (
									<div className="text-xs text-gray-500">
										Playing: {clips[currentClipIndex]?.name}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Right Panel */}
				<div className="lg:col-span-1">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
						{/* Tab Header */}
						<div className="border-b border-gray-200">
							<div className="flex">
								<button 
									onClick={() => setRightPanelTab('clips')}
									className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
										rightPanelTab === 'clips' 
											? 'border-teal-500 text-teal-600 bg-teal-50' 
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									}`}
								>
									Clips ({clips.length})
								</button>
								<button 
									onClick={() => setRightPanelTab('settings')}
									className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
										rightPanelTab === 'settings' 
											? 'border-teal-500 text-teal-600 bg-teal-50' 
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									}`}
								>
									Settings
								</button>
							</div>
						</div>

						{/* Tab Content */}
						<div className="p-4 h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
							{rightPanelTab === 'clips' ? (
								/* Clips Tab */
								<div className="space-y-3">
									{clips.length === 0 ? (
										<div className="text-center text-gray-500 py-8">
											<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-gray-300">
												<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
												<polyline points="14,2 14,8 20,8"/>
												<path d="M10 15.5L16 12L10 8.5V15.5Z"/>
											</svg>
											<p className="text-sm">No clips added yet</p>
										</div>
									) : (
										clips.map((clip, index) => (
											<div 
												key={clip.id}
												draggable
												onDragStart={(e) => handleDragStart(e, clip.id)}
												onDragOver={(e) => handleDragOver(e, index)}
												onDragLeave={handleDragLeave}
												onDrop={(e) => handleDrop(e, index)}
												className={`clip-item p-3 border border-gray-200 rounded-lg cursor-move hover:border-gray-300 transition-colors ${
													draggedClip === clip.id ? 'dragging opacity-50' : ''
												} ${dragOverIndex === index ? 'drag-over' : ''}`}
											>
												<div className="flex gap-3">
													{/* Video Thumbnail */}
													<div className="w-16 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
														{clip.thumbnail ? (
															<img 
																src={clip.thumbnail} 
																alt={clip.name}
																className="w-full h-full object-cover"
															/>
														) : (
															<div className="w-full h-full flex items-center justify-center">
																<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
																	<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
																	<polyline points="14,2 14,8 20,8"/>
																	<path d="M10 15.5L16 12L10 8.5V15.5Z"/>
																</svg>
															</div>
														)}
													</div>
													
													{/* Clip Info */}
													<div className="flex-1 min-w-0">
														<div className="text-sm font-medium text-gray-900 truncate" title={clip.name}>
															{clip.name}
														</div>
														<div className="text-xs text-gray-500 mt-1">
															{clip.width}×{clip.height}
														</div>
														<div className="text-xs text-gray-500">
															{formatTime(clip.duration)} → {formatTime(clip.customDuration)}
														</div>
														{clip.customDuration > clip.duration && (
															<div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
																<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
																	<path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
																</svg>
																Loop ×{Math.ceil(clip.customDuration / clip.duration)}
															</div>
														)}
													</div>
													
													{/* Remove Button */}
													<button 
														onClick={() => removeClip(clip.id)}
														className="text-gray-400 hover:text-red-600 transition-colors flex-shrink-0"
														title="Remove clip"
													>
														<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
															<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
														</svg>
													</button>
												</div>
												
												{/* Duration Controls */}
												<div className="mt-3 pt-3 border-t border-gray-100">
													<div className="flex items-center gap-2">
														<span className="text-xs text-gray-600 whitespace-nowrap">Duration:</span>
														<input 
															type="range"
															min="0.1"
															max={Math.max(clip.duration * 3, 60)}
															step="0.1"
															value={clip.customDuration}
															onChange={(e) => updateClipDuration(clip.id, parseFloat(e.target.value))}
															className="duration-slider flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
															style={{ 
																'--value': `${(clip.customDuration / Math.max(clip.duration * 3, 60)) * 100}%` 
															} as any}
														/>
														<input 
															type="number"
															min="0.1"
															step="0.1"
															value={clip.customDuration.toFixed(1)}
															onChange={(e) => updateClipDuration(clip.id, parseFloat(e.target.value))}
															className="w-14 px-1 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
														/>
														<span className="text-xs text-gray-500">s</span>
													</div>
												</div>
											</div>
										))
									)}
								</div>
							) : (
								/* Settings Tab */
								<div className="space-y-6">
									<div className="flex items-center justify-between">
										<h3 className="font-semibold text-gray-900">Project Settings</h3>
										<button 
											onClick={() => {
												setCurrentView('landing');
												setClips([]);
												document.dispatchEvent(new CustomEvent('videoMergerViewChange', {
													detail: { currentView: 'landing' }
												}));
											}}
											className="text-gray-400 hover:text-gray-600"
											title="Start over"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
												<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
											</svg>
										</button>
									</div>

									{/* Global Dimensions */}
									<div className="space-y-4">
										<div>
											<label className="flex items-center gap-2 text-sm font-medium text-gray-700">
												<input 
													type="checkbox"
													checked={useGlobalDimensions}
													onChange={(e) => setUseGlobalDimensions((e.target as HTMLInputElement).checked)}
													className="rounded"
												/>
												Custom dimensions
											</label>
										</div>
										
										{useGlobalDimensions && (
											<div className="grid grid-cols-2 gap-2">
												<div>
													<label className="block text-xs text-gray-600 mb-1">Width</label>
													<input 
														type="number" 
														min="1" 
														max="3840"
														value={globalWidth}
														onChange={(e) => setGlobalWidth(parseInt(e.target.value) || 0)}
														className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
													/>
												</div>
												<div>
													<label className="block text-xs text-gray-600 mb-1">Height</label>
													<input 
														type="number" 
														min="1" 
														max="2160"
														value={globalHeight}
														onChange={(e) => setGlobalHeight(parseInt(e.target.value) || 0)}
														className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
													/>
												</div>
											</div>
										)}
										
										{!useGlobalDimensions && clips.length > 0 && (
											<div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
												Using first video dimensions: {clips[0].width}×{clips[0].height}
											</div>
										)}
									</div>

									{/* Project Stats */}
									{clips.length > 0 && (
										<div className="space-y-3 pt-4 border-t border-gray-200">
											<h4 className="font-medium text-gray-900">Project Summary</h4>
											<div className="grid grid-cols-2 gap-4 text-sm">
												<div>
													<span className="text-gray-600">Total clips:</span>
													<div className="font-medium">{clips.length}</div>
												</div>
												<div>
													<span className="text-gray-600">Total duration:</span>
													<div className="font-medium">{formatTime(getTotalDuration())}</div>
												</div>
												<div>
													<span className="text-gray-600">Output format:</span>
													<div className="font-medium">MP4</div>
												</div>
												<div>
													<span className="text-gray-600">Quality:</span>
													<div className="font-medium">High</div>
												</div>
											</div>
										</div>
									)}

									{/* Action Buttons */}
									<div className="space-y-3 pt-4 border-t border-gray-200">
										<button 
											onClick={() => fileInputRef.current?.click()}
											className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 transition-colors w-full justify-center"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
												<path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
											</svg>
											Add more videos
										</button>
										
										<button 
											onClick={togglePlayPause}
											disabled={clips.length === 0}
											className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 transition-colors w-full justify-center disabled:bg-gray-200 disabled:border-gray-400 disabled:text-gray-500"
										>
											{isPlaying ? 
												<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
													<path d="M6,4V20H10V4H6M14,4V20H18V4H14Z"/>
												</svg> :
												<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
													<path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
												</svg>
											}
											{isPlaying ? 'Pause' : 'Preview'}
										</button>
										
										<button 
											onClick={mergeVideos}
											disabled={isProcessing || !ffmpegLoaded || clips.length === 0}
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
														Download MP4
													</div> :
													'Loading...'
											}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			
			{/* Hidden file input for adding more videos */}
			<input 
				type="file" 
				accept="video/*" 
				multiple
				className="hidden"
				ref={fileInputRef}
				onChange={(e) => handleFileSelect(e.target.files)}
			/>
		</div>
	);
};

export default VideoMerger;