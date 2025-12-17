import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import FrameExtractor from '../../../src/components/FrameExtractor';

vi.mock('../../../src/utils/extractFramesWithMediaBunny', () => ({
  extractFramesWithMediaBunny: vi.fn().mockResolvedValue([
    { time: 0, data: new Uint8Array([1, 2, 3, 4]), filename: 'frame_0.00s.png' },
  ]),
  extractFramesInRangeWithMediaBunny: vi.fn().mockResolvedValue([
    { time: 0, data: new Uint8Array([1, 2, 3, 4]), filename: 'frame_0.00s.png' },
    { time: 1, data: new Uint8Array([5, 6, 7, 8]), filename: 'frame_1.00s.png' },
  ]),
}));

vi.mock('jszip', () => ({
  default: vi.fn().mockImplementation(() => ({
    file: vi.fn(),
    generateAsync: vi.fn().mockResolvedValue(new Blob(['mock-zip-content'])),
  })),
}));

describe('FrameExtractor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.alert = vi.fn();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders landing view initially', () => {
    render(<FrameExtractor />);

    expect(screen.getByText('Select your video')).toBeInTheDocument();
    expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Choose file')).toBeInTheDocument();
    expect(screen.getByText('Supports MP4, WebM, MOV, MKV')).toBeInTheDocument();
  });

  it('rejects non-video files via validation alert', async () => {
    render(<FrameExtractor />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const textFile = new File(['x'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      fireEvent.change(input, { target: { files: [textFile] } });
    });

    expect(global.alert).toHaveBeenCalledWith('Please select a valid video file (MP4, MOV, WebM, MKV).');
  });

  it('transitions to extraction view when a video is uploaded', async () => {
    const { container } = render(<FrameExtractor />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    const videoFile = new File(['video'], 'test.mp4', { type: 'video/mp4' });
    await act(async () => {
      fireEvent.change(input, { target: { files: [videoFile] } });
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Extract Frames/i })).toBeInTheDocument();
    });
  });
});
