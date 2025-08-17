import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
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

  it('renders landing view with video and logo upload areas', () => {
    render(<VideoWatermark />);
    
    // Check that both upload areas are present
    expect(screen.getByText('Select your video')).toBeInTheDocument();
    expect(screen.getByText('Select your logo')).toBeInTheDocument();
    
    // Check for "Choose file" buttons (there should be 2)
    const chooseFileButtons = screen.getAllByText('Choose file');
    expect(chooseFileButtons).toHaveLength(2);
    
    // Check that file inputs are present
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs).toHaveLength(2);
    
    // Verify one accepts video and one accepts images
    const videoInput = Array.from(fileInputs).find(input => 
      input.getAttribute('accept') === 'video/*'
    );
    const logoInput = Array.from(fileInputs).find(input => 
      input.getAttribute('accept') === 'image/*'
    );
    
    expect(videoInput).toBeInTheDocument();
    expect(logoInput).toBeInTheDocument();
  });

  it('accepts valid video file upload', async () => {
    render(<VideoWatermark />);
    
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const videoInput = Array.from(fileInputs).find(input => 
      input.getAttribute('accept') === 'video/*'
    ) as HTMLInputElement;
    
    const videoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });
    
    await act(async () => {
      fireEvent.change(videoInput, { target: { files: [videoFile] } });
    });
    
    // File should be accepted (no alert should be called)
    expect(global.alert).not.toHaveBeenCalled();
  });

  it('accepts valid logo file upload', async () => {
    render(<VideoWatermark />);
    
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const logoInput = Array.from(fileInputs).find(input => 
      input.getAttribute('accept') === 'image/*'
    ) as HTMLInputElement;
    
    const logoFile = new File(['logo content'], 'logo.png', { type: 'image/png' });
    
    await act(async () => {
      fireEvent.change(logoInput, { target: { files: [logoFile] } });
    });
    
    // File should be accepted (no alert should be called)
    expect(global.alert).not.toHaveBeenCalled();
  });

  it('handles various video formats correctly', async () => {
    render(<VideoWatermark />);
    
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const videoInput = Array.from(fileInputs).find(input => 
      input.getAttribute('accept') === 'video/*'
    ) as HTMLInputElement;
    
    // Test different video formats - they should all be accepted
    const formats = [
      { name: 'test.mp4', type: 'video/mp4' },
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
      
      // Should not trigger any alerts (file should be accepted)
      expect(global.alert).not.toHaveBeenCalled();
    }
  });

  it('handles various image formats correctly', async () => {
    render(<VideoWatermark />);
    
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const logoInput = Array.from(fileInputs).find(input => 
      input.getAttribute('accept') === 'image/*'
    ) as HTMLInputElement;
    
    // Test different image formats - they should all be accepted
    const formats = [
      { name: 'logo.png', type: 'image/png' },
      { name: 'logo.jpg', type: 'image/jpeg' },
      { name: 'logo.jpeg', type: 'image/jpeg' },
      { name: 'logo.svg', type: 'image/svg+xml' },
      { name: 'logo.bmp', type: 'image/bmp' },
    ];
    
    for (const format of formats) {
      const logoFile = new File(['logo content'], format.name, { type: format.type });
      
      await act(async () => {
        fireEvent.change(logoInput, { target: { files: [logoFile] } });
      });
      
      // Should not trigger any alerts (file should be accepted)
      expect(global.alert).not.toHaveBeenCalled();
    }
  });

  it('provides privacy assurance message', () => {
    render(<VideoWatermark />);
    
    // Check that privacy message is displayed
    expect(screen.getByText('Your files never leave your device')).toBeInTheDocument();
  });

  it('has proper file input accessibility', () => {
    render(<VideoWatermark />);
    
    // Check that file inputs are properly configured
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    // Should have exactly 2 file inputs
    expect(fileInputs).toHaveLength(2);
    
    // Both should be hidden (handled by custom UI)
    fileInputs.forEach(input => {
      expect(input).toHaveClass('hidden');
    });
  });

  it('displays proper format support messages', () => {
    render(<VideoWatermark />);
    
    // Check video format support message
    expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
    
    // Check image format support message
    expect(screen.getByText('Supports PNG, JPG, SVG and more')).toBeInTheDocument();
  });

  it('allows testing of core component structure', () => {
    render(<VideoWatermark />);
    
    // Test that the component renders without errors
    const container = document.querySelector('.grid');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    
    // Test upload areas styling
    const uploadAreas = document.querySelectorAll('.border-dashed');
    expect(uploadAreas).toHaveLength(2);
    
    uploadAreas.forEach(area => {
      expect(area).toHaveClass('border-gray-900', 'hover:border-gray-900');
    });
  });
});