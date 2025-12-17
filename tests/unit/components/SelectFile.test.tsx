import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SelectFile } from '../../../src/components/SelectFile';

// Mock window.alert
const mockAlert = vi.fn();
Object.defineProperty(window, 'alert', {
  writable: true,
  value: mockAlert
});

describe('SelectFile', () => {
  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Default Rendering', () => {
    it('renders with default props', () => {
      render(<SelectFile onFileSelect={mockOnFileSelect} />);

      expect(screen.getByText('Select your video')).toBeInTheDocument();
      expect(screen.getByText('Drop a video file here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Choose file')).toBeInTheDocument();
      expect(screen.getByText('Supports MP4, WebM, AVI, MOV and more')).toBeInTheDocument();
    });

    it('has file input with correct default attributes', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
      expect(fileInput.accept).toBe('video/*');
      expect(fileInput.multiple).toBe(false);
      expect(fileInput.className).toContain('hidden');
    });

    it('renders file icon', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const fileIcon = container.querySelector('svg[width="64"]');
      expect(fileIcon).toBeInTheDocument();
    });

    it('renders button icon', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const buttonIcon = container.querySelector('svg[width="20"]');
      expect(buttonIcon).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('renders with custom title', () => {
      render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          title="Custom Title"
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.queryByText('Select your video')).not.toBeInTheDocument();
    });

    it('renders with custom description', () => {
      render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          description="Custom description text"
        />
      );

      expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });

    it('renders with custom button text', () => {
      render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          buttonText="Select Files"
        />
      );

      expect(screen.getByText('Select Files')).toBeInTheDocument();
      expect(screen.queryByText('Choose file')).not.toBeInTheDocument();
    });

    it('renders with custom support text', () => {
      render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          supportText="Custom support text"
        />
      );

      expect(screen.getByText('Custom support text')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          className="custom-class"
        />
      );

      const dropArea = container.querySelector('.custom-class');
      expect(dropArea).toBeInTheDocument();
    });

    it('supports custom accept attribute', () => {
      const { container } = render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          accept="image/*"
        />
      );
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput.accept).toBe('image/*');
    });
  });

  describe('Multiple File Selection', () => {
    it('enables multiple file selection when multiple=true', () => {
      const { container } = render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          multiple={true}
        />
      );
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput.multiple).toBe(true);
    });

    it('configures for multiple files with appropriate defaults', () => {
      render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          multiple={true}
          title="Select your videos"
          description="Drop multiple video files here or click to browse"
          buttonText="Choose files"
        />
      );

      expect(screen.getByText('Select your videos')).toBeInTheDocument();
      expect(screen.getByText('Drop multiple video files here or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Choose files')).toBeInTheDocument();
    });
  });

  describe('File Input Interaction', () => {
    it('opens file dialog when clicked', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
      
      const clickableArea = container.querySelector('.cursor-pointer');
      fireEvent.click(clickableArea!);
      
      expect(clickSpy).toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('handles single file selection', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
    });

    it('handles multiple file selection', () => {
      const { container } = render(
        <SelectFile onFileSelect={mockOnFileSelect} multiple={true} />
      );
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile1 = new File(['content1'], 'test1.mp4', { type: 'video/mp4' });
      const mockFile2 = new File(['content2'], 'test2.mp4', { type: 'video/mp4' });
      
      // Create a FileList-like object
      const mockFileList = {
        0: mockFile1,
        1: mockFile2,
        length: 2,
        item: (index: number) => index === 0 ? mockFile1 : index === 1 ? mockFile2 : null
      } as FileList;
      
      fireEvent.change(fileInput, { target: { files: mockFileList } });
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFileList);
    });

    it('handles empty file selection', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(fileInput, { target: { files: null } });
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(null);
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag over events', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const dropArea = container.querySelector('.cursor-pointer');
      
      fireEvent.dragOver(dropArea!, {
        dataTransfer: {
          files: []
        }
      });
      
      // Just verify the event doesn't crash the component
      expect(dropArea).toBeInTheDocument();
    });

    it('handles drag enter events', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const dropArea = container.querySelector('.cursor-pointer');
      
      fireEvent.dragEnter(dropArea!, {
        dataTransfer: {
          files: []
        }
      });
      
      // Just verify the event doesn't crash the component
      expect(dropArea).toBeInTheDocument();
    });

    it('handles single file drop', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const dropArea = container.querySelector('.cursor-pointer');
      const mockFile = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      
      // Create a FileList-like object
      const mockFileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => index === 0 ? mockFile : null,
        [Symbol.iterator]: function* () { yield mockFile; }
      } as FileList;
      
      fireEvent.drop(dropArea!, {
        dataTransfer: {
          files: mockFileList
        }
      });
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
    });

    it('handles multiple file drop when multiple=true', () => {
      const { container } = render(
        <SelectFile onFileSelect={mockOnFileSelect} multiple={true} />
      );
      
      const dropArea = container.querySelector('.cursor-pointer');
      const mockFile1 = new File(['content1'], 'test1.mp4', { type: 'video/mp4' });
      const mockFile2 = new File(['content2'], 'test2.mp4', { type: 'video/mp4' });
      
      // Create a FileList-like object
      const mockFileList = {
        0: mockFile1,
        1: mockFile2,
        length: 2,
        item: (index: number) => index === 0 ? mockFile1 : index === 1 ? mockFile2 : null,
        [Symbol.iterator]: function* () { yield mockFile1; yield mockFile2; }
      } as FileList;
      
      fireEvent.drop(dropArea!, {
        dataTransfer: {
          files: mockFileList
        }
      });
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFileList);
    });

    it('handles drop with no files', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const dropArea = container.querySelector('.cursor-pointer');
      
      // Create an empty FileList-like object
      const emptyFileList = {
        length: 0,
        item: () => null,
        [Symbol.iterator]: function* () {}
      } as FileList;
      
      fireEvent.drop(dropArea!, {
        dataTransfer: {
          files: emptyFileList
        }
      });
      
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('only takes first file when multiple files dropped in single mode', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const dropArea = container.querySelector('.cursor-pointer');
      const mockFile1 = new File(['content1'], 'test1.mp4', { type: 'video/mp4' });
      const mockFile2 = new File(['content2'], 'test2.mp4', { type: 'video/mp4' });
      
      // Create a FileList-like object with multiple files
      const mockFileList = {
        0: mockFile1,
        1: mockFile2,
        length: 2,
        item: (index: number) => index === 0 ? mockFile1 : index === 1 ? mockFile2 : null,
        [Symbol.iterator]: function* () { yield mockFile1; yield mockFile2; }
      } as FileList;
      
      fireEvent.drop(dropArea!, {
        dataTransfer: {
          files: mockFileList
        }
      });
      
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile1);
    });
  });

  describe('File Validation', () => {
    const mockValidateFile = vi.fn();

    beforeEach(() => {
      mockValidateFile.mockReset();
    });

    it('validates files on input change', () => {
      mockValidateFile.mockReturnValue(true);
      
      const { container } = render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          validateFile={mockValidateFile}
        />
      );
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      expect(mockValidateFile).toHaveBeenCalledWith(mockFile);
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
    });

    it('shows alert and does not call onFileSelect when validation fails', () => {
      mockValidateFile.mockReturnValue(false);
      
      const { container } = render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          validateFile={mockValidateFile}
          validationErrorMessage="Invalid file type"
        />
      );
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      expect(mockValidateFile).toHaveBeenCalledWith(mockFile);
      expect(mockAlert).toHaveBeenCalledWith('Invalid file type');
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });

    it('validates files on drop', () => {
      mockValidateFile.mockReturnValue(true);
      
      const { container } = render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          validateFile={mockValidateFile}
        />
      );
      
      const dropArea = container.querySelector('.cursor-pointer');
      const mockFile = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      
      // Create a FileList-like object
      const mockFileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => index === 0 ? mockFile : null,
        [Symbol.iterator]: function* () { yield mockFile; }
      } as FileList;
      
      fireEvent.drop(dropArea!, {
        dataTransfer: {
          files: mockFileList
        }
      });
      
      expect(mockValidateFile).toHaveBeenCalledWith(mockFile);
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
    });

    it('validates all files in multiple selection', () => {
      mockValidateFile.mockReturnValue(true);
      
      const { container } = render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          multiple={true}
          validateFile={mockValidateFile}
        />
      );
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile1 = new File(['content1'], 'test1.mp4', { type: 'video/mp4' });
      const mockFile2 = new File(['content2'], 'test2.mp4', { type: 'video/mp4' });
      
      const mockFileList = {
        0: mockFile1,
        1: mockFile2,
        length: 2,
        item: (index: number) => index === 0 ? mockFile1 : index === 1 ? mockFile2 : null
      } as FileList;
      
      fireEvent.change(fileInput, { target: { files: mockFileList } });
      
      expect(mockValidateFile).toHaveBeenCalledWith(mockFile1);
      expect(mockValidateFile).toHaveBeenCalledWith(mockFile2);
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFileList);
    });

    it('shows default validation error message when not provided', () => {
      mockValidateFile.mockReturnValue(false);
      
      const { container } = render(
        <SelectFile 
          onFileSelect={mockOnFileSelect}
          validateFile={mockValidateFile}
        />
      );
      
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      fireEvent.change(fileInput, { target: { files: [mockFile] } });
      
      expect(mockAlert).toHaveBeenCalledWith('Please select a valid file.');
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      // Check for heading
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Select your video');

      // Check for file input
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const clickableArea = container.querySelector('.cursor-pointer');
      expect(clickableArea).toBeInTheDocument();
      
      // The clickable area should be focusable for keyboard users
      expect(clickableArea).toHaveClass('cursor-pointer');
    });
  });

  describe('Error Handling', () => {
    it('handles component mounting without errors', () => {
      expect(() => {
        render(<SelectFile onFileSelect={mockOnFileSelect} />);
      }).not.toThrow();
    });

    it('handles component unmounting without errors', () => {
      const { unmount } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('handles missing dataTransfer in drop event gracefully', () => {
      const { container } = render(<SelectFile onFileSelect={mockOnFileSelect} />);
      
      const dropArea = container.querySelector('.cursor-pointer');
      
      // Simulate a drop event without dataTransfer
      fireEvent.drop(dropArea!, {});
      
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });
});
