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

export type FlipDirection = 'horizontal' | 'vertical';
export type FlipOutputFormat = 'mp4' | 'mov' | 'webm' | 'mkv';

export type FlipOptions = {
	outputFormat: FlipOutputFormat;
	direction: FlipDirection;
};

export type FlipResult = {
	blob: Blob;
	filename: string;
	mimeType: string;
};

type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

function stripFileExtension(filename: string): string {
	return filename.replace(/\.[^/.]+$/, '');
}

function getOutputFormatForExtension(extension: FlipOutputFormat): {
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

export async function flipVideoWithMediaBunny(
	file: File,
	options: FlipOptions,
	onProgress?: (progressPercent: number) => void,
): Promise<FlipResult> {
	if (!file) throw new Error('No file provided');

	const { format, fileExtension, mimeType } = getOutputFormatForExtension(options.outputFormat);
	const filename = `${stripFileExtension(file.name)}_flipped.${fileExtension}`;

	const input = new Input({
		source: new BlobSource(file),
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
				ctx.save();

				// Apply flip transformation
				if (options.direction === 'horizontal') {
					// Horizontal flip: scale X by -1 and translate
					ctx.translate(canvas.width, 0);
					ctx.scale(-1, 1);
				} else {
					// Vertical flip: scale Y by -1 and translate
					ctx.translate(0, canvas.height);
					ctx.scale(1, -1);
				}

				// Draw the flipped frame
				sample.draw(ctx, 0, 0);
				ctx.restore();

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
}
