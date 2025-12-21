'use client';

import type { FC } from 'react';
import { MenubarItem } from '../ui/menubar';
import { useTracks } from './useTracks';

const OpenMenuItem: FC = () => {
  const { promptOpenFile } = useTracks();

  return (
    <MenubarItem inset onSelect={promptOpenFile} shortcut="⌘O">
      Open...
    </MenubarItem>
  );
};

export default OpenMenuItem;
