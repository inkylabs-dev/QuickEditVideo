import { ALL_FORMATS, BlobSource, Input, VideoSampleSink } from 'mediabunny';

export type FrameImageFormat = 'png' | 'jpg';

export type ExtractedFrame = {
	time: number;
	data: Uint8Array;
	filename: string;
};

type Canvas2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

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

async function canvasToBlob(
	canvas: OffscreenCanvas | HTMLCanvasElement,
	format: FrameImageFormat,
): Promise<Blob> {
	const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';

	if ('convertToBlob' in canvas) {
		const options: { type: string; quality?: number } = { type: mimeType };
		if (format === 'jpg') options.quality = 0.92;
		return await (canvas as OffscreenCanvas).convertToBlob(options);
	}

	return await new Promise<Blob>((resolve, reject) => {
		(canvas as HTMLCanvasElement).toBlob(
			(blob) => {
				if (!blob) return reject(new Error('Failed to encode frame'));
				resolve(blob);
			},
			mimeType,
			format === 'jpg' ? 0.92 : undefined,
		);
	});
}

function formatFrameFilename(timeSeconds: number, format: FrameImageFormat): string {
	return `frame_${timeSeconds.toFixed(2)}s.${format}`;
}

export async function extractFramesWithMediaBunny(
	inputFile: File,
	times: number[],
	format: FrameImageFormat = 'png',
	onProgress?: (progressPercent: number) => void,
): Promise<ExtractedFrame[]> {
	if (!inputFile) throw new Error('No file provided');
	if (!Array.isArray(times) || times.length === 0) return [];

	const input = new Input({
		source: new BlobSource(inputFile),
		formats: ALL_FORMATS,
	});

	try {
		const videoTrack = await input.getPrimaryVideoTrack();
		if (!videoTrack) throw new Error('No video track found in file');

		const sink = new VideoSampleSink(videoTrack);

		let ctx: Canvas2DContext | null = null;
		let canvas: OffscreenCanvas | HTMLCanvasElement | null = null;

		const results: ExtractedFrame[] = [];
		let processed = 0;

		for await (const sample of sink.samplesAtTimestamps(times)) {
			const requestedTime = times[processed] ?? 0;
			try {
				if (!sample) throw new Error(`No frame available at ${requestedTime.toFixed(2)}s`);

				if (!ctx || !canvas) {
					const created = createCanvas(sample.displayWidth, sample.displayHeight);
					canvas = created.canvas;
					ctx = created.ctx;
				} else {
					resizeCanvas(canvas, sample.displayWidth, sample.displayHeight);
				}

				ctx.clearRect(0, 0, canvas.width, canvas.height);
				sample.draw(ctx, 0, 0);

				const blob = await canvasToBlob(canvas, format);
				const buffer = await blob.arrayBuffer();
				results.push({
					time: requestedTime,
					data: new Uint8Array(buffer),
					filename: formatFrameFilename(requestedTime, format),
				});
			} finally {
				sample?.close();
				processed += 1;
				if (onProgress) {
					onProgress(Math.max(0, Math.min(100, Math.round((processed / times.length) * 100))));
				}
			}
		}

		if (processed !== times.length) {
			throw new Error(
				`Failed to extract all requested frames (got ${processed}, expected ${times.length}).`,
			);
		}

		return results;
	} finally {
		input.dispose();
	}
}

export async function extractFramesInRangeWithMediaBunny(
	inputFile: File,
	startTime: number,
	endTime: number,
	interval: number = 1,
	format: FrameImageFormat = 'png',
	onProgress?: (progressPercent: number) => void,
): Promise<ExtractedFrame[]> {
	const times: number[] = [];

	for (let t = startTime; t < endTime; t += interval) {
		times.push(t);
	}

	if (times.length === 0 || (times[times.length - 1] !== endTime && endTime > startTime)) {
		times.push(endTime);
	}

	return extractFramesWithMediaBunny(inputFile, times, format, onProgress);
}
