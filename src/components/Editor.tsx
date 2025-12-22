'use client';

import DownloadButton from './Editor/DownloadButton';
import EditorLayout from './Editor/Layout';
import Player from './Editor/Player';
import Menubar from './Editor/Menubar';
import Timeline from './Editor/Timeline';
import Sidebar from './Editor/Sidebar';
import { EditorProvider } from './Editor/useEditor';

// force static
export const dynamic = 'force-static';

const Editor = () => {
  return (
    <EditorProvider>
      <EditorLayout
        sidebar={<Sidebar />}
        topPanel={<Player />}
        bottomPanel={<Timeline />}
        navLeft={<Menubar />}
        navRight={<DownloadButton />}
      />
    </EditorProvider>
  );
};

export default Editor;
