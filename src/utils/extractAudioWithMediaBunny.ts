import {
	ALL_FORMATS,
	BlobSource,
	BufferTarget,
	Conversion,
	Input,
	Output,
	WavOutputFormat,
	Mp3OutputFormat,
	canEncodeAudio,
} from 'mediabunny';
import { registerMp3Encoder } from '@mediabunny/mp3-encoder';

export type AudioOutputFormat = 'mp3' | 'wav';

export type AudioExtractionOptions = {
	outputFormat: AudioOutputFormat;
};

export type AudioExtractionResult = {
	blob: Blob;
	filename: string;
	mimeType: string;
};

function stripFileExtension(filename: string): string {
	return filename.replace(/\.[^/.]+$/, '');
}

function getMimeType(format: AudioOutputFormat): string {
	switch (format) {
		case 'mp3':
			return 'audio/mpeg';
		case 'wav':
			return 'audio/wav';
		default:
			throw new Error(`Unsupported audio format: ${format satisfies never}`);
	}
}

export async function extractAudioWithMediaBunny(
	file: File,
	options: AudioExtractionOptions,
	onProgress?: (progressPercent: number) => void,
): Promise<AudioExtractionResult> {
	if (!file) throw new Error('No file provided');

	const mimeType = getMimeType(options.outputFormat);
	const filename = `${stripFileExtension(file.name)}_extracted.${options.outputFormat}`;

	const input = new Input({
		source: new BlobSource(file),
		formats: ALL_FORMATS,
	});

	let output: Output;

	if (options.outputFormat === 'wav') {
		// WAV format - uncompressed audio
		output = new Output({
			format: new WavOutputFormat(),
			target: new BufferTarget(),
		});
	} else {
		// MP3 format - compressed audio using MP3 encoder
		// Register MP3 encoder if not natively supported
		if (!(await canEncodeAudio('mp3'))) {
			registerMp3Encoder();
		}
		output = new Output({
			format: new Mp3OutputFormat(),
			target: new BufferTarget(),
		});
	}

	const conversion = await Conversion.init({
		input,
		output,
		video: {
			discard: true, // Remove video track, keep only audio
		},
	});

	if (onProgress) {
		conversion.onProgress = (progress) => {
			onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
		};
	}

	await conversion.execute();

	const buffer = (output.target as BufferTarget).buffer;
	if (!buffer) {
		throw new Error('No output buffer generated from MediaBunny');
	}

	return { blob: new Blob([buffer], { type: mimeType }), filename, mimeType };
}
