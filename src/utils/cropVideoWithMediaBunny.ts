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

export type CropOutputFormat = 'mp4' | 'mov' | 'webm' | 'mkv';

export type CropRectangle = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type CropOptions = {
	outputFormat: CropOutputFormat;
	crop: CropRectangle;
};

export type CropResult = {
	blob: Blob;
	filename: string;
	mimeType: string;
};

function stripFileExtension(filename: string): string {
	return filename.replace(/\.[^/.]+$/, '');
}

function getOutputFormatForExtension(extension: CropOutputFormat): {
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

function validateCropRectangle(crop: CropRectangle) {
	if (!Number.isFinite(crop.left) || crop.left < 0) throw new Error('Invalid crop left');
	if (!Number.isFinite(crop.top) || crop.top < 0) throw new Error('Invalid crop top');
	if (!Number.isFinite(crop.width) || crop.width <= 0) throw new Error('Invalid crop width');
	if (!Number.isFinite(crop.height) || crop.height <= 0) throw new Error('Invalid crop height');
}

export async function cropVideoWithMediaBunny(
	file: File,
	options: CropOptions,
	onProgress?: (progressPercent: number) => void,
): Promise<CropResult> {
	if (!file) throw new Error('No file provided');
	validateCropRectangle(options.crop);

	const { format, fileExtension, mimeType } = getOutputFormatForExtension(options.outputFormat);
	const filename = `${stripFileExtension(file.name)}_cropped.${fileExtension}`;

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
		video: { crop: { ...options.crop } },
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

