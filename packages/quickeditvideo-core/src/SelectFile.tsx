import { useRef } from 'preact/hooks';
import type { JSX } from 'preact';

export interface SelectFileProps {
  /** Whether to allow multiple file selection */
  multiple?: boolean;
  /** File input accept attribute (defaults to "video/*") */
  accept?: string;
  /** Title text (e.g., "Select your video" or "Select your videos") */
  title?: string;
  /** Description text below the title */
  description?: string;
  /** Button text (e.g., "Choose file" or "Choose files") */
  buttonText?: string;
  /** Support text shown below the button */
  supportText?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** File selection handler - receives single file for single mode, FileList for multiple */
  onFileSelect: (files: File | FileList | null) => void;
  /** Custom file validation function */
  validateFile?: (file: File) => boolean;
  /** Custom validation error message */
  validationErrorMessage?: string;
}

/**
 * Reusable file selection component with drag-and-drop support
 * Used across video editing components for consistent file upload UI
 */
export const SelectFile = ({
  multiple = false,
  accept = "video/*",
  title = "Select your video",
  description = "Drop a video file here or click to browse",
  buttonText = "Choose file",
  supportText = "Supports MP4, WebM, AVI, MOV and more",
  className = "",
  onFileSelect,
  validateFile,
  validationErrorMessage = "Please select a valid file."
}: SelectFileProps): JSX.Element => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    
    if (!files || files.length === 0) {
      onFileSelect(null);
      return;
    }

    // Validate files if validation function is provided
    if (validateFile) {
      for (let i = 0; i < files.length; i++) {
        if (!validateFile(files[i])) {
          alert(validationErrorMessage);
          return;
        }
      }
    }

    // Return single file for single mode, FileList for multiple mode
    if (multiple) {
      onFileSelect(files);
    } else {
      onFileSelect(files[0]);
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    
    if (!files || files.length === 0) {
      return;
    }

    // For single file mode, only take the first file
    if (!multiple && files.length > 1) {
      // Validate if validation function is provided
      if (validateFile && !validateFile(files[0])) {
        alert(validationErrorMessage);
        return;
      }
      
      onFileSelect(files[0]);
      return;
    }

    // Validate files if validation function is provided
    if (validateFile) {
      for (let i = 0; i < files.length; i++) {
        if (!validateFile(files[i])) {
          alert(validationErrorMessage);
          return;
        }
      }
    }

    // Return single file for single mode, FileList for multiple mode
    if (multiple) {
      onFileSelect(files);
    } else {
      onFileSelect(files[0]);
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`bg-white rounded-lg border-4 border-dashed border-gray-900 hover:border-gray-900 transition-colors ${className}`}>
      <div 
        className="p-16 text-center cursor-pointer"
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
      >
        <input 
          type="file" 
          accept={accept}
          multiple={multiple}
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileInputChange}
        />
        
        {/* File Icon */}
        <div className="mb-6">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-gray-400">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14,2 14,8 20,8"/>
            <path d="M10 15.5L16 12L10 8.5V15.5Z"/>
          </svg>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        
        {/* Description */}
        <p className="text-gray-600 mb-6">{description}</p>
        
        {/* Choose File Button */}
        <div className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 px-6 py-3 font-medium transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          {buttonText}
        </div>
        
        {/* Support Text */}
        <p className="text-xs text-gray-500 mt-4">{supportText}</p>
      </div>
    </div>
  );
};

export default SelectFile;