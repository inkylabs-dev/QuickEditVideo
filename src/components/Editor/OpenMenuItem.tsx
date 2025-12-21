'use client';

'use client';

import type { FC } from 'react';
import { MenubarItem } from '../ui/menubar';
import { FolderOpenIcon } from 'lucide-react';
import { useTracks } from './useEditor';

const OpenMenuItem: FC = () => {
  const { promptOpenFile } = useTracks();

  return (
    <MenubarItem inset onSelect={promptOpenFile} shortcut="⌘O">
      <FolderOpenIcon className="mr-2 h-4 w-4 text-slate-500" />
      Open...
    </MenubarItem>
  );
};

export default OpenMenuItem;
