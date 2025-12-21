'use client';

import type { FC } from 'react';
import { MenubarItem } from '../ui/menubar';
import { useWebSaver } from './WebSaver';

const SaveMenuItem: FC = () => {
  const saveProject = useWebSaver();

  return (
    <MenubarItem inset onSelect={saveProject} shortcut="⌘S">
      Save
    </MenubarItem>
  );
};

export default SaveMenuItem;
