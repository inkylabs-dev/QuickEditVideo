'use client';

import { useMemo, useState } from 'react';
import type { FC } from 'react';

export interface DownloadDropdownProps {
  className?: string;
  onRequestClose?: () => void;
}

const QUALITY_OPTIONS = ['360p', '480p', '720p', '1080p'] as const;
const FILETYPE_OPTIONS = [
  { label: 'MP4 Video', value: 'mp4' },
  { label: 'WebM Video', value: 'webm' },
  { label: 'MOV Video', value: 'mov' },
  { label: 'MKV Video', value: 'mkv' },
];

const DownloadDropdown: FC<DownloadDropdownProps> = ({ className, onRequestClose }) => {
  const classes = ['absolute right-0 top-full z-10 mt-2 w-56 rounded-3xl border border-gray-200 bg-white p-4 shadow-xl', className]
    .filter(Boolean)
    .join(' ');

  const [qualityIndex, setQualityIndex] = useState(QUALITY_OPTIONS.length - 1);
  const [filetype, setFiletype] = useState(FILETYPE_OPTIONS[0].value);
  const qualityLabel = useMemo(() => QUALITY_OPTIONS[qualityIndex], [qualityIndex]);
  return (
    <div className={classes}>
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
          className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-md"
          onClick={onRequestClose}
        >
          Download
        </button>
      </div>
    </div>
  );
};

export default DownloadDropdown;
