'use client';

import type { NextPage } from 'next';
import { useRouter, type NextRouter } from 'next/router';
import Link from 'next/link';
import type { LayoutProps } from '../../src/components/Layout';
import { getBlogPostBySlug } from '../../src/constants/blogPosts';

const BlogPostPage: NextPage & {
  getDynamicLayoutProps?: (context: { router: NextRouter }) => LayoutProps | undefined;
} = () => {
  const router = useRouter();
  const rawSlug = router.query.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  if (!slug) {
    return (
      <main className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-gray-500">Loading post…</div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <p className="text-2xl font-semibold text-gray-900">Blog post not found</p>
          <p className="text-gray-600">The post you requested does not exist or has been removed.</p>
          <Link href="/blog" className="text-teal-600 hover:underline">
            Back to the blog index
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-gray-400">{post.pubDate}</p>
          <h1 className="text-4xl font-bold text-gray-900">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>{post.readingTime}</span>
            <span className="hidden sm:inline">•</span>
            <span>By {post.author}</span>
          </div>
          <p className="text-gray-600">{post.description}</p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-teal-600">
            {post.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </header>

        <article
          className="prose prose-lg max-w-none rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        <div className="text-sm text-gray-500">
          <Link href="/blog" className="text-teal-600 hover:underline">
            ← Back to the blog
          </Link>
        </div>
      </div>
    </main>
  );
};

BlogPostPage.getDynamicLayoutProps = ({ router }) => {
  const rawSlug = router.query.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
  if (!slug) return undefined;

  const post = getBlogPostBySlug(slug);
  if (!post) return undefined;

  return {
    title: `${post.title} | QuickEditVideo Blog`,
    description: post.description,
    keywords: `blog, quickeditvideo, ${post.tags.join(', ')}`,
    canonicalUrl: `https://quickeditvideo.com/blog/${post.slug}`,
    currentPage: post.title,
    showBreadcrumbs: true,
    blogPost: true,
  };
};

export default BlogPostPage;
