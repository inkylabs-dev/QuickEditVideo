'use client';

import type { FC } from 'react';
import { MenubarItem } from '../ui/menubar';
import { RotateCcwIcon } from 'lucide-react';

export interface ResetMenuItemProps {
  onSelect: () => void;
}

const ResetMenuItem: FC<ResetMenuItemProps> = ({ onSelect }) => (
  <MenubarItem inset onSelect={onSelect}>
    <RotateCcwIcon className="mr-2 h-4 w-4 text-slate-500" />
    Reset
  </MenubarItem>
);

export default ResetMenuItem;
