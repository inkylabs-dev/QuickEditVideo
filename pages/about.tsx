'use client';

export const dynamic = 'force-static';

import type { NextPage } from 'next';
import type { LayoutProps } from '../src/components/Layout';

const AboutPage: NextPage & { layoutProps?: LayoutProps } = () => (
  <main className="min-h-screen bg-gray-50 py-16 px-4">
    <div className="max-w-4xl mx-auto space-y-10">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">About QuickEditVideo</h1>
        <p className="text-gray-600">
          QuickEditVideo is a privacy-first suite of browser-native video and voice tools powered by MediaBunny, Remotion and
          other lightweight WebAssembly helpers. We believe editing should be instant, secure, and available to anyone,
          without installs, uploads, or complex subscriptions.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Our Mission</h2>
        <p className="text-gray-600">
          Modern editing workflows still rely on bulky native apps or cloud uploads with questionable privacy. We built
          QuickEditVideo to cut through that friction—every tool runs in your browser, every file stays on your device,
          and every experience is optimized for fast, trusted editing.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">What We Build</h2>
        <ul className="space-y-2 text-gray-600">
          <li>• Video trimming, merging, resizing, and cropping tools that feel immediate and safe.</li>
          <li>• Text-to-speech and subtitle-to-speech workflows powered by KittenTTS for expressive voices.</li>
          <li>• Informational pages, blog posts, and guides that explain how privacy-first editing works.</li>
          <li>• Foundation for future features—batch edits, advanced audio controls, and accessibility improvements.</li>
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-900">Community & Feedback</h2>
        <p className="text-gray-600">
          We operate quietly—but we still listen. If you spot a bug, have a tool request, or want to share how you're
          using QuickEditVideo, drop us a line via the <a href="https://github.com/inkylabs-dev/quickeditvideo">GitHub repo</a> or the contact method listed in the footer.
        </p>
        <p className="text-gray-600">
          Contributions to tooling, docs, and testing are always welcome. The repo ships under a permissive license so
          others can build on the same privacy-first foundation.
        </p>
      </section>
    </div>
  </main>
);

AboutPage.layoutProps = {
  title: 'About QuickEditVideo',
  description:
    'Learn how QuickEditVideo builds privacy-first web tools for video editing and AI voice generation using MediaBunny.',
  keywords: 'about, quickeditvideo, mediabunny, privacy-first, video tools',
  canonicalUrl: 'https://quickeditvideo.com/about',
  currentPage: 'About',
  showBreadcrumbs: true,
};

export default AboutPage;
