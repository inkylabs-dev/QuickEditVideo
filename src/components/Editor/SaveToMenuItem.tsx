'use client';

import type { FC } from 'react';
import { MenubarItem } from '../ui/menubar';
import { SaveIcon } from 'lucide-react';
import { useWebSaver } from './WebSaver';

const SaveToMenuItem: FC = () => {
  const saveProject = useWebSaver();

  return (
    <MenubarItem inset onSelect={saveProject} shortcut="⌘S">
      <SaveIcon className="mr-2 h-4 w-4 text-slate-500" />
      Save to...
    </MenubarItem>
  );
};

export default SaveToMenuItem;
