'use client';

import { useState } from 'react';

const PANEL_ITEMS = [
  { label: 'Materials', description: 'Clips, images, and assets' },
  { label: 'Effects', description: 'Transitions & overlays' },
  { label: 'Audio', description: 'Voiceovers / music' },
  { label: 'Export', description: 'Final render settings' },
];

const Editor = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const sidebarWidth = isSidebarOpen ? 'w-64 border border-gray-200 shadow' : 'w-0';

  const toggleSidebar = () => setSidebarOpen((open) => !open);

  const timelineTracks = [
    ['Intro', 'Scene 01', 'Scene 02', 'Outro'],
    ['Voice', 'Music', 'SFX'],
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      <aside
        className={`transition-all duration-200 ease-in-out bg-white ${sidebarWidth} overflow-hidden`}
        aria-label="Editor sidebar"
      >
        <div className="flex h-full flex-col p-6 space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold tracking-wide uppercase text-gray-500">Workspace</p>
            <button
              type="button"
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-900 focus:outline-none"
              aria-label="Toggle sidebar"
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
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
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
                aria-label="Open sidebar"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
            )}
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Project editor</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Live</span>
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-200/70 px-3 py-1 text-xs font-medium text-gray-700">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Remote render ready
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6">
          <section className="flex min-h-[320px] flex-1 flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Timeline</h3>
              <div className="text-xs text-gray-500">00:00 - 00:48</div>
            </div>

            <div className="space-y-3">
              {timelineTracks.map((track, index) => (
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
          </section>
        </main>
      </div>
    </div>
  );
};

export default Editor;
