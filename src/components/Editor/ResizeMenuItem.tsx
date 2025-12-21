'use client';

import { useCallback, useState } from 'react';
import type { FC } from 'react';
import ResizeDialog from './ResizeDialog';
import { useVideoSize } from './useVideoSize';
import type { VideoSizePreset } from './useVideoSize';

export interface ResizeMenuItemProps {
  onMenuItemClick?: () => void;
}

const ResizeMenuItem: FC<ResizeMenuItemProps> = ({ onMenuItemClick }) => {
  const [isResizeDialogOpen, setResizeDialogOpen] = useState(false);
  const { videoSize, setPreset, setCustomSize } = useVideoSize();

  const handleClick = useCallback(() => {
    onMenuItemClick?.();
    setResizeDialogOpen(true);
  }, [onMenuItemClick]);

  const handleResizeConfirm = useCallback(
    (preset: VideoSizePreset, customWidth?: number, customHeight?: number) => {
      if (preset === 'custom' && customWidth && customHeight) {
        setCustomSize(customWidth, customHeight);
        console.log('Video size set to custom:', customWidth, 'x', customHeight);
      } else {
        setPreset(preset);
        console.log('Video size preset set to:', preset);
      }
    },
    [setPreset, setCustomSize]
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
      >
        Resize
      </button>

      <ResizeDialog
        isOpen={isResizeDialogOpen}
        onClose={() => setResizeDialogOpen(false)}
        onResize={handleResizeConfirm}
        currentVideoSize={videoSize}
      />
    </>
  );
};

export default ResizeMenuItem;
