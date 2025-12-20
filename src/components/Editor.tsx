'use client';

import { useCallback, useMemo, useState } from 'react';
import { useGroupRef, type Layout as PanelLayout } from 'react-resizable-panels';
import EditorLayout, { LEFT_PANEL_ID, MAIN_PANEL_ID } from './Editor/Layout';

const PANEL_ITEMS = [
  { label: 'Materials', description: 'Clips, images, and assets' },
  { label: 'Effects', description: 'Transitions & overlays' },
  { label: 'Audio', description: 'Voiceovers / music' },
  { label: 'Export', description: 'Final render settings' },
];

const TIMELINE_TRACKS = [
  ['Intro', 'Scene 01', 'Scene 02', 'Outro'],
  ['Voice', 'Music', 'SFX'],
];

const Editor = () => {
  const groupRef = useGroupRef();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleLayoutChange = useCallback((layout: PanelLayout) => {
    const currentSize = layout[LEFT_PANEL_ID] ?? 0;
    setSidebarOpen(currentSize > 0);
  }, []);

  const collapseSidebar = useCallback(() => {
    groupRef.current?.setLayout({
      [LEFT_PANEL_ID]: 0,
      [MAIN_PANEL_ID]: 100,
    });
    setSidebarOpen(false);
  }, [groupRef]);

  const expandSidebar = useCallback(() => {
    const defaultWidth = 20;
    groupRef.current?.setLayout({
      [LEFT_PANEL_ID]: defaultWidth,
      [MAIN_PANEL_ID]: 100 - defaultWidth,
    });
    setSidebarOpen(true);
  }, [groupRef]);

  const toggleSidebar = useCallback(() => {
    if (isSidebarOpen) {
      collapseSidebar();
    } else {
      expandSidebar();
    }
  }, [collapseSidebar, expandSidebar, isSidebarOpen]);

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

  const playerPanel = useMemo(
    () => (
      <>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Remotion Player</h2>
          <span className="text-xs uppercase tracking-wide text-gray-500">Preview</span>
        </div>
        <div className="flex-1 rounded-2xl border border-dashed border-gray-200 bg-gradient-to-br from-white to-gray-100 p-6">
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600">
              Remotion player placeholder
            </div>
            <p className="text-center text-xs uppercase tracking-[0.3em] text-gray-400">Rendered frame</p>
          </div>
        </div>
      </>
    ),
    [],
  );

  const timelinePanel = useMemo(
    () => (
      <>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Timeline</h3>
          <div className="text-xs text-gray-500">00:00 - 00:48</div>
        </div>

        <div className="space-y-3 overflow-hidden">
          {TIMELINE_TRACKS.map((track, index) => (
            <div key={`track-${index}`} className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                {index === 0 ? 'Video tracks' : 'Audio tracks'}
              </div>
              <div className="flex gap-3">
                {track.map((segment) => (
                  <div
                    key={segment}
                    className="flex-1 rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-100 p-3 text-xs font-semibold text-gray-700 shadow-sm"
                  >
                    {segment}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    ),
    [],
  );

  return (
    <EditorLayout
      groupRef={groupRef}
      sidebar={sidebar}
      topPanel={playerPanel}
      bottomPanel={timelinePanel}
      isSidebarOpen={isSidebarOpen}
      onLayoutChange={handleLayoutChange}
      onToggleSidebar={toggleSidebar}
    />
  );
};

export default Editor;
