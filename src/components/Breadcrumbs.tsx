'use client';

import Link from 'next/link';

export type BreadcrumbItem = {
  label: string;
  href?: string;
  current?: boolean;
};

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  if (!items.length) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-100 py-3" aria-label="Breadcrumb">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <ol className="flex items-center space-x-2 text-sm">
          {items.map((item, index) => {
            const isCurrent = Boolean(item.current ?? index === items.length - 1);
            const renderAsLink = Boolean(item.href) && !isCurrent;

            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                {renderAsLink ? (
                  <Link href={item.href!} className="text-gray-500 hover:text-gray-700">
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isCurrent ? 'text-gray-900 font-medium' : 'text-gray-500'}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                )}

                {index < items.length - 1 && (
                  <span className="text-gray-400" aria-hidden="true">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
