import {
	ALL_FORMATS,
	BlobSource,
	Input,
	InputAudioTrack,
	InputVideoTrack,
} from 'mediabunny';
import type {
	AudioStream,
	VideoFormat,
	VideoMetadata,
	VideoStream,
} from '../FFmpegUtils/getVideoInfo';

type StreamStats = {
	packetCount: number;
	averagePacketRate: number;
	averageBitrate: number;
};

const ZERO_STATS: StreamStats = {
	packetCount: 0,
	averagePacketRate: 0,
	averageBitrate: 0,
};

const formatNumber = (value?: number, decimals = 0): string | undefined => {
	if (value === undefined || value === null || Number.isNaN(value)) {
		return undefined;
	}

	if (decimals === 0) {
		return Math.round(value).toString();
	}

	return value.toFixed(decimals);
};

const safeComputeStats = async (track: InputVideoTrack | InputAudioTrack): Promise<StreamStats> => {
	try {
		return await track.computePacketStats(256);
	} catch (error) {
		console.warn('Failed to compute packet stats', error);
		return ZERO_STATS;
	}
};

const normalizeCodec = (codec: string | null | undefined): string => {
	if (!codec) return 'unknown';
	return codec.toUpperCase();
};

export async function analyzeVideoWithMediaBunny(file: File): Promise<VideoMetadata> {
	if (!file) throw new Error('No file provided');

	const input = new Input({
		formats: ALL_FORMATS,
		source: new BlobSource(file),
	});

	try {
		const [formatInfo, durationSeconds, tracks, metadataTags] = await Promise.all([
			input.getFormat(),
			input.computeDuration(),
			input.getTracks(),
			input.getMetadataTags(),
		]);

		const videoTracks = tracks.filter((track) => track.isVideoTrack()) as InputVideoTrack[];
		const audioTracks = tracks.filter((track) => track.isAudioTrack()) as InputAudioTrack[];

		const startTimeTrack = tracks[0];
		const startTimestamp = startTimeTrack ? await startTimeTrack.getFirstTimestamp() : undefined;

		const format: VideoFormat = {
			filename: file.name,
			nb_streams: tracks.length,
			nb_programs: 0,
			format_name: formatInfo.name.toLowerCase(),
			format_long_name: formatInfo.name,
			duration: formatNumber(durationSeconds, 6),
			size: file.size.toString(),
			bit_rate: durationSeconds > 0
				? formatNumber((file.size * 8) / durationSeconds, 0)
				: undefined,
			start_time: formatNumber(startTimestamp, 6),
		};

		const videoStreams: VideoStream[] = [];
		for (const track of videoTracks) {
			const stats = await safeComputeStats(track);
			videoStreams.push({
				index: track.id,
				codec_name: normalizeCodec(track.codec),
				codec_long_name: normalizeCodec(track.codec),
				codec_type: 'video',
				width: track.displayWidth,
				height: track.displayHeight,
				bit_rate: stats.packetCount ? formatNumber(stats.averageBitrate, 0) : undefined,
				avg_frame_rate: stats.packetCount
					? formatNumber(stats.averagePacketRate, 2)
					: undefined,
				duration: format.duration,
			});
		}

		const audioStreams: AudioStream[] = [];
		for (const track of audioTracks) {
			const stats = await safeComputeStats(track);
			audioStreams.push({
				index: track.id,
				codec_name: normalizeCodec(track.codec),
				codec_long_name: normalizeCodec(track.codec),
				codec_type: 'audio',
				channels: track.numberOfChannels,
				sample_rate: track.sampleRate ? track.sampleRate.toString() : undefined,
				bit_rate: stats.packetCount ? formatNumber(stats.averageBitrate, 0) : undefined,
				duration: format.duration,
			});
		}

		return {
			format,
			videoStreams,
			audioStreams,
			raw: (metadataTags.raw ?? {}) as Record<string, unknown>,
		};
	} finally {
		input.dispose();
	}
}
