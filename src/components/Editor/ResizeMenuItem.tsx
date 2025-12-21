'use client';

import { useCallback, useState } from 'react';
import type { FC } from 'react';
import ResizeDialog from './ResizeDialog';
import { useVideoSize } from './useVideoSize';
import type { VideoSizePreset } from './useVideoSize';
import { MenubarItem } from '../ui/menubar';

const ResizeMenuItem: FC = () => {
  const [isResizeDialogOpen, setResizeDialogOpen] = useState(false);
  const { videoSize, setPreset, setCustomSize } = useVideoSize();

  console.log('ResizeMenuItem render, isResizeDialogOpen:', isResizeDialogOpen);

  const handleClick = useCallback(() => {
    console.log('Resize clicked, opening dialog');
    setResizeDialogOpen(true);
  }, []);

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
      <MenubarItem inset onSelect={handleClick}>
        Resize
      </MenubarItem>

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
