'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import type { FC } from 'react';

export interface MenubarProps {
  className?: string;
}

const Menubar: FC<MenubarProps> = ({ className }) => {
  const [isFileMenuOpen, setFileMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  const handleSave = useCallback(() => {
    console.log('Save clicked');
    setFileMenuOpen(false);
  }, []);

  const handleReportIssue = useCallback(() => {
    window.open('https://github.com/inkylabs-dev/quickeditvideo/issues', '_blank');
    setFileMenuOpen(false);
  }, []);

  const handleUndo = useCallback(() => {
    console.log('Undo clicked');
  }, []);

  const handleRedo = useCallback(() => {
    console.log('Redo clicked');
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
        setFileMenuOpen(false);
      }
    };

    if (isFileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isFileMenuOpen]);

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      {/* File Menu */}
      <div className="relative" ref={fileMenuRef}>
        <button
          type="button"
          onClick={() => setFileMenuOpen(!isFileMenuOpen)}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition"
          aria-expanded={isFileMenuOpen}
          aria-haspopup="true"
        >
          File
        </button>

        {isFileMenuOpen && (
          <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="py-1">
              <button
                type="button"
                onClick={handleSave}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleReportIssue}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                Report Issue
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-gray-300" />

      {/* Undo Button */}
      <button
        type="button"
        onClick={handleUndo}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition group relative"
        aria-label="Undo"
        title="Undo (⌘Z)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
        </svg>
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Undo (⌘Z)
        </span>
      </button>

      {/* Redo Button */}
      <button
        type="button"
        onClick={handleRedo}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition group relative"
        aria-label="Redo"
        title="Redo (⇧⌘Z)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
        </svg>
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Redo (⇧⌘Z)
        </span>
      </button>
    </div>
  );
};

export default Menubar;
