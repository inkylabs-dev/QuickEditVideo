'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DownloadDropdown from './DownloadDropdown';

const DownloadButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleMenu = useCallback(() => {
    setIsOpen((open) => !open);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [isOpen, closeMenu]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-current"
        >
          <path d="M12 5v13m0 0l4-4m-4 4l-4-4" />
          <path d="M5 19h14" />
        </svg>
        Download
      </button>

      <DownloadDropdown isOpen={isOpen} onRequestClose={closeMenu} />
    </div>
  );
};

export default DownloadButton;
