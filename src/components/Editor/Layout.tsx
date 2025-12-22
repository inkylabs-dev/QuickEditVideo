'use client';

import type { GroupImperativeHandle, Layout } from 'react-resizable-panels';
import { useCallback, useMemo, useState } from 'react';
import type { ReactNode, Ref } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useGroupRef } from 'react-resizable-panels';

export const LEFT_PANEL_ID = 'editor-sidebar';
export const MAIN_PANEL_ID = 'editor-main';

const DEFAULT_LEFT_SIZE = 30;
const DEFAULT_MAIN_SIZE = 70;

export interface EditorLayoutProps {
  sidebar: ReactNode;
  topPanel: ReactNode;
  bottomPanel: ReactNode;
  navLeft?: ReactNode;
  navRight?: ReactNode;
}

const DEFAULT_LAYOUT: Layout = {
  [LEFT_PANEL_ID]: DEFAULT_LEFT_SIZE,
  [MAIN_PANEL_ID]: DEFAULT_MAIN_SIZE,
};

const EditorLayout = ({ sidebar, topPanel, bottomPanel, navLeft, navRight }: EditorLayoutProps) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const groupRef = useGroupRef();

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
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex flex-1"
        groupRef={groupRef as Ref<GroupImperativeHandle>}
        defaultLayout={DEFAULT_LAYOUT}
        onLayoutChange={handleLayoutChange}
      >
        <ResizablePanel
          id={LEFT_PANEL_ID}
          collapsible
          collapsedSize="0%"
          defaultSize="16rem"
          maxSize="30%"
          minSize="3rem"
          className={`transition-all duration-200 ease-in-out bg-white overflow-hidden ${
            isSidebarOpen ? 'border border-gray-200 shadow' : 'border-none'
          }`}
        >
          {sidebar}
        </ResizablePanel>

        <ResizableHandle
          className="w-1 cursor-col-resize bg-gradient-to-b from-transparent via-gray-300 to-transparent"
          aria-label="Resize sidebar"
        />

        <ResizablePanel id={MAIN_PANEL_ID} className="flex-1 min-h-screen">
          <div className="flex h-full flex-col">
            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-2 py-2">
              <div className="flex items-center gap-3">
                {toggleButton}
                {navLeft ?? null}
              </div>
              <div className="flex items-center gap-4">{navRight ?? null}</div>
            </header>

            <main className="flex flex-1 min-h-0 flex-col gap-6">
              <ResizablePanelGroup orientation="vertical" className="flex min-h-0 flex-1">
                <ResizablePanel className="flex flex-1 min-h-[240px] flex-col">
                  {topPanel}
                </ResizablePanel>

                <ResizableHandle
                  className="h-1 cursor-row-resize bg-gradient-to-r from-transparent via-gray-300 to-transparent"
                  aria-label="Resize editor panels"
                />

                <ResizablePanel className="flex flex-1 min-h-[180px] flex-col">
                  {bottomPanel}
                </ResizablePanel>
              </ResizablePanelGroup>
            </main>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default EditorLayout;
