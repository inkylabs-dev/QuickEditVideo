'use client';

import RecommendedTools from './RecommendedTools';

export type ToolSeoPoint = {
  title: string;
  description: string;
};

export type ToolSeoFaq = {
  question: string;
  answer: string;
};

export interface ToolSeoSectionContent {
  toolId: string;
  category: string;
  intro: {
    heading: string;
    paragraphs: string[];
  };
  howItWorks: {
    heading: string;
    items: ToolSeoPoint[];
  };
  whyChoose: {
    heading: string;
    items: ToolSeoPoint[];
  };
  faq: {
    heading: string;
    items: ToolSeoFaq[];
  };
}

interface ToolSeoSectionProps {
  content: ToolSeoSectionContent;
}

const ToolSeoSection = ({ content }: ToolSeoSectionProps) => (
  <section className="bg-gray-50 py-16 px-4 md:px-6">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-16">
          <article>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{content.intro.heading}</h2>
            <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
              {content.intro.paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </article>

          <section>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">{content.howItWorks.heading}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {content.howItWorks.items.map((item) => (
                <div key={item.title}>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">{item.title}</h4>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">{content.whyChoose.heading}</h3>
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {content.whyChoose.items.map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">{content.faq.heading}</h3>
            <div className="space-y-6">
              {content.faq.items.map((faq) => (
                <div key={faq.question} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 space-y-4">
            <RecommendedTools currentToolId={content.toolId} category={content.category} />
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-green-600">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10.5V11.5C14.8,12.4 14.4,13.2 13.7,13.7L17.25,17.25L16.17,18.33L12.67,14.83C12.45,14.94 12.23,15 12,15C10.6,15 9.2,13.4 9.2,11.5V10.5C9.2,8.6 10.6,7 12,7Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-green-800 mb-1">100% Private</h4>
                  <p className="text-xs text-green-700">All processing happens in your browser. Your files never leave your device.</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                    <path d="M12,2C13.1,2 14,2.9 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4C10,2.9 10.9,2 12,2M21,9V7L15,1V3H9V1L3,7V9H1V11H3V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V11H23V9H21Z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Always Free</h4>
                  <p className="text-xs text-blue-700">No signup, no limits, no watermarks. Use the tools forever without cost.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </section>
);

export default ToolSeoSection;
