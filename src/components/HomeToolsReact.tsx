import { ToolCard } from "./ToolCard"

const popularTools = [
  {
    href: "/trim",
    title: "Video Trimmer",
    description: "Cut videos with frame precision",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 4L3 11l3 3l4-2l2 4Z"/>
      </svg>
    )
  },
  {
    href: "/merge", 
    title: "Video Merger",
    description: "Combine multiple videos into one",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 3h5v5M4 20L20.2 3.8M21 16v5h-5M15 15l6 6M4 4l5 5"/>
      </svg>
    )
  },
  {
    href: "/to-mp4",
    title: "Convert to MP4", 
    description: "Universal format converter",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 22h14a2 2 0 002-2V7.5L14.5 2H6a2 2 0 00-2 2v4"/>
        <polyline points="14,2 14,8 20,8"/>
        <path d="M2 13v-1h6v1"/>
        <path d="M5 12v6"/>
        <path d="M4 18h2"/>
      </svg>
    )
  }
];

const editingTools = [
  { href: "/trim", title: "Trimmer" },
  { href: "/merge", title: "Merger" },
  { href: "/resize", title: "Resizer" },
  { href: "/crop", title: "Cropper" },
  { href: "/watermark", title: "Watermark" },
  { href: "/extract-frame", title: "Frame Extractor" }
];

const converterTools = [
  { href: "/to-mp4", title: "MP4" },
  { href: "/to-avi", title: "AVI" },
  { href: "/to-mov", title: "MOV" },
  { href: "/to-webm", title: "WebM" },
  { href: "/to-gif", title: "GIF" },
  { href: "/to-mkv", title: "MKV" }
];

const audioTools = [
  { href: "/extract-audio", title: "Extract Audio" },
  { href: "/compress", title: "Compress" },
  { href: "/enhance", title: "Enhance" },
  { href: "/volume", title: "Volume" }
];

function SimpleToolLink({ href, title }: { href: string; title: string }) {
  const handleClick = () => {
    window.location.href = href;
  };

  return (
    <a 
      href={href}
      className="p-3 text-center bg-white rounded-lg border border-gray-200 hover:border-teal-300 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="text-sm font-medium text-gray-900">{title}</div>
    </a>
  );
}

export function HomeToolsReact() {
  return (
    <section className="pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Most used tools</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {popularTools.map((tool) => (
            <ToolCard key={tool.href} {...tool} />
          ))}
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">All tools</h2>
        
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Video Editing</h3>
              <div className="grid grid-cols-3 md:grid-cols-2 gap-3">
                {editingTools.map((tool) => (
                  <SimpleToolLink key={tool.href} {...tool} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Format Converters</h3>
              <div className="grid grid-cols-3 md:grid-cols-2 gap-3">
                {converterTools.map((tool) => (
                  <SimpleToolLink key={tool.href} {...tool} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Audio & Quality</h3>
              <div className="grid grid-cols-3 md:grid-cols-2 gap-3">
                {audioTools.map((tool) => (
                  <SimpleToolLink key={tool.href} {...tool} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}