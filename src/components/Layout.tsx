'use client';

import { useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Adsterra from './Adsterra';
import Breadcrumbs, { type BreadcrumbItem } from './Breadcrumbs';

export interface LayoutProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
  showBreadcrumbs?: boolean;
  currentPage?: string;
  breadcrumbItems?: BreadcrumbItem[];
  blogPost?: boolean;
  skipLayout?: boolean;
}

const DEFAULT_TITLE = 'QuickEditVideo - Free Online Video Editor';
const DEFAULT_DESCRIPTION =
  'Edit videos online for free! Trim, convert, crop, merge, resize, extract audio, and add watermarks without uploads.';
const DEFAULT_KEYWORDS =
  'video editor, trim video, convert video, online video tools, free video editor, edit video without upload';
const DEFAULT_IMAGE = '/logo.png';
const DEFAULT_CANONICAL = 'https://quickeditvideo.com/';

const Layout = ({
  children,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  ogTitle = title,
  ogDescription = description,
  ogImage = DEFAULT_IMAGE,
  canonicalUrl = DEFAULT_CANONICAL,
  structuredData,
  showBreadcrumbs = false,
  currentPage,
  breadcrumbItems,
  blogPost = false,
}: LayoutProps & { children: React.ReactNode }) => {
  const currentUrl = canonicalUrl || DEFAULT_CANONICAL;
  const resolvedBreadcrumbItems = useMemo<BreadcrumbItem[] | undefined>(() => {
    if (breadcrumbItems && breadcrumbItems.length > 0) {
      return breadcrumbItems;
    }

    if (!showBreadcrumbs || !currentPage) {
      return undefined;
    }

    const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
    if (blogPost) {
      items.push({ label: 'Blog', href: '/blog' });
    }
    items.push({ label: currentPage, current: true });
    return items;
  }, [breadcrumbItems, blogPost, showBreadcrumbs, currentPage]);

  const shouldShowBreadcrumbs = Boolean(resolvedBreadcrumbItems?.length);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={currentUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImage} />
        <meta name="robots" content="index, follow" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png" />
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center justify-between h-16" aria-label="Main navigation">
              <Link href="/" className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <img src="/logo.png" alt="QuickEditVideo" className="h-8 w-auto" />
                QuickEditVideo
              </Link>

              <div className="hidden lg:flex gap-6 items-center">
                <Link href="/#all-tools" className="text-gray-700 hover:text-gray-900 font-medium">
                  Tools
                </Link>
                <Link href="/blog" className="text-gray-700 hover:text-gray-900 font-medium">
                  Blog
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="inline-flex items-center justify-center bg-green-100 rounded-full h-8 w-8">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11.5C14.8,12.4 14.4,13.2 13.7,13.7L17.25,17.25L16.17,18.33L12.67,14.83C12.45,14.94 12.23,15 12,15C10.6,15 9.2,13.4 9.2,11.5V10.5C9.2,8.6 10.6,7 12,7Z" />
                    </svg>
                  </span>
                  <span className="text-xs uppercase tracking-wide">Private</span>
                </div>
              </div>

              <div className="lg:hidden flex items-center gap-4">
                <Link href="/#all-tools" className="text-gray-700 hover:text-gray-900 font-medium">
                  Tools
                </Link>
                <Link href="/blog" className="text-gray-700 hover:text-gray-900 font-medium">
                  Blog
                </Link>
              </div>
          </nav>
        </div>

        </header>

        {shouldShowBreadcrumbs && resolvedBreadcrumbItems && (
          <Breadcrumbs items={resolvedBreadcrumbItems} />
        )}

        <main>{children}</main>

        <Adsterra />

        <footer className="bg-gray-900 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 xl:px-8 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">&copy; {new Date().getFullYear()} InkyLabs Inc.</span>
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="QuickEditVideo" className="h-6 w-auto" />
                  <span className="font-bold">QuickEditVideo</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-300">
                <Link href="/blog" className="hover:text-white">
                  Blog
                </Link>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
                <Link href="/privacy" className="hover:text-white">
                  Privacy
                </Link>
                <Link href="/tos" className="hover:text-white">
                  Terms
                </Link>
                <a
                  href="https://github.com/inkylabs-dev/QuickEditVideo"
                  className="hover:text-white"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Layout;
