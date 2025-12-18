'use client';

import type { NextPage } from 'next';
import type { LayoutProps } from '../src/components/Layout';
import HomeTools from '../src/components/HomeTools';

const HomePage: NextPage & { layoutProps?: LayoutProps } = () => {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="pt-16 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Free Online Video Editor - Cut, Trim & Convert Videos
            <br />
            <span className="text-teal-600">No Upload Required</span>
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
            Edit videos online without uploading! Cut video, trim MP4, merge videos, resize video, crop video,
            add watermark, convert to MP4/AVI/MOV/WebM. Privacy-first video editor that works in your browser.
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            ✓ Free video editor online ✓ No signup required ✓ Works on mobile & desktop ✓ Browser-based video
            editing ✓ Your files never leave your device
          </p>
        </div>
      </section>

      <HomeTools />
    </main>
  );
};

HomePage.layoutProps = {
  title: 'Free Online Video Editor - Cut, Trim, Convert MP4 Videos | QuickEditVideo',
  description:
    'Free online video editor with no upload required! Cut video, trim MP4, merge videos, resize video, crop video, add watermark, convert video online.',
  keywords:
    'video cutter, cut video, trim mp4, online video editor, merge videos, convert video, resize video, crop video, watermark video',
  ogTitle: 'Free Online Video Editor - No Upload Required | QuickEditVideo',
  ogDescription:
    'Edit videos online without uploading! Cut, trim, merge, resize, crop videos. Privacy-first, works on mobile & desktop.',
  canonicalUrl: 'https://quickeditvideo.com/',
};

export default HomePage;
