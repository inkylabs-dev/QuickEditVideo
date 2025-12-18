import {
	ALL_FORMATS,
	AudioSample,
	AudioSampleSink,
	AudioBufferSource,
	BlobSource,
	BufferTarget,
	Input,
	Mp4OutputFormat,
	Output,
	QUALITY_HIGH,
	VideoSample,
	VideoSampleSink,
	VideoSampleSource,
} from 'mediabunny';

export type MergeClip = {
	file: File;
	duration: number;
	customDuration: number;
};

export type MergeOutputDimensions = {
	width: number;
	height: number;
};

type AudioConfig = {
	sampleRate: number;
	numberOfChannels: number;
};

async function detectAudioConfigFromClips(clips: MergeClip[]): Promise<AudioConfig | null> {
	for (const clip of clips) {
		const input = new Input({
			source: new BlobSource(clip.file),
			formats: ALL_FORMATS,
		});

		try {
			const audioTrack = await input.getPrimaryAudioTrack();
			if (audioTrack) {
				return {
					sampleRate: audioTrack.sampleRate,
					numberOfChannels: audioTrack.numberOfChannels,
				};
			}
		} finally {
			input.dispose();
		}
	}

	return null;
}

async function resampleAndRemixAudioBuffer(
	audioBuffer: AudioBuffer,
	target: AudioConfig,
): Promise<AudioBuffer> {
	if (
		audioBuffer.sampleRate === target.sampleRate &&
		audioBuffer.numberOfChannels === target.numberOfChannels
	) {
		return audioBuffer;
	}

	if (typeof OfflineAudioContext === 'undefined') {
		throw new Error(
			'OfflineAudioContext is not available; cannot resample/remix audio in this environment.',
		);
	}

	const targetLength = Math.max(1, Math.round(audioBuffer.duration * target.sampleRate));
	const context = new OfflineAudioContext(target.numberOfChannels, targetLength, target.sampleRate);

	const source = context.createBufferSource();
	source.buffer = audioBuffer;
	source.connect(context.destination);
	source.start(0);

	return await context.startRendering();
}

async function addAudioSampleBuffer(options: {
	audioSource: AudioBufferSource;
	inputSample: AudioSample;
	target: AudioConfig;
}) {
	const { audioSource, inputSample, target } = options;
	const inputBuffer = inputSample.toAudioBuffer();

	if (
		Math.round(inputBuffer.sampleRate) === Math.round(target.sampleRate)
		&& inputBuffer.numberOfChannels === target.numberOfChannels
	) {
		await audioSource.add(inputBuffer);
		return;
	}

	const normalizedBuffer = await resampleAndRemixAudioBuffer(inputBuffer, target);
	await audioSource.add(normalizedBuffer);
}

async function addSilence(options: {
	audioSource: AudioBufferSource;
	duration: number;
	audioConfig: AudioConfig;
	chunkSeconds?: number;
}) {
	const { audioSource, duration, audioConfig, chunkSeconds = 1 } = options;
	let cursor = 0;

	while (cursor < duration) {
		const sliceDuration = Math.min(chunkSeconds, duration - cursor);
		const length = Math.max(1, Math.round(sliceDuration * audioConfig.sampleRate));

		const audioBuffer = new AudioBuffer({
			length,
			sampleRate: audioConfig.sampleRate,
			numberOfChannels: audioConfig.numberOfChannels,
		});

		await audioSource.add(audioBuffer);
		cursor += sliceDuration;
	}
}

export async function mergeVideosWithMediaBunny(
	clips: MergeClip[],
	outputDimensions: MergeOutputDimensions,
	onProgress?: (progress: number) => void,
): Promise<Blob> {
	if (clips.length === 0) {
		throw new Error('No clips provided');
	}

	const totalDuration = clips.reduce((sum, clip) => sum + clip.customDuration, 0);
	const reportProgress = (currentDuration: number) => {
		if (!onProgress) return;
		if (totalDuration <= 0) return onProgress(0);
		const progress = Math.max(0, Math.min(100, Math.round((currentDuration / totalDuration) * 100)));
		onProgress(progress);
	};

	const { width, height } = outputDimensions;
	if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
		throw new Error('Invalid output dimensions');
	}

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Canvas 2D context is not available');
	}

	const videoSource = new VideoSampleSource({
		codec: 'avc',
		bitrate: QUALITY_HIGH,
		sizeChangeBehavior: 'fill',
	});

	const audioConfig = (await detectAudioConfigFromClips(clips)) ?? {
		sampleRate: 44100,
		numberOfChannels: 2,
	};
	const audioSource = new AudioBufferSource({
		codec: 'aac',
		bitrate: 128000,
	});

	const output = new Output({
		format: new Mp4OutputFormat(),
		target: new BufferTarget(),
	});

	output.addVideoTrack(videoSource);
	output.addAudioTrack(audioSource);
	await output.start();

	let outputTime = 0;
	reportProgress(outputTime);

	try {
		for (const clip of clips) {
			const input = new Input({
				source: new BlobSource(clip.file),
				formats: ALL_FORMATS,
			});

			try {
				const videoTrack = await input.getPrimaryVideoTrack();
				if (!videoTrack) {
					throw new Error(`No video track found in ${clip.file.name}`);
				}

				const audioTrack = await input.getPrimaryAudioTrack();
				const videoSink = new VideoSampleSink(videoTrack);
				const audioSink = audioTrack ? new AudioSampleSink(audioTrack) : null;

				const videoStart = await videoTrack.getFirstTimestamp();
				const audioStart = audioTrack ? await audioTrack.getFirstTimestamp() : 0;

				let remaining = clip.customDuration;
				let loopIndex = 0;

				while (remaining > 0) {
					const segmentDuration = Math.min(clip.duration, remaining);
					const loopOffset = loopIndex * clip.duration;

					for await (const frame of videoSink.samples(videoStart, videoStart + segmentDuration)) {
						let outputFrame: VideoSample | null = null;
						try {
							const relativeTimestamp = frame.timestamp - videoStart;
							const timestamp = outputTime + loopOffset + relativeTimestamp;

							ctx.clearRect(0, 0, width, height);
							frame.draw(ctx, 0, 0, width, height);

							outputFrame = new VideoSample(canvas, {
								timestamp,
								duration: frame.duration,
							});

							await videoSource.add(outputFrame);
							reportProgress(Math.min(totalDuration, timestamp));
						} finally {
							outputFrame?.close();
							frame.close();
						}
					}

					if (audioSink) {
						for await (const sample of audioSink.samples(audioStart, audioStart + segmentDuration)) {
							try {
								await addAudioSampleBuffer({
									audioSource,
									inputSample: sample,
									target: audioConfig,
								});
							} finally {
								sample.close();
							}
						}
					} else {
						await addSilence({
							audioSource,
							duration: segmentDuration,
							audioConfig,
						});
					}

					remaining -= segmentDuration;
					loopIndex += 1;
				}
			} finally {
				input.dispose();
			}

			outputTime += clip.customDuration;
			reportProgress(outputTime);
		}

		await output.finalize();
	} catch (error) {
		await output.cancel();
		throw error;
	}

	const buffer = (output.target as BufferTarget).buffer;
	if (!buffer) {
		throw new Error('No output buffer generated from MediaBunny');
	}

	reportProgress(totalDuration);
	return new Blob([buffer], { type: 'video/mp4' });
}
