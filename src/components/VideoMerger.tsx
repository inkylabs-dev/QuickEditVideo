import { useState, useEffect, useRef, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { SelectFile } from './SelectFile';
import { mergeVideosWithMediaBunny } from '../utils/mergeVideosWithMediaBunny';

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

// Constants
const CONSTANTS = {
	DND_TYPE: 'clip',
	FFMPEG: {
		THUMBNAIL_TIME: 0.1,
		JPEG_QUALITY: 0.8,
	},
	DIMENSIONS: {
		MAX_WIDTH: 3840,
		MAX_HEIGHT: 2160,
		MIN_DURATION: 0.1,
	},
	SUPPORTED_FORMATS: ['mp4', 'mov', 'mkv', 'webm'],
} as const;

// Utility functions
const formatTime = (seconds: number): string => {
	const min = Math.floor(seconds / 60);
	const sec = Math.floor(seconds % 60);
	return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const generateClipId = (): string => `${Date.now()}-${Math.random()}`;

const detectVideoFormat = (fileName: string): string => {
	const extension = fileName.split('.').pop()?.toLowerCase() || '';
	return CONSTANTS.SUPPORTED_FORMATS.includes(extension) ? extension : 'mp4';
};

const generateThumbnail = (videoUrl: string): Promise<string> => {
	return new Promise((resolve) => {
		const video = document.createElement('video');
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
		
		video.onloadeddata = () => {
			video.currentTime = CONSTANTS.FFMPEG.THUMBNAIL_TIME;
		};
		
		video.onseeked = () => {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			ctx?.drawImage(video, 0, 0);
			resolve(canvas.toDataURL('image/jpeg', CONSTANTS.FFMPEG.JPEG_QUALITY));
		};
		
		video.src = videoUrl;
	});
};


const createVideoElement = (file: File): Promise<{ video: HTMLVideoElement; url: string }> => {
	return new Promise((resolve) => {
		const url = URL.createObjectURL(file);
		const video = document.createElement('video');
		video.src = url;
		video.onloadedmetadata = () => resolve({ video, url });
	});
};

// Draggable Clip Item Component
interface DraggableClipItemProps {
	clip: VideoClip;
	index: number;
	isCurrentlyPlaying: boolean;
	moveClip: (fromIndex: number, toIndex: number) => void;
	removeClip: (clipId: string) => void;
	updateClipDuration: (clipId: string, newDuration: number) => void;
	resetClipDuration: (clipId: string) => void;
	formatTime: (seconds: number) => string;
	onClipClick: (index: number) => void;
}

const DraggableClipItem = ({ clip, index, isCurrentlyPlaying, moveClip, removeClip, updateClipDuration, resetClipDuration, formatTime, onClipClick }: DraggableClipItemProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const dragHandleRef = useRef<HTMLDivElement>(null);
	
	const [{ isDragging }, drag] = useDrag({
		type: CONSTANTS.DND_TYPE,
		item: () => ({ index, id: clip.id }),
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});

	const [{ isOver }, drop] = useDrop({
		accept: CONSTANTS.DND_TYPE,
		drop(item: { index: number; id: string }) {
			console.log(`Drop: moving from ${item.index} to ${index}`);
			if (item.index !== index) {
				moveClip(item.index, index);
			}
		},
		hover(item: { index: number; id: string }, monitor) {
			if (!ref.current || !monitor.isOver({ shallow: true })) return;
			
			const dragIndex = item.index;
			const hoverIndex = index;
			
			if (dragIndex === hoverIndex) return;

			// Get the client rect to determine the hoverClientY
			const hoverBoundingRect = ref.current.getBoundingClientRect();
			const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
			const clientOffset = monitor.getClientOffset();
			
			if (!clientOffset) return;
			
			const hoverClientY = clientOffset.y - hoverBoundingRect.top;

			// Only perform the move when the mouse has crossed half of the items height
			if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
			if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

			moveClip(dragIndex, hoverIndex);
			item.index = hoverIndex;
		},
		collect: (monitor) => ({
			isOver: monitor.isOver(),
		}),
	});

	// Connect drag and drop refs - only the drag handle is draggable
	drag(dragHandleRef);
	drop(ref);

	return (
		<div 
			ref={ref}
			className={`clip-item p-3 border rounded-lg transition-colors ${
				isDragging ? 'opacity-50 scale-105' : ''
			} ${isOver ? 'border-teal-400 bg-teal-50' : ''} ${
				isCurrentlyPlaying 
					? 'border-teal-500 bg-teal-50 shadow-sm ring-1 ring-teal-200' 
					: 'border-gray-200'
			}`}
		>
			<div 
				ref={dragHandleRef}
				onClick={() => onClipClick(index)}
				className="flex gap-3 cursor-pointer hover:bg-gray-50 -m-3 p-3 rounded-lg"
			>
				{/* Drag Handle */}
				<div className="flex items-center cursor-move">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
						<path d="M9,3V4H4V6H9V7H11V3H9M13,3V7H15V6H20V4H15V3H13M9,10V11H4V13H9V14H11V10H9M13,10V14H15V13H20V11H15V10H13M9,17V18H4V20H9V21H11V17H9M13,17V21H15V20H20V18H15V17H13Z"/>
					</svg>
				</div>
				
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
					<div className="flex items-center gap-2">
						<div className="text-sm font-medium text-gray-900 truncate" title={clip.name}>
							{clip.name}
						</div>
						{isCurrentlyPlaying && (
							<div className="flex items-center gap-1 text-teal-600">
								<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
									<path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
								</svg>
								<span className="text-xs font-medium">Preview</span>
							</div>
						)}
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
				
				{/* Action Buttons */}
				<div className="flex items-center gap-1 flex-shrink-0">
					{/* Reset Duration Button */}
					<button 
						onClick={(e) => {
							e.stopPropagation();
							resetClipDuration(clip.id);
						}}
						className="text-gray-400 hover:text-blue-600 transition-colors"
						title="Reset to original duration"
						disabled={clip.customDuration === clip.duration}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
						</svg>
					</button>
					
					{/* Remove Button */}
					<button 
						onClick={(e) => {
							e.stopPropagation();
							removeClip(clip.id);
						}}
						className="text-gray-400 hover:text-red-600 transition-colors"
						title="Remove clip"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
							<path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
						</svg>
					</button>
				</div>
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
	);
};

// State interfaces
interface AppState {
	currentView: 'landing' | 'editing';
	rightPanelTab: 'clips' | 'settings';
}

interface PlaybackState {
	isPlaying: boolean;
	currentClipIndex: number;
}

interface ProcessingState {
	isProcessing: boolean;
	progress: number;
}


interface DimensionsState {
	width: number;
	height: number;
	useCustom: boolean;
}

const VideoMergerContent = () => {
	// Simplified state management
	const [clips, setClips] = useState<VideoClip[]>([]);
	const [appState, setAppState] = useState<AppState>({ currentView: 'landing', rightPanelTab: 'clips' });
	const [playbackState, setPlaybackState] = useState<PlaybackState>({ isPlaying: false, currentClipIndex: 0 });
	const [processingState, setProcessingState] = useState<ProcessingState>({ isProcessing: false, progress: 0 });
	const [dimensionsState, setDimensionsState] = useState<DimensionsState>({ width: 0, height: 0, useCustom: false });
	
	const videoRef = useRef<HTMLVideoElement>(null);
	const preloadVideoRef = useRef<HTMLVideoElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const createClipFromFile = async (file: File): Promise<VideoClip> => {
		const { video, url } = await createVideoElement(file);
		const thumbnail = await generateThumbnail(url);
		
		return {
			id: generateClipId(),
			file,
			url,
			duration: video.duration,
			customDuration: video.duration,
			name: file.name,
			format: detectVideoFormat(file.name),
			width: video.videoWidth,
			height: video.videoHeight,
			thumbnail,
		};
	};

	const handleFileSelect = async (files: File | FileList | null) => {
		if (!files) return;
		
		// Handle single file or FileList
		const fileList = files instanceof File ? [files] : Array.from(files);
		if (!fileList.length) return;

		const newClips = await Promise.all(fileList.map(createClipFromFile));
		
		// Set dimensions from first video if not using custom dimensions
		if (newClips.length && !dimensionsState.useCustom) {
			const { width, height } = newClips[0];
			setDimensionsState(prev => ({ ...prev, width, height }));
		}

		setClips(prev => [...prev, ...newClips]);
		
		if (!clips.length && newClips.length) {
			setAppState(prev => ({ ...prev, currentView: 'editing' }));
			document.dispatchEvent(new CustomEvent('videoMergerViewChange', {
				detail: { currentView: 'editing' }
			}));
		}
	};

	// Video file validation function
	const validateVideoFile = (file: File): boolean => {
		if (!file.type.startsWith('video/')) return false;
		const extension = file.name.split('.').pop()?.toLowerCase() || '';
		return CONSTANTS.SUPPORTED_FORMATS.includes(extension as any);
	};

	// Handle drag and drop reordering with react-dnd
	const moveClip = useCallback((fromIndex: number, toIndex: number) => {
		if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
		if (fromIndex >= clips.length || toIndex >= clips.length) return;

		console.log(`Moving clip from index ${fromIndex} to ${toIndex}`);
		
		setClips(prevClips => {
			const newClips = [...prevClips];
			const [draggedItem] = newClips.splice(fromIndex, 1);
			newClips.splice(toIndex, 0, draggedItem);
			return newClips;
		});
	}, [clips.length]);

	const updateClipDuration = (clipId: string, newDuration: number) => {
		setClips(prevClips =>
			prevClips.map(clip =>
				clip.id === clipId
					? { ...clip, customDuration: Math.max(CONSTANTS.DIMENSIONS.MIN_DURATION, newDuration) }
					: clip
			)
		);
	};

	const resetClipDuration = (clipId: string) => {
		setClips(prevClips =>
			prevClips.map(clip =>
				clip.id === clipId
					? { ...clip, customDuration: clip.duration }
					: clip
			)
		);
	};

	const removeClip = (clipId: string) => {
		setClips(prevClips => {
			const newClips = prevClips.filter(clip => clip.id !== clipId);
			if (!newClips.length) {
				setAppState(prev => ({ ...prev, currentView: 'landing' }));
				document.dispatchEvent(new CustomEvent('videoMergerViewChange', {
					detail: { currentView: 'landing' }
				}));
			}
			return newClips;
		});
	};

	const getTotalDuration = (): number => 
		clips.reduce((total, clip) => total + clip.customDuration, 0);

	// Preload next video for seamless transitions
	useEffect(() => {
		const { currentClipIndex } = playbackState;
		const nextIndex = currentClipIndex + 1;
		
		if (preloadVideoRef.current && nextIndex < clips.length) {
			const nextClip = clips[nextIndex];
			if (nextClip && preloadVideoRef.current.src !== nextClip.url) {
				preloadVideoRef.current.src = nextClip.url;
				preloadVideoRef.current.load();
			}
		}
	}, [playbackState.currentClipIndex, clips]);

	const handleVideoEnded = () => {
		const { currentClipIndex } = playbackState;
		if (currentClipIndex < clips.length - 1) {
			const nextIndex = currentClipIndex + 1;
			setPlaybackState(prev => ({ ...prev, currentClipIndex: nextIndex }));
			
			// Set the next video and auto-play it
			setTimeout(() => {
				if (videoRef.current && clips[nextIndex]) {
					videoRef.current.src = clips[nextIndex].url;
					videoRef.current.load();
					videoRef.current.play().catch(console.error);
				}
			}, 50);
		} else {
			setPlaybackState({ isPlaying: false, currentClipIndex: 0 });
		}
	};

	const togglePlayPause = () => {
		if (!videoRef.current) return;
		
		const video = videoRef.current;
		const willPlay = video.paused;
		
		if (willPlay) {
			video.play();
		} else {
			video.pause();
		}
		
		setPlaybackState(prev => ({ ...prev, isPlaying: willPlay }));
	};

	const handleClipClick = (index: number) => {
		if (index === playbackState.currentClipIndex) return;
		
		const wasPlaying = playbackState.isPlaying;
		setPlaybackState(prev => ({ ...prev, currentClipIndex: index, isPlaying: false }));
		
		// Load and play the selected clip
		setTimeout(() => {
			if (videoRef.current && clips[index]) {
				videoRef.current.src = clips[index].url;
				videoRef.current.load();
				
				if (wasPlaying) {
					videoRef.current.play().then(() => {
						setPlaybackState(prev => ({ ...prev, isPlaying: true }));
					}).catch(console.error);
				}
			}
		}, 50);
	};

	const mergeVideos = async () => {
		if (!clips.length) return;

		setProcessingState({ isProcessing: true, progress: 0 });

		try {
			const outputDimensions = dimensionsState.useCustom 
				? { width: dimensionsState.width, height: dimensionsState.height }
				: { width: clips[0].width, height: clips[0].height };

			const blob = await mergeVideosWithMediaBunny(
				clips.map((clip) => ({
					file: clip.file,
					duration: clip.duration,
					customDuration: clip.customDuration,
				})),
				outputDimensions,
				(progress) => setProcessingState((prev) => ({ ...prev, progress })),
			);
			const url = URL.createObjectURL(blob);
			
			const link = document.createElement('a');
			link.href = url;
			link.download = 'merged_video.mp4';
			link.click();
			URL.revokeObjectURL(url);

		} catch (error) {
			console.error('Error merging videos:', error);
			alert('Error processing videos. Please try again.');
		} finally {
			setProcessingState({ isProcessing: false, progress: 0 });
		}
	};

	if (appState.currentView === 'landing') {
		return (
			<SelectFile
				multiple={true}
				onFileSelect={handleFileSelect}
				validateFile={validateVideoFile}
				validationErrorMessage="Please select valid video files (MP4, MOV, WebM, MKV)."
				supportText="Supports MP4, WebM, MOV, MKV"
				title="Select your videos"
				description="Drop multiple video files here or click to browse"
				buttonText="Choose files"
			/>
		);
	}

	return (
		<DndProvider backend={HTML5Backend}>
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
									src={clips[playbackState.currentClipIndex]?.url}
									onEnded={handleVideoEnded}
									onPlay={() => setPlaybackState(prev => ({ ...prev, isPlaying: true }))}
									onPause={() => setPlaybackState(prev => ({ ...prev, isPlaying: false }))}
									onLoadedData={() => {
										// Auto-play when video loads if we're in playing state
										if (playbackState.isPlaying && videoRef.current) {
											videoRef.current.play().catch(console.error);
										}
									}}
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
										Preview ({playbackState.currentClipIndex + 1}/{clips.length})
									</div>
									<div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded whitespace-nowrap">
										{formatTime(getTotalDuration())} total
									</div>
								</div>
								{clips.length > 0 && (
									<div className="text-xs text-gray-500">
										Playing: {clips[playbackState.currentClipIndex]?.name}
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
									onClick={() => setAppState(prev => ({ ...prev, rightPanelTab: 'clips' }))}
									className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
										appState.rightPanelTab === 'clips' 
											? 'border-teal-500 text-teal-600 bg-teal-50' 
											: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
									}`}
								>
									Clips ({clips.length})
								</button>
								<button 
									onClick={() => setAppState(prev => ({ ...prev, rightPanelTab: 'settings' }))}
									className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
										appState.rightPanelTab === 'settings' 
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
							{appState.rightPanelTab === 'clips' ? (
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
											<DraggableClipItem 
												key={clip.id}
												clip={clip}
												index={index}
												isCurrentlyPlaying={index === playbackState.currentClipIndex}
												moveClip={moveClip}
												removeClip={removeClip}
												updateClipDuration={updateClipDuration}
												resetClipDuration={resetClipDuration}
												formatTime={formatTime}
												onClipClick={handleClipClick}
											/>
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
												setAppState(prev => ({ ...prev, currentView: 'landing' }));
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
													checked={dimensionsState.useCustom}
													onChange={(e) => setDimensionsState(prev => ({ ...prev, useCustom: (e.target as HTMLInputElement).checked }))}
													className="rounded"
												/>
												Custom dimensions
											</label>
										</div>
										
										{dimensionsState.useCustom && (
											<div className="grid grid-cols-2 gap-2">
												<div>
													<label className="block text-xs text-gray-600 mb-1">Width</label>
													<input 
														type="number" 
														min="1" 
														max={CONSTANTS.DIMENSIONS.MAX_WIDTH}
														value={dimensionsState.width}
														onChange={(e) => setDimensionsState(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
														className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
													/>
												</div>
												<div>
													<label className="block text-xs text-gray-600 mb-1">Height</label>
													<input 
														type="number" 
														min="1" 
														max={CONSTANTS.DIMENSIONS.MAX_HEIGHT}
														value={dimensionsState.height}
														onChange={(e) => setDimensionsState(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
														className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
													/>
												</div>
											</div>
										)}
										
										{!dimensionsState.useCustom && clips.length > 0 && (
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
											{playbackState.isPlaying ? 
												<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
													<path d="M6,4V20H10V4H6M14,4V20H18V4H14Z"/>
												</svg> :
												<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
													<path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
												</svg>
											}
											{playbackState.isPlaying ? 'Pause' : 'Preview'}
										</button>
										
										<button 
											onClick={mergeVideos}
											disabled={processingState.isProcessing || clips.length === 0}
											className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 font-medium transition-colors disabled:bg-gray-200 disabled:border-gray-400 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm w-full"
										>
											{processingState.isProcessing ? 
												<div className="flex items-center gap-2">
													<svg className="progress-ring w-4 h-4" viewBox="0 0 24 24">
														<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"
															style={{ strokeDashoffset: 251.2 - (processingState.progress / 100) * 251.2 }} />
													</svg>
													<span>Processing {processingState.progress}%</span>
												</div> : (
												<div className="flex items-center gap-2">
													<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
														<path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
													</svg>
													Download MP4
												</div>
											)
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
			
			{/* Hidden preload video for seamless transitions */}
			<video 
				ref={preloadVideoRef}
				className="hidden"
				preload="metadata"
				muted
			/>
			</div>
		</DndProvider>
	);
};

const VideoMerger = () => <VideoMergerContent />;

export default VideoMerger;
