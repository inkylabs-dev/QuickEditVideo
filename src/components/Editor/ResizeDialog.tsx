'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { FC } from 'react';
import type { VideoSizePreset, VideoSize } from './useVideoSize';

export interface ResizeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResize: (preset: VideoSizePreset, customWidth?: number, customHeight?: number) => void;
  currentVideoSize: VideoSize;
}

const PRESET_OPTIONS = [
  { label: '9:16', value: 'landscape' as const, dimensions: '1920×1080' },
  { label: '16:9', value: 'mobile' as const, dimensions: '1080×1920' },
  { label: '1:1', value: 'square' as const, dimensions: '1080×1080' },
  { label: 'Custom Size', value: 'custom' as const, dimensions: '' },
];

const ResizeDialog: FC<ResizeDialogProps> = ({ isOpen, onClose, onResize, currentVideoSize }) => {
  const [selectedPreset, setSelectedPreset] = useState<VideoSizePreset>(currentVideoSize.preset);
  const [customWidth, setCustomWidth] = useState(currentVideoSize.width.toString());
  const [customHeight, setCustomHeight] = useState(currentVideoSize.height.toString());

  // Initialize state from current video size when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(currentVideoSize.preset);
      setCustomWidth(currentVideoSize.width.toString());
      setCustomHeight(currentVideoSize.height.toString());
    }
  }, [isOpen, currentVideoSize]);

  const handleConfirm = () => {
    if (selectedPreset === 'custom') {
      const width = parseInt(customWidth, 10);
      const height = parseInt(customHeight, 10);
      if (width > 0 && height > 0) {
        onResize('custom', width, height);
      }
    } else {
      onResize(selectedPreset);
    }
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  console.log('ResizeDialog rendering, isOpen:', isOpen);

  const dialog = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        style={{ zIndex: 9998 }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
        <div
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Resize Video</h2>

          <div className="space-y-2">
            {PRESET_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 transition ${
                  selectedPreset === option.value
                    ? 'bg-emerald-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="videoSize"
                  value={option.value}
                  checked={selectedPreset === option.value}
                  onChange={() => setSelectedPreset(option.value)}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{option.label}</p>
                  {option.dimensions && (
                    <p className="text-xs text-gray-500">{option.dimensions}</p>
                  )}
                </div>
              </label>
            ))}

            {selectedPreset === 'custom' && (
              <div className="ml-7 rounded-lg bg-gray-50 p-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-700" htmlFor="custom-width">
                      Width (px)
                    </label>
                    <input
                      id="custom-width"
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      min="1"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-gray-700" htmlFor="custom-height">
                      Height (px)
                    </label>
                    <input
                      id="custom-height"
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:from-emerald-600 hover:to-emerald-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(dialog, document.body);
};

export default ResizeDialog;
