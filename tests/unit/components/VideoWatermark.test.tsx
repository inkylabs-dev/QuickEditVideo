import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { act } from 'preact/test-utils';
import VideoWatermark from '../../../src/components/VideoWatermark';

// Mock the addWatermark utility specifically
vi.mock('../../../src/FFmpegUtils/addWatermark', () => ({
  addWatermark: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
}));

describe('VideoWatermark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders landing view initially', () => {
    render(<VideoWatermark />);
    
    expect(screen.getByText('Select your video')).toBeInTheDocument();
    expect(screen.getByText('Choose Video File')).toBeInTheDocument();
    expect(screen.getByText('Select watermark logo')).toBeInTheDocument();
    expect(screen.getByText('Choose Logo File')).toBeInTheDocument();
  });

  it('accepts video file upload', async () => {
    render(<VideoWatermark />);
    
    // Find video file input by its accept attribute
    const videoInput = screen.getByDisplayValue('') as HTMLInputElement;
    expect(videoInput).toBeInTheDocument();
    
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(videoInput, { target: { files: [videoFile] } });
    });
    
    // File should be processed
    await waitFor(() => {
      expect(screen.getByText('test.mp4')).toBeInTheDocument();
    });
  });

  it('rejects non-video files for video input', async () => {
    render(<VideoWatermark />);
    
    const videoInput = screen.getByDisplayValue('') as HTMLInputElement;
    const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
    
    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    await act(async () => {
      fireEvent.change(videoInput, { target: { files: [textFile] } });
    });

    expect(alertSpy).toHaveBeenCalledWith('Please select a valid video file.');
    
    alertSpy.mockRestore();
  });

  it('handles video format detection correctly', async () => {
    render(<VideoWatermark />);
    
    const videoInput = screen.getByDisplayValue('') as HTMLInputElement;
    
    // Test different video formats
    const formats = [
      { name: 'test.mov', type: 'video/quicktime' },
      { name: 'test.mkv', type: 'video/x-matroska' },
      { name: 'test.avi', type: 'video/x-msvideo' },
      { name: 'test.webm', type: 'video/webm' },
    ];
    
    for (const format of formats) {
      const videoFile = new File(['video content'], format.name, { type: format.type });
      
      await act(async () => {
        fireEvent.change(videoInput, { target: { files: [videoFile] } });
      });
      
      await waitFor(() => {
        expect(screen.getByText(format.name)).toBeInTheDocument();
      });
    }
  });

  it('shows error message when processing fails', async () => {
    // Mock addWatermark to throw an error
    const { addWatermark } = await import('../../../src/FFmpegUtils/addWatermark');
    vi.mocked(addWatermark).mockRejectedValueOnce(new Error('Processing failed'));
    
    render(<VideoWatermark />);
    
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const videoInput = fileInputs[0] as HTMLInputElement;
    const logoInput = fileInputs[1] as HTMLInputElement;
    
    // Upload both files
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    const logoFile = new File(['logo content'], 'logo.png', { type: 'image/png' });
    
    await act(async () => {
      fireEvent.change(videoInput, { target: { files: [videoFile] } });
    });
    
    await act(async () => {
      fireEvent.change(logoInput, { target: { files: [logoFile] } });
    });
    
    // Mock alert for error handling
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    // Try to find and click the process button
    await waitFor(async () => {
      const buttons = screen.getAllByRole('button');
      const processButton = buttons.find(btn => 
        btn.textContent?.includes('Download') || btn.textContent?.includes('Add Watermark')
      );
      
      if (processButton) {
        await act(async () => {
          fireEvent.click(processButton);
        });
        
        // Should show error alert
        expect(alertSpy).toHaveBeenCalledWith('Error processing watermark. Please try again.');
      }
    });
    
    alertSpy.mockRestore();
  });
});