'use client';

import type { Layout, GroupImperativeHandle } from 'react-resizable-panels';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useCallback, useMemo, useState } from 'react';
import type { ReactNode, Ref } from 'react';

export const LEFT_PANEL_ID = 'editor-sidebar';
export const MAIN_PANEL_ID = 'editor-main';

const DEFAULT_LEFT_SIZE = 20;
const DEFAULT_MAIN_SIZE = 80;

export interface EditorLayoutProps {
  sidebar: ReactNode;
  topPanel: ReactNode;
  bottomPanel: ReactNode;
  navRight?: ReactNode;
  groupRef?: Ref<GroupImperativeHandle | null>;
}

const DEFAULT_LAYOUT: Layout = {
  [LEFT_PANEL_ID]: DEFAULT_LEFT_SIZE,
  [MAIN_PANEL_ID]: DEFAULT_MAIN_SIZE,
};

const EditorLayout = ({ sidebar, topPanel, bottomPanel, navRight, groupRef }: EditorLayoutProps) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const collapseSidebar = useCallback(() => {
    groupRef?.current?.setLayout({
      [LEFT_PANEL_ID]: 0,
      [MAIN_PANEL_ID]: 100,
    });
    setSidebarOpen(false);
  }, [groupRef]);

  const expandSidebar = useCallback(() => {
    groupRef?.current?.setLayout({
      [LEFT_PANEL_ID]: DEFAULT_LEFT_SIZE,
      [MAIN_PANEL_ID]: 100 - DEFAULT_LEFT_SIZE,
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

  const handleLayoutChange = useCallback((layout: Layout) => {
    const currentSize = layout[LEFT_PANEL_ID] ?? 0;
    setSidebarOpen(currentSize > 0);
  }, []);

  const toggleButton = useMemo(
    () => (
      <button
        type="button"
        onClick={toggleSidebar}
        className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
        aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-panel-left size-4"
        >
          <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          <path d="M9 3v18"></path>
        </svg>
      </button>
    ),
    [isSidebarOpen, toggleSidebar],
  );

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <Group
        orientation="horizontal"
        className="flex flex-1"
        groupRef={groupRef}
        defaultLayout={DEFAULT_LAYOUT}
        onLayoutChange={handleLayoutChange}
      >
        <Panel
          id={LEFT_PANEL_ID}
          collapsible
          collapsedSize="0%"
          defaultSize="16rem"
          maxSize="25%"
          minSize="14rem"
          className={`transition-all duration-200 ease-in-out bg-white overflow-hidden ${
            isSidebarOpen ? 'border border-gray-200 shadow' : 'border-none'
          }`}
        >
          {sidebar}
        </Panel>

        <Separator
          className="w-1 cursor-col-resize bg-gradient-to-b from-transparent via-gray-300 to-transparent"
          aria-label="Resize sidebar"
        />

        <Panel id={MAIN_PANEL_ID} className="flex-1 min-h-screen">
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center gap-3">
                {toggleButton}
                <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Project editor</p>
              </div>
              <div className="flex items-center gap-4">{navRight ?? null}</div>
            </header>

            <main className="flex flex-1 min-h-0 flex-col gap-6">
              <Group orientation="vertical" className="flex min-h-0 flex-1">
                <Panel className="flex flex-1 min-h-[240px] flex-col">
                  {topPanel}
                </Panel>

                <Separator
                  className="h-1 cursor-row-resize bg-gradient-to-r from-transparent via-gray-300 to-transparent"
                  aria-label="Resize editor panels"
                />

                <Panel className="flex flex-1 min-h-[180px] flex-col">
                  {bottomPanel}
                </Panel>
              </Group>
            </main>
          </div>
        </Panel>
      </Group>
    </div>
  );
};

export default EditorLayout;
