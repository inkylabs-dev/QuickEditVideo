import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

const videoEditingTools = [
  {
    href: "/trim",
    title: "Trimmer",
    description: "Cut videos",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
        <path d="M20 4L3 11l3 3l4-2l2 4Z"/>
      </svg>
    )
  },
  {
    href: "/merge",
    title: "Merger", 
    description: "Join videos",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
        <path d="M8 3L4 7L8 11M16 21L20 17L16 13M4 7H16M20 17H8"/>
      </svg>
    )
  },
  {
    href: "/resize",
    title: "Resizer",
    description: "Change size",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
        <path d="M8 3H5C3.89 3 3 3.89 3 5V8M21 8V5C21 3.89 20.11 3 19 3H16M16 21H19C20.11 21 21 20.11 21 19V16M3 16V19C3 20.11 3.89 21 5 21H8"/>
      </svg>
    )
  },
  {
    href: "/crop",
    title: "Cropper",
    description: "Remove edges",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
        <path d="M6 2v14a2 2 0 002 2h14M18 6H8a2 2 0 00-2 2v10"/>
      </svg>
    )
  },
  {
    href: "/watermark",
    title: "Watermark",
    description: "Add logos",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
      </svg>
    )
  },
  {
    href: "/extract-frame",
    title: "Frame Extractor",
    description: "Get images",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <path d="M8 12h8"/>
        <path d="M12 8v8"/>
      </svg>
    )
  }
];

const converterTools = [
  { href: "/to-mp4", title: "Convert to MP4", description: "Universal format" },
  { href: "/to-avi", title: "Convert to AVI", description: "Legacy format" },
  { href: "/to-mov", title: "Convert to MOV", description: "Apple format" },
  { href: "/to-webm", title: "Convert to WebM", description: "Web format" },
  { href: "/to-gif", title: "Convert to GIF", description: "Animation format" },
  { href: "/to-mkv", title: "Convert to MKV", description: "Open format" }
];

const audioQualityTools = [
  { href: "/extract-audio", title: "Extract Audio", description: "Get sound" },
  { href: "/compress", title: "Compress", description: "Reduce size" },
  { href: "/enhance", title: "Enhance", description: "Improve quality" },
  { href: "/volume", title: "Volume", description: "Adjust levels" }
];

interface ToolItemProps {
  href: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

function ToolItem({ href, title, description, icon }: ToolItemProps) {
  const handleClick = () => {
    window.location.href = href;
  };

  return (
    <a 
      href={href}
      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group cursor-pointer"
      onClick={handleClick}
    >
      {icon && (
        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
          {icon}
        </div>
      )}
      <div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </a>
  );
}

function SimpleToolItem({ href, title, description }: { href: string; title: string; description: string }) {
  const handleClick = () => {
    window.location.href = href;
  };

  return (
    <a 
      href={href}
      className="p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer block"
      onClick={handleClick}
    >
      <div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
    </a>
  );
}

export function NavToolsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="desktop-tools relative" ref={dropdownRef}>
      <button 
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Open video editing tools menu"
      >
        <span className="font-medium">Tools</span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="currentColor" 
          className={cn("transition-transform", isOpen && "rotate-180")}
          aria-hidden="true"
        >
          <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      <div 
        className={cn(
          "absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 transition-all duration-200 ease-out z-50",
          isOpen 
            ? "opacity-100 visible scale-100" 
            : "opacity-0 invisible scale-95"
        )}
        role="menu"
        aria-labelledby="tools-dropdown-trigger"
      >
        <div className="p-4">
          {/* Video Editing */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 px-2">Video Editing</h4>
            <div className="grid grid-cols-2 gap-1">
              {videoEditingTools.map((tool) => (
                <ToolItem key={tool.href} {...tool} />
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 my-4"></div>

          {/* Format Converters */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 px-2">Format Converters</h4>
            <div className="grid grid-cols-1 gap-1">
              {converterTools.map((tool) => (
                <SimpleToolItem key={tool.href} {...tool} />
              ))}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200 my-4"></div>

          {/* Audio & Quality */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 px-2">Audio & Quality</h4>
            <div className="grid grid-cols-1 gap-1">
              {audioQualityTools.map((tool) => (
                <SimpleToolItem key={tool.href} {...tool} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}