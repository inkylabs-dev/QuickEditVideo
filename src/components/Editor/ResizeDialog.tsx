'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { useVideoSize } from './useEditor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ResizePreset = 'landscape' | 'mobile' | 'square' | 'custom';

interface PresetOption {
  label: string;
  value: ResizePreset;
  dimensions: string;
  width?: number;
  height?: number;
}

const PRESET_OPTIONS: PresetOption[] = [
  { label: '16:9', value: 'landscape', dimensions: '1920×1080', width: 1920, height: 1080 },
  { label: '9:16', value: 'mobile', dimensions: '1080×1920', width: 1080, height: 1920 },
  { label: '1:1', value: 'square', dimensions: '1080×1080', width: 1080, height: 1080 },
  { label: 'Custom Size', value: 'custom', dimensions: '' },
];

export interface ResizeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ResizeDialog: FC<ResizeDialogProps> = ({ isOpen, onClose }) => {
  const { width, height, setWidth, setHeight } = useVideoSize();
  const [selectedPreset, setSelectedPreset] = useState<ResizePreset>('custom');
  const [customWidth, setCustomWidth] = useState(width.toString());
  const [customHeight, setCustomHeight] = useState(height.toString());

  const presetForCurrentSize = useMemo(() => {
    return PRESET_OPTIONS.find(
      (option) =>
        option.value !== 'custom' &&
        option.width === width &&
        option.height === height
    )?.value;
  }, [width, height]);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(presetForCurrentSize ?? 'custom');
      setCustomWidth(width.toString());
      setCustomHeight(height.toString());
    }
  }, [isOpen, width, height, presetForCurrentSize]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (selectedPreset === 'custom') {
      const nextWidth = parseInt(customWidth, 10);
      const nextHeight = parseInt(customHeight, 10);
      if (nextWidth > 0 && nextHeight > 0) {
        setWidth(nextWidth);
        setHeight(nextHeight);
      }
    } else {
      const option = PRESET_OPTIONS.find((entry) => entry.value === selectedPreset);
      if (option?.width && option?.height) {
        setWidth(option.width);
        setHeight(option.height);
      }
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Resize Video</DialogTitle>
          <DialogDescription>Choose a preset or define a custom size.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2">
          {PRESET_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 transition ${
                selectedPreset === option.value ? 'bg-emerald-50' : 'hover:bg-gray-50'
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
        </div>

        {selectedPreset === 'custom' && (
          <div className="mt-3 ml-7 rounded-lg bg-gray-50 p-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label
                  className="mb-1 block text-xs font-medium text-gray-700"
                  htmlFor="custom-width"
                >
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
                <label
                  className="mb-1 block text-xs font-medium text-gray-700"
                  htmlFor="custom-height"
                >
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

        <DialogFooter className="mt-6 flex w-full justify-end gap-3">
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResizeDialog;
