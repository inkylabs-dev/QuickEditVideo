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

export type SpeedOutputFormat = 'mp4' | 'mov' | 'webm' | 'mkv';

export type SpeedOptions = {
	outputFormat: SpeedOutputFormat;
	speed: number; // 0.25 to 4.0
};

export type SpeedResult = {
	blob: Blob;
	filename: string;
	mimeType: string;
};

function stripFileExtension(filename: string): string {
	return filename.replace(/\.[^/.]+$/, '');
}

function getOutputFormatForExtension(extension: SpeedOutputFormat): {
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
			throw new Error(`Unsupported output format: ${extension satisfies never}`);
		}
	}
}

function formatSpeed(speed: number): string {
	if (speed >= 1) {
		return speed % 1 === 0 ? `${speed}` : speed.toFixed(2).replace(/\.?0+$/, '');
	} else {
		return speed.toFixed(2).replace(/\.?0+$/, '');
	}
}

export async function changeVideoSpeedWithMediaBunny(
	file: File,
	options: SpeedOptions,
	onProgress?: (progressPercent: number) => void,
): Promise<SpeedResult> {
	if (!file) throw new Error('No file provided');
	if (options.speed < 0.25 || options.speed > 4) {
		throw new Error('Speed must be between 0.25 and 4.0');
	}

	const { format, fileExtension, mimeType } = getOutputFormatForExtension(options.outputFormat);
	const speedText = options.speed < 1 ? `${formatSpeed(options.speed)}x_slow` : `${formatSpeed(options.speed)}x_fast`;
	const filename = `${stripFileExtension(file.name)}_${speedText}.${fileExtension}`;

	const input = new Input({
		source: new BlobSource(file),
		formats: ALL_FORMATS,
	});

	const output = new Output({
		format,
		target: new BufferTarget(),
	});

	// For speed changes, we need to use custom processing
	// MediaBunny doesn't have direct speed options, so we manipulate timestamps
	let frameIndex = 0;
	let lastTimestamp = 0;

	const conversion = await Conversion.init({
		input,
		output,
		video: {
			process: (sample) => {
				// Adjust video sample timestamp based on speed
				// For 2x speed: timestamp becomes half (video plays faster)
				// For 0.5x speed: timestamp becomes double (video plays slower)
				const adjustedTimestamp = sample.timestamp / options.speed;

				(sample as any).timestamp = adjustedTimestamp;
				lastTimestamp = adjustedTimestamp;
				frameIndex++;

				return sample;
			},
		},
		audio: {
			process: (sample) => {
				// Adjust audio sample timestamp to match video speed
				(sample as any).timestamp = sample.timestamp / options.speed;
				return sample;
			},
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
