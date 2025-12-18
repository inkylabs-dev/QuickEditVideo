'use client';

import Link from 'next/link';
import { getCategories, getFeaturedTools } from '../constants/tools';

const HomeTools = () => {
  const featuredTools = getFeaturedTools();
  const categories = getCategories();

  return (
    <section className="pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Most used tools</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {featuredTools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.url}
              className="group p-6 bg-white rounded-lg border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all"
            >
              <div className={`w-12 h-12 ${tool.bgColor} rounded-lg flex items-center justify-center mb-4 ${tool.hoverBgColor} transition-colors`}>
                {tool.icon.type === 'svg' ? (
                  <svg
                    width="24"
                    height="24"
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
              <h3 className="font-semibold text-gray-900 mb-2">{tool.name}</h3>
              <p className="text-sm text-gray-600">{tool.description}</p>
            </Link>
          ))}
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center mt-12">All tools</h2>
        <div id="all-tools" className="pt-8 border-t border-gray-200">
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category.id}>
                <h3 className="text-lg font-medium text-gray-900 mb-4">{category.name}</h3>
                <div className={`grid gap-3 ${category.id === 'converters' ? 'grid-cols-3 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'}`}>
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.url}
                      className="p-3 text-center bg-white rounded-lg border border-gray-200 hover:border-teal-300 transition-colors text-sm text-gray-900"
                    >
                      {tool.shortName || tool.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeTools;
