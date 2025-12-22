import { useState, useEffect, useCallback, useRef } from 'react';
import { Signpost } from 'lucide-react';
import { useElements, usePlayerRef } from './useEditor';

const TimelinePlayhead = () => {
  const { appState } = useElements();
  const { getPlayerRef, getTotalFrames } = usePlayerRef();
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const playheadRef = useRef<HTMLDivElement>(null);

  const scale = (appState.timelineScale as number) || 100;
  const pixelsPerFrame = scale / 100;

  useEffect(() => {
    const player = getPlayerRef();
    if (!player) return;

    const updateFrame = () => {
      const frame = player.getCurrentFrame();
      setCurrentFrame(frame);
    };

    const interval = setInterval(updateFrame, 50);
    return () => clearInterval(interval);
  }, [getPlayerRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const scrollArea = playheadRef.current?.closest('[data-radix-scroll-area-viewport]');
      if (!scrollArea) return;

      const rect = scrollArea.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + scrollArea.scrollLeft;
      const frame = Math.floor(mouseX / pixelsPerFrame);

      const totalFrames = getTotalFrames();
      const clampedFrame = Math.max(0, Math.min(frame, totalFrames));

      const player = getPlayerRef();
      if (player) {
        player.seekTo(clampedFrame);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, pixelsPerFrame, getPlayerRef, getTotalFrames]);

  const position = currentFrame * pixelsPerFrame;

  return (
    <div
      ref={playheadRef}
      className="absolute top-0 z-10 cursor-ew-resize"
      style={{ left: `${position}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex flex-col items-center">
        <Signpost className="h-4 w-4 text-black fill-black" />
        <div className="h-2" />
        <div className="w-0.5 bg-black" style={{ height: 'calc(100vh - 200px)' }} />
      </div>
    </div>
  );
};

export default TimelinePlayhead;
