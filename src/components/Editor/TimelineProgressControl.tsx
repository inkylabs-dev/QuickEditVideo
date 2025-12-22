import { useState, useEffect, useCallback } from 'react';
import { SkipBack, Play, Pause, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerRef } from './useEditor';
import { FPS, formatTime } from './timeUtils';

const TimelineProgressControl = () => {
  const { getPlayerRef, getTotalFrames } = usePlayerRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [totalTime, setTotalTime] = useState('00:00');

  useEffect(() => {
    const player = getPlayerRef();
    if (!player) return;

    const updateTime = () => {
      const currentFrame = player.getCurrentFrame();
      const currentSeconds = currentFrame / FPS;
      setCurrentTime(formatTime(currentSeconds));

      const playing = player.isPlaying();
      setIsPlaying(playing);
    };

    const interval = setInterval(updateTime, 50);
    return () => clearInterval(interval);
  }, [getPlayerRef]);

  useEffect(() => {
    const totalFrames = getTotalFrames();
    const totalSeconds = totalFrames / FPS;
    setTotalTime(formatTime(totalSeconds));
  }, [getTotalFrames]);

  const handlePlayPause = useCallback(() => {
    const player = getPlayerRef();
    if (!player) return;
    player.toggle();
    setIsPlaying(player.isPlaying());
  }, [getPlayerRef]);

  const handleSkipBack = useCallback(() => {
    const player = getPlayerRef();
    if (!player) return;
    player.seekTo(0);
  }, [getPlayerRef]);

  const handleSkipForward = useCallback(() => {
    const player = getPlayerRef();
    if (!player) return;
    const totalFrames = getTotalFrames();
    player.seekTo(totalFrames - 1);
  }, [getPlayerRef, getTotalFrames]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 min-w-[3rem] text-right">{currentTime}</span>
      <Button variant="ghost" size="icon" onClick={handleSkipBack}>
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={handlePlayPause}>
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={handleSkipForward}>
        <SkipForward className="h-4 w-4" />
      </Button>
      <span className="text-xs text-gray-500 min-w-[3rem]">{totalTime}</span>
    </div>
  );
};

export default TimelineProgressControl;
