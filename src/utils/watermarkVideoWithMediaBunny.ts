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

export type WatermarkOutputFormat = 'mp4' | 'mov' | 'webm' | 'mkv';

export type WatermarkPosition = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type WatermarkResult = {
	blob: Blob;
	filename: string;
	mimeType: string;
};

type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function stripFileExtension(filename: string): string {
	return filename.replace(/\.[^/.]+$/, '');
}

function getOutputFormatForExtension(extension: WatermarkOutputFormat): {
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

function validatePosition(position: WatermarkPosition) {
	if (!Number.isFinite(position.left) || position.left < 0) throw new Error('Invalid watermark left');
	if (!Number.isFinite(position.top) || position.top < 0) throw new Error('Invalid watermark top');
	if (!Number.isFinite(position.width) || position.width <= 0) throw new Error('Invalid watermark width');
	if (!Number.isFinite(position.height) || position.height <= 0) throw new Error('Invalid watermark height');
}

async function loadWatermarkBitmap(file: File): Promise<CanvasImageSource> {
	if (typeof createImageBitmap !== 'undefined') {
		return await createImageBitmap(file);
	}

	const url = URL.createObjectURL(file);
	try {
		const image = new Image();
		image.decoding = 'async';
		image.src = url;
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve();
			image.onerror = () => reject(new Error('Failed to load watermark image'));
		});
		return image;
	} finally {
		URL.revokeObjectURL(url);
	}
}

function createCanvas(width: number, height: number): {
	canvas: OffscreenCanvas | HTMLCanvasElement;
	ctx: Canvas2DContext;
} {
	if (typeof OffscreenCanvas !== 'undefined') {
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Failed to create OffscreenCanvas 2D context');
		return { canvas, ctx };
	}

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Failed to create canvas 2D context');
	return { canvas, ctx };
}

function resizeCanvas(canvas: OffscreenCanvas | HTMLCanvasElement, width: number, height: number) {
	if (canvas.width !== width) canvas.width = width;
	if (canvas.height !== height) canvas.height = height;
}

export async function watermarkVideoWithMediaBunny(
	videoFile: File,
	watermarkFile: File,
	options: {
		outputFormat: WatermarkOutputFormat;
		position: WatermarkPosition;
	},
	onProgress?: (progressPercent: number) => void,
): Promise<WatermarkResult> {
	if (!videoFile) throw new Error('No video file provided');
	if (!watermarkFile) throw new Error('No watermark file provided');
	validatePosition(options.position);

	const watermarkImage = await loadWatermarkBitmap(watermarkFile);

	try {
		const { format, fileExtension, mimeType } = getOutputFormatForExtension(options.outputFormat);
		const filename = `watermarked_${stripFileExtension(videoFile.name)}.${fileExtension}`;

		const input = new Input({
			source: new BlobSource(videoFile),
			formats: ALL_FORMATS,
		});

		const output = new Output({
			format,
			target: new BufferTarget(),
		});

		let ctx: Canvas2DContext | null = null;
		let canvas: OffscreenCanvas | HTMLCanvasElement | null = null;

		const conversion = await Conversion.init({
			input,
			output,
			video: {
				process: (sample) => {
					if (!ctx || !canvas) {
						const created = createCanvas(sample.displayWidth, sample.displayHeight);
						canvas = created.canvas;
						ctx = created.ctx;
					} else {
						resizeCanvas(canvas, sample.displayWidth, sample.displayHeight);
					}

					ctx.clearRect(0, 0, canvas.width, canvas.height);
					sample.draw(ctx, 0, 0);
					ctx.drawImage(
						watermarkImage,
						options.position.left,
						options.position.top,
						options.position.width,
						options.position.height,
					);

					return canvas;
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
	} finally {
		if (watermarkImage instanceof ImageBitmap) {
			watermarkImage.close();
		}
	}
}
