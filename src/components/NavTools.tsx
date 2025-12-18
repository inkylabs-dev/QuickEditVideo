"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getCategories } from '../constants/tools';

const NavTools = () => {
  const categories = useRef(getCategories());
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <span className="font-medium">Tools</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`transition-transform ${open ? 'rotate-180' : 'rotate-0'}`}
        >
          <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
        </svg>
      </button>

      <div
        ref={menuRef}
        className={`absolute left-0 top-full mt-2 w-[600px] bg-white rounded-xl shadow-xl border border-gray-200 opacity-0 invisible transform scale-95 transition-all duration-200 ease-out ${
          open ? 'opacity-100 visible scale-100' : ''
        }`}
      >
        <div className="p-4">
          {categories.current.map((category) => (
            <div key={category.id} className={category.id !== 'audio-quality' ? 'mb-6' : ''}>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 px-2">{category.name}</h4>
              <div className="grid gap-1 grid-cols-3">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.id}
                    href={tool.url}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group text-sm text-gray-900"
                  >
                    <div className={`w-8 h-8 ${tool.bgColor} rounded-lg flex items-center justify-center ${tool.hoverBgColor} transition-colors`}>
                      {tool.icon.type === 'svg' ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={tool.iconColor}
                          dangerouslySetInnerHTML={{ __html: tool.icon.content }}
                        />
                      ) : (
                        <span className={`${tool.icon.className || ''} ${tool.iconColor}`}>{tool.icon.content}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tool.shortName || tool.name}</div>
                      <div className="text-xs text-gray-500">{tool.shortDescription}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NavTools;
