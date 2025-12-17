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

export type ResizeOutputFormat = 'mp4' | 'mov' | 'webm' | 'mkv';

export type ResizeOptions = {
	width: number;
	height: number;
	outputFormat: ResizeOutputFormat;
};

export type ResizeResult = {
	blob: Blob;
	filename: string;
	mimeType: string;
};

function stripFileExtension(filename: string): string {
	return filename.replace(/\.[^/.]+$/, '');
}

function getOutputFormatForExtension(extension: ResizeOutputFormat): {
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
			// Exhaustiveness guard
			throw new Error(`Unsupported output format: ${extension satisfies never}`);
		}
	}
}

export async function resizeVideoWithMediaBunny(
	file: File,
	options: ResizeOptions,
	onProgress?: (progressPercent: number) => void,
): Promise<ResizeResult> {
	if (!file) throw new Error('No file provided');
	if (!Number.isFinite(options.width) || options.width <= 0) throw new Error('Invalid width');
	if (!Number.isFinite(options.height) || options.height <= 0) throw new Error('Invalid height');

	const { format, fileExtension, mimeType } = getOutputFormatForExtension(options.outputFormat);
	const filename = `${stripFileExtension(file.name)}_resized.${fileExtension}`;

	const input = new Input({
		source: new BlobSource(file),
		formats: ALL_FORMATS,
	});

	const output = new Output({
		format,
		target: new BufferTarget(),
	});

	const conversion = await Conversion.init({
		input,
		output,
		video: { width: options.width, height: options.height, fit: 'fill' },
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

