import { useElements, usePlayerRef } from './useEditor';
import { formatFrameTime } from './timeUtils';
import { useEffect, useState } from 'react';

const TimelineRuler = () => {
  const { appState } = useElements();
  const { getTotalFrames, getPlayerRef } = usePlayerRef();
  const scale = (appState.timelineScale as number) || 100;
  const totalFrames = getTotalFrames();
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    setViewportWidth(window.innerWidth);

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate the width based on scale (scale 100 = 1px per frame)
  const pixelsPerFrame = scale / 100;
  const totalWidth = Math.max(totalFrames * pixelsPerFrame, viewportWidth);

  // Target ~8 labeled markers across the visible width
  const targetLabelCount = 8;
  const maxFrame = Math.ceil(totalWidth / pixelsPerFrame);
  const labelInterval = Math.ceil(maxFrame / targetLabelCount);

  // Round to nearest 30 frames (1 second at 30fps) for cleaner intervals
  const roundedLabelInterval = Math.max(30, Math.ceil(labelInterval / 30) * 30);

  const labels: number[] = [];

  for (let frame = 0; frame <= maxFrame; frame += roundedLabelInterval) {
    labels.push(frame);
  }

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const frame = Math.floor(clickX / pixelsPerFrame);

    const player = getPlayerRef();
    if (player && frame >= 0 && frame <= totalFrames) {
      player.seekTo(frame);
    }
  };

  const handleLabelClick = (frame: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const player = getPlayerRef();
    if (player) {
      player.seekTo(frame);
    }
  };

  return (
    <div
      className="relative h-8 border-b border-gray-200 cursor-pointer"
      style={{ width: `${totalWidth}px` }}
      onClick={handleRulerClick}
    >
      {labels.map((frame) => {
        const position = frame * pixelsPerFrame;

        return (
          <div
            key={frame}
            className="absolute top-1 cursor-pointer"
            style={{ left: `${position}px` }}
            onClick={(e) => handleLabelClick(frame, e)}
          >
            <span className="text-[10px] text-gray-600 hover:text-gray-900">
              {formatFrameTime(frame)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineRuler;
