'use client';

import { useCallback, useState } from 'react';
import type { FC } from 'react';
import type { WebRendererQuality } from '@remotion/web-renderer';
import { renderRootComposition } from './WebRender';
import { getRootCompositionDurationInFrames } from './compositions/tracks';
import { useVideoSize } from './useVideoSize';
import { useTracks } from './useTracks';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export interface DownloadDropdownProps {
  className?: string;
  onRequestClose?: () => void;
}

const QUALITY_OPTIONS = ['360p', '480p', '720p', '1080p'] as const;
const QUALITY_MAP: Record<typeof QUALITY_OPTIONS[number], WebRendererQuality> = {
  '360p': 'very-low',
  '480p': 'low',
  '720p': 'medium',
  '1080p': 'high',
};

const DownloadDropdown: FC<DownloadDropdownProps> = ({ className, onRequestClose }) => {
  const { width, height } = useVideoSize();
  const { tracks } = useTracks();

  const [qualityIndex, setQualityIndex] = useState(QUALITY_OPTIONS.length - 1);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const qualityLabel = QUALITY_OPTIONS[qualityIndex];

  const handleDownload = useCallback(async () => {
    if (isRendering) {
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);
    setErrorMessage(null);

    try {
      const container = 'mp4';
      const compositionTracks = tracks;
      const durationInFrames = getRootCompositionDurationInFrames(compositionTracks);

      const result = await renderRootComposition({
        container,
        quality: QUALITY_MAP[qualityLabel],
        tracks: compositionTracks,
        videoSize: { width, height },
        onProgress: (progress) => {
          const percent = Math.min(
            100,
            Math.round((progress.renderedFrames / durationInFrames) * 100),
          );
          setRenderProgress(percent);
        },
      });

      const blob = await result.getBlob();
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `quickeditvideo-${timestamp}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setRenderProgress(100);
      URL.revokeObjectURL(url);
      onRequestClose?.();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : 'Rendering failed');
    } finally {
      setIsRendering(false);
    }
  }, [height, isRendering, onRequestClose, qualityLabel, tracks, width]);

  return (
    <div className={cn('space-y-3 text-sm', className)}>
      <div>
        <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gray-500 flex justify-between">
          <span>Quality</span>
          <span className="text-xs text-gray-400 tracking-[0.4em]">{qualityLabel}</span>
        </p>
        <input
          type="range"
          min="0"
          max={QUALITY_OPTIONS.length - 1}
          step="1"
          value={qualityIndex}
          onChange={(event) => setQualityIndex(Number(event.target.value))}
          className="mt-1 h-1 w-full appearance-none rounded-full bg-gray-200 focus:outline-none"
        />
        <div className="mt-1 flex justify-between text-[0.55rem] uppercase tracking-[0.4em] text-gray-400">
          {QUALITY_OPTIONS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
      <Button
        type="button"
        disabled={isRendering}
        className="w-full rounded-full"
        onClick={handleDownload}
      >
        {isRendering ? 'Rendering...' : 'Download'}
      </Button>
      {isRendering && (
        <div className="space-y-1">
          <p className="text-[0.55rem] uppercase tracking-[0.4em] text-emerald-600">
            {renderProgress}%
          </p>
          <Progress value={renderProgress} className="h-1" />
        </div>
      )}
      {errorMessage && (
        <p className="text-[0.55rem] uppercase tracking-[0.4em] text-rose-500">{errorMessage}</p>
      )}
    </div>
  );
};

export default DownloadDropdown;
