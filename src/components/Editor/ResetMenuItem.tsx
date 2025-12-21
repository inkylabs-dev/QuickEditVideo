'use client';

import type { FC } from 'react';
import { MenubarItem } from '../ui/menubar';

export interface ResetMenuItemProps {
  onSelect: () => void;
}

const ResetMenuItem: FC<ResetMenuItemProps> = ({ onSelect }) => (
  <MenubarItem inset onSelect={onSelect}>
    Reset
  </MenubarItem>
);

export default ResetMenuItem;
