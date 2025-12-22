'use client';

import { useMemo } from 'react';
import DownloadButton from './Editor/DownloadButton';
import EditorLayout from './Editor/Layout';
import Player from './Editor/Player';
import Menubar from './Editor/Menubar';
import Timeline from './Editor/Timeline';
import { EditorProvider } from './Editor/useEditor';

// force static
export const dynamic = 'force-static';

const PANEL_ITEMS = [
  { label: 'Materials', description: 'Clips, images, and assets' },
  { label: 'Effects', description: 'Transitions & overlays' },
  { label: 'Audio', description: 'Voiceovers / music' },
  { label: 'Export', description: 'Final render settings' },
];

const Editor = () => {
  const sidebar = useMemo(
    () => (
      <div className="flex h-full flex-col p-6 space-y-8">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold tracking-wide uppercase text-gray-500">Workspace</p>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto">
          {PANEL_ITEMS.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">{item.label}</h3>
              <p className="text-xs text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-gray-200 pt-4 text-xs text-gray-500">
          <p className="uppercase tracking-widest text-[0.6rem]">Status</p>
          <p className="text-sm text-gray-700">Ready to render</p>
        </div>
      </div>
    ),
    [],
  );

  const playerPanel = <Player />;

  return (
    <EditorProvider>
      <EditorLayout
        sidebar={sidebar}
        topPanel={playerPanel}
        bottomPanel={<Timeline />}
        navLeft={<Menubar />}
        navRight={<DownloadButton />}
      />
    </EditorProvider>
  );
};

export default Editor;
