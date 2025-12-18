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
	type ConversionVideoOptions,
} from 'mediabunny';

export type MediaBunnyOutputFormat = 'mp4' | 'mov' | 'webm' | 'mkv';

export type MediaBunnyConvertOptions = {
	outputFormat: MediaBunnyOutputFormat;
	size?: 'original' | '600xauto' | '540xauto' | '500xauto' | '480xauto' | '320xauto' | 'autox480' | 'autox320';
	fps?: number;
	startTime?: number;
	endTime?: number;
};

export type MediaBunnyConvertResult = {
	blob: Blob;
	filename: string;
	mimeType: string;
};

const SUPPORTED_SIZES: Record<MediaBunnyConvertOptions['size'], Partial<ConversionVideoOptions>> = {
	original: {},
	'600xauto': { width: 600, fit: 'contain' },
	'540xauto': { width: 540, fit: 'contain' },
	'500xauto': { width: 500, fit: 'contain' },
	'480xauto': { width: 480, fit: 'contain' },
	'320xauto': { width: 320, fit: 'contain' },
	'autox480': { height: 480, fit: 'contain' },
	'autox320': { height: 320, fit: 'contain' },
};

const clampFps = (fps?: number, targetFormat?: string): number => {
	if (!Number.isFinite(fps)) {
		return targetFormat === 'gif' ? 10 : 30;
	}

	return Math.max(5, Math.min(30, fps));
};

function stripFileExtension(filename: string): string {
	return filename.replace(/\.[^/.]+$/, '');
}

function getOutputFormat(extension: MediaBunnyOutputFormat) {
	switch (extension) {
		case 'mov':
			return { format: new MovOutputFormat(), fileExtension: 'mov', mimeType: 'video/quicktime' };
		case 'webm':
			return { format: new WebMOutputFormat(), fileExtension: 'webm', mimeType: 'video/webm' };
		case 'mkv':
			return { format: new MkvOutputFormat(), fileExtension: 'mkv', mimeType: 'video/x-matroska' };
		case 'mp4':
		default:
			return { format: new Mp4OutputFormat(), fileExtension: 'mp4', mimeType: 'video/mp4' };
	}
}

export async function convertVideoWithMediaBunny(
	file: File,
	options: MediaBunnyConvertOptions,
	onProgress?: (progressPercent: number) => void,
): Promise<MediaBunnyConvertResult> {
	if (!file) throw new Error('No file provided');

	const { format, fileExtension, mimeType } = getOutputFormat(options.outputFormat);
	const filename = `${stripFileExtension(file.name)}_converted.${fileExtension}`;

	const input = new Input({
		source: new BlobSource(file),
		formats: ALL_FORMATS,
	});

	const output = new Output({
		format,
		target: new BufferTarget(),
	});

	const videoOptions: ConversionVideoOptions = {
		...SUPPORTED_SIZES[options.size ?? 'original'],
		frameRate: clampFps(options.fps, options.outputFormat),
	};

	const conversion = await Conversion.init({
		input,
		output,
		video: videoOptions,
		trim: options.startTime !== undefined || options.endTime !== undefined
			? {
				start: options.startTime,
				end: options.endTime,
			}
			: undefined,
	});

	if (onProgress) {
		conversion.onProgress = (progress) => {
			onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
		};
	}

	try {
		await conversion.execute();
	} finally {
		input.dispose();
	}

	const buffer = (output.target as BufferTarget).buffer;
	if (!buffer) {
		throw new Error('No output buffer generated from MediaBunny');
	}

	return { blob: new Blob([buffer], { type: mimeType }), filename, mimeType };
}
