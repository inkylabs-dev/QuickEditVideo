'use client';

import { useCallback, useState } from 'react';
import type { FC } from 'react';
import type { WebRendererQuality } from '@remotion/web-renderer';
import { renderRootComposition, ROOT_DURATION_IN_FRAMES } from './WebRender';

export interface DownloadDropdownProps {
  className?: string;
  isOpen?: boolean;
  onRequestClose?: () => void;
}

const QUALITY_OPTIONS = ['360p', '480p', '720p', '1080p'] as const;
const FILETYPE_OPTIONS = [
  { label: 'MP4 Video', value: 'mp4' },
  { label: 'WebM Video', value: 'webm' },
];

const QUALITY_MAP: Record<typeof QUALITY_OPTIONS[number], WebRendererQuality> = {
  '360p': 'very-low',
  '480p': 'low',
  '720p': 'medium',
  '1080p': 'high',
};

const DownloadDropdown: FC<DownloadDropdownProps> = ({ className, isOpen = true, onRequestClose }) => {
  const classes = [
    'absolute right-0 top-full z-10 mt-2 w-56 rounded-3xl border border-gray-200 bg-white p-4 shadow-xl',
    !isOpen && 'hidden',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const [qualityIndex, setQualityIndex] = useState(QUALITY_OPTIONS.length - 1);
  const [filetype, setFiletype] = useState(FILETYPE_OPTIONS[0].value);
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
      const container = filetype === 'webm' ? 'webm' : 'mp4';
      const result = await renderRootComposition({
        container,
        quality: QUALITY_MAP[qualityLabel],
        onProgress: (progress) => {
          const percent = Math.min(
            100,
            Math.round((progress.renderedFrames / ROOT_DURATION_IN_FRAMES) * 100),
          );
          setRenderProgress(percent);
        },
      });

      const blob = await result.getBlob();
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `quickeditvideo-${timestamp}.${filetype}`;
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
  }, [filetype, isRendering, onRequestClose, qualityLabel]);

  return (
    <div className={classes} aria-hidden={!isOpen}>
      <div className="space-y-3 text-sm">
        <div>
          <label className="text-[0.6rem] uppercase tracking-[0.3em] text-gray-500" htmlFor="download-filetype">
            Filetype
          </label>
          <select
            id="download-filetype"
            value={filetype}
            onChange={(event) => setFiletype(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            {FILETYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
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
        <button
          type="button"
          disabled={isRendering}
          className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-md disabled:cursor-not-allowed disabled:opacity-70"
          onClick={handleDownload}
        >
          {isRendering ? 'Rendering...' : 'Download'}
        </button>
        {isRendering && (
          <p className="text-[0.55rem] uppercase tracking-[0.4em] text-emerald-600">
            Rendering {renderProgress}%
          </p>
        )}
        {errorMessage && (
          <p className="text-[0.55rem] uppercase tracking-[0.4em] text-rose-500">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default DownloadDropdown;
