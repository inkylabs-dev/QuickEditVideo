'use client';

import { useState } from 'react';
import DownloadDropdown from './DownloadDropdown';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const DownloadButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          variant="ghost"
          className="flex items-center gap-1"
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
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={4}
        className="w-56 border border-gray-200 bg-white p-4 shadow-xl"
      >
        <DownloadDropdown onRequestClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default DownloadButton;
