'use client';

import type { NextPage } from 'next';
import type { LayoutProps } from '../src/components/Layout';

const PrivacyPage: NextPage & { layoutProps?: LayoutProps } = () => (
  <main className="min-h-screen bg-gray-50 py-16 px-4">
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-gray-600">
          QuickEditVideo keeps every editing session private. We do not store, analyze, or transmit your videos, subtitles,
          or prompts to any server.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Local Processing</h2>
        <p className="text-gray-600">
          All processing happens in your browser via advanced browser-based media processing technologies. Your files
          never leave your device unless you explicitly download or share them.
        </p>
        <p className="text-gray-600">
          Because everything runs client-side, we never have access to your video or audio data. The site does not
          upload, cache, or retain your assets after the tab closes.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">No Tracking</h2>
        <p className="text-gray-600">
          We do not drop tracking cookies or fingerprint users. The only analytics scripts on the site are lightweight
          and respect Do Not Track headers. You can use the tools without creating an account or signing in.
        </p>
        <p className="text-gray-600">
          If you choose to consent to third-party ads, those providers may collect aggregated data separately. The core
          editing experience remains entirely local.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Open Source & Responsible</h2>
        <p className="text-gray-600">
          The code powering QuickEditVideo is open source. You can review the implementation, audits, or run a local
          copy to verify that nothing is leaking upstream.
        </p>
        <p className="text-gray-600">
          If you notice anything that seems off or want to request a privacy update, open an issue in the GitHub repo
          and the team will respond quickly.
        </p>
      </section>
    </div>
  </main>
);

PrivacyPage.layoutProps = {
  title: 'Privacy Policy | QuickEditVideo',
  description: 'QuickEditVideo keeps your edits on device. No uploads, no tracking, and no server-side processing.',
  keywords: 'privacy, quickeditvideo, data policy, client-only',
  canonicalUrl: 'https://quickeditvideo.com/privacy',
  currentPage: 'Privacy',
  showBreadcrumbs: true,
};

export default PrivacyPage;
