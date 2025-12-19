'use client';

export const dynamic = 'force-static';

import type { NextPage } from 'next';
import type { LayoutProps } from '../src/components/Layout';

const TermsPage: NextPage & { layoutProps?: LayoutProps } = () => (
  <main className="min-h-screen bg-gray-50 py-16 px-4">
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-gray-600">
          By using QuickEditVideo you agree to the following simple, privacy-friendly terms. The service is free and
          provided as-is for individual use.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Usage</h2>
        <p className="text-gray-600">
          You can trim, crop, merge, convert, or enhance videos and subtitles strictly for your own purposes. QuickEditVideo
          prohibits using the tools for unlawful, infringing, or abusive content. Commercial use is allowed if you respect
          copyright and respect any privacy obligations for the media you edit.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">No Warranty</h2>
        <p className="text-gray-600">
          The project is open source, and we do our best to keep it stable, but there is no warranty. We are not responsible
          for any damage or data loss that may occur during editing.
        </p>
        <p className="text-gray-600">
          Always keep backups of your original files and preview exports before sharing them widely.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Content Policy</h2>
        <p className="text-gray-600">
          You retain full ownership of the videos, subtitles, and text you upload. We only process it locally in your browser.
          Please do not use the tools to infringe upon other creators, stalk someone, or otherwise violate the law.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Changes</h2>
        <p className="text-gray-600">
          These terms may be updated occasionally. Continued use of the site after an update constitutes acceptance of the
          new terms. We strive to highlight significant changes on this page.
        </p>
      </section>
    </div>
  </main>
);

TermsPage.layoutProps = {
  title: 'Terms of Service | QuickEditVideo',
  description: 'Review the usage guidelines and responsibilities for QuickEditVideo’s client-only editing tools.',
  keywords: 'terms, quickeditvideo, usage policy, privacy-first terms',
  canonicalUrl: 'https://quickeditvideo.com/tos',
  currentPage: 'Terms',
  showBreadcrumbs: true,
};

export default TermsPage;
