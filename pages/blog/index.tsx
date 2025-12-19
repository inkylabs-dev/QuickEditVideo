'use client';

export const dynamic = 'force-static';

import type { NextPage } from 'next';
import Link from 'next/link';
import type { LayoutProps } from '../../src/components/Layout';
import { BLOG_POSTS } from '../../src/constants/blogPosts';

const BlogIndex: NextPage & { layoutProps?: LayoutProps } = () => {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="text-center space-y-3">
          <p className="text-sm uppercase tracking-wide text-teal-600">Stories</p>
          <h1 className="text-4xl font-bold text-gray-900">Notes from the QuickEditVideo team</h1>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Updates on privacy-first editing, MediaBunny-powered tools, and how we ship more accessible experiences
            without server uploads or heavy FFmpeg tooling.
          </p>
        </header>

        <div className="space-y-6">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-teal-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-400">{post.pubDate}</p>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    <Link href={`/blog/${post.slug}`} className="hover:text-teal-600">
                      {post.title}
                    </Link>
                  </h2>
                </div>
                <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-500">
                  {post.readingTime}
                </span>
              </div>
              <p className="mt-3 text-gray-600">{post.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs font-medium text-teal-600">
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
};

BlogIndex.layoutProps = {
  title: 'Blog - QuickEditVideo',
  description: 'Privacy-first video and voice tools built with MediaBunny. Read about new releases, tips, and announcements.',
  keywords: 'blog, quickeditvideo, video editing, text to speech, mediabunny',
  canonicalUrl: 'https://quickeditvideo.com/blog',
  currentPage: 'Blog',
  showBreadcrumbs: true,
};

export default BlogIndex;
