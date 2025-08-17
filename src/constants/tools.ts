// tools.ts - Centralized tool definitions and metadata
// This file provides a single source of truth for all video editing tools

export interface ToolIcon {
  type: 'svg' | 'text';
  content: string;
  className?: string;
}

export interface Tool {
  id: string;
  name: string;
  shortName?: string; // For grid displays
  description: string;
  shortDescription?: string; // For nav dropdowns
  url: string;
  icon: ToolIcon;
  category: string;
  featured?: boolean; // For homepage featured tools
  bgColor: string;
  hoverBgColor: string;
  iconColor: string;
}

export interface ToolCategory {
  id: string;
  name: string;
  tools: Tool[];
}

// Tool definitions
const TOOLS: Tool[] = [
  // Video Editing Tools
  {
    id: 'trim',
    name: 'Video Trimmer',
    shortName: 'Trimmer',
    description: 'Cut videos with frame precision',
    shortDescription: 'Cut videos',
    url: '/trim',
    icon: {
      type: 'svg',
      content: '<path d="M20 4L3 11l3 3l4-2l2 4Z"/>'
    },
    category: 'video-editing',
    featured: true,
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'merge',
    name: 'Video Merger',
    shortName: 'Merger',
    description: 'Combine multiple videos into one',
    shortDescription: 'Join videos',
    url: '/merge',
    icon: {
      type: 'svg',
      content: '<path d="M8 3L4 7L8 11M16 21L20 17L16 13M4 7H16M20 17H8"/>'
    },
    category: 'video-editing',
    featured: true,
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'resize',
    name: 'Video Resizer',
    shortName: 'Resizer',
    description: 'Change video dimensions and resolution',
    shortDescription: 'Change size',
    url: '/resize',
    icon: {
      type: 'svg',
      content: '<path d="M8 3H5C3.89 3 3 3.89 3 5V8M21 8V5C21 3.89 20.11 3 19 3H16M16 21H19C20.11 21 21 20.11 21 19V16M3 16V19C3 20.11 3.89 21 5 21H8"/>'
    },
    category: 'video-editing',
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'crop',
    name: 'Video Cropper',
    shortName: 'Cropper',
    description: 'Crop and trim video frames',
    shortDescription: 'Crop area',
    url: '/crop',
    icon: {
      type: 'svg',
      content: '<path d="M6 2V6H2V8H6V18C6 19.1 6.9 20 8 20H18V24H20V20H24V18H20V8C20 6.9 19.1 6 18 6H8V2H6Z"/>'
    },
    category: 'video-editing',
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'watermark',
    name: 'Video Watermark',
    shortName: 'Watermark',
    description: 'Add logos and watermarks to videos',
    shortDescription: 'Add logos',
    url: '/watermark',
    icon: {
      type: 'svg',
      content: '<path d="M15 3H6A2 2 0 0 0 4 4V16A2 2 0 0 0 6 18H15A2 2 0 0 0 17 16V4A2 2 0 0 0 15 3ZM8 16L6 14L11 9L13 11L17 7L19 9V14A2 2 0 0 1 17 16H8Z"/>'
    },
    category: 'video-editing',
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'extract-frame',
    name: 'Frame Extractor',
    shortName: 'Frame Extractor',
    description: 'Extract individual frames from videos',
    shortDescription: 'Extract frames',
    url: '/extract-frame',
    icon: {
      type: 'svg',
      content: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M8 12h8"/><path d="M12 8v8"/>'
    },
    category: 'video-editing',
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'flip',
    name: 'Video Flipper',
    shortName: 'Flipper',
    description: 'Flip videos horizontally or vertically',
    shortDescription: 'Flip video',
    url: '/flip',
    icon: {
      type: 'svg',
      content: '<path d="M8 3H5C3.89 3 3 3.89 3 5V8M21 8V5C21 3.89 20.11 3 19 3H16"/><path d="M16 21H19C20.11 21 21 20.11 21 19V16M3 16V19C3 20.11 3.89 21 5 21H8"/><path d="M9 12L15 12M12 9L12 15"/>'
    },
    category: 'video-editing',
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },

  // Format Converters
  {
    id: 'to-mp4',
    name: 'Convert to MP4',
    shortName: 'MP4',
    description: 'Universal format converter',
    shortDescription: 'MP4',
    url: '/to-mp4',
    icon: {
      type: 'text',
      content: 'MP4',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    featured: true,
    bgColor: 'bg-orange-100',
    hoverBgColor: 'hover:bg-orange-200',
    iconColor: 'text-orange-700'
  },
  {
    id: 'to-avi',
    name: 'Convert to AVI',
    shortName: 'AVI',
    description: 'Convert videos to AVI format',
    shortDescription: 'AVI',
    url: '/to-avi',
    icon: {
      type: 'text',
      content: 'AVI',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    bgColor: 'bg-orange-100',
    hoverBgColor: 'hover:bg-orange-200',
    iconColor: 'text-orange-700'
  },
  {
    id: 'to-mov',
    name: 'Convert to MOV',
    shortName: 'MOV',
    description: 'Convert videos to MOV format',
    shortDescription: 'MOV',
    url: '/to-mov',
    icon: {
      type: 'text',
      content: 'MOV',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    bgColor: 'bg-orange-100',
    hoverBgColor: 'hover:bg-orange-200',
    iconColor: 'text-orange-700'
  },
  {
    id: 'to-webm',
    name: 'Convert to WebM',
    shortName: 'WebM',
    description: 'Convert videos to WebM format',
    shortDescription: 'WebM',
    url: '/to-webm',
    icon: {
      type: 'text',
      content: 'WEB',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    bgColor: 'bg-orange-100',
    hoverBgColor: 'hover:bg-orange-200',
    iconColor: 'text-orange-700'
  },
  {
    id: 'to-gif',
    name: 'Convert to GIF',
    shortName: 'GIF',
    description: 'Convert videos to animated GIF',
    shortDescription: 'GIF',
    url: '/to-gif',
    icon: {
      type: 'text',
      content: 'GIF',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    bgColor: 'bg-orange-100',
    hoverBgColor: 'hover:bg-orange-200',
    iconColor: 'text-orange-700'
  },
  {
    id: 'to-mkv',
    name: 'Convert to MKV',
    shortName: 'MKV',
    description: 'Convert videos to MKV format',
    shortDescription: 'MKV',
    url: '/to-mkv',
    icon: {
      type: 'text',
      content: 'MKV',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    bgColor: 'bg-orange-100',
    hoverBgColor: 'hover:bg-orange-200',
    iconColor: 'text-orange-700'
  },

  // Audio & Quality Tools
  {
    id: 'extract-audio',
    name: 'Extract Audio',
    shortName: 'Extract Audio',
    description: 'Extract audio track from videos',
    shortDescription: 'Get audio',
    url: '/extract-audio',
    icon: {
      type: 'svg',
      content: '<path d="M9 18V5L12.5 8.5L16 5V18L12.5 14.5L9 18Z"/><path d="M20 4L16 8L20 12"/>'
    },
    category: 'audio-quality',
    bgColor: 'bg-orange-100',
    hoverBgColor: 'group-hover:bg-orange-200',
    iconColor: 'text-orange-600'
  },
  {
    id: 'compress',
    name: 'Video Compressor',
    shortName: 'Compress',
    description: 'Reduce video file size',
    shortDescription: 'Reduce size',
    url: '/compress',
    icon: {
      type: 'svg',
      content: '<path d="M21 8V5C21 3.89 20.11 3 19 3H5C3.89 3 3 3.89 3 5V8M3 16V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V16"/><line x1="7" y1="7" x2="7" y2="17"/><line x1="17" y1="7" x2="17" y2="17"/>'
    },
    category: 'audio-quality',
    bgColor: 'bg-orange-100',
    hoverBgColor: 'group-hover:bg-orange-200',
    iconColor: 'text-orange-600'
  },
  {
    id: 'enhance',
    name: 'Video Enhancer',
    shortName: 'Enhance',
    description: 'Improve video quality and appearance',
    shortDescription: 'Enhance quality',
    url: '/enhance',
    icon: {
      type: 'svg',
      content: '<path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.27L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>'
    },
    category: 'audio-quality',
    bgColor: 'bg-orange-100',
    hoverBgColor: 'group-hover:bg-orange-200',
    iconColor: 'text-orange-600'
  },
  {
    id: 'volume',
    name: 'Volume Control',
    shortName: 'Volume',
    description: 'Adjust video audio volume',
    shortDescription: 'Adjust volume',
    url: '/volume',
    icon: {
      type: 'svg',
      content: '<path d="M11 5L6 9H2V15H6L11 19V5Z"/><path d="M19.07 4.93A10 10 0 0 1 19.07 19.07"/><path d="M15.54 8.46A5 5 0 0 1 15.54 15.54"/>'
    },
    category: 'audio-quality',
    bgColor: 'bg-orange-100',
    hoverBgColor: 'group-hover:bg-orange-200',
    iconColor: 'text-orange-600'
  }
];

// Category definitions
const CATEGORIES: ToolCategory[] = [
  {
    id: 'video-editing',
    name: 'Video Editing',
    tools: TOOLS.filter(tool => tool.category === 'video-editing')
  },
  {
    id: 'converters',
    name: 'Format Converters',
    tools: TOOLS.filter(tool => tool.category === 'converters')
  },
  {
    id: 'audio-quality',
    name: 'Audio & Quality',
    tools: TOOLS.filter(tool => tool.category === 'audio-quality')
  }
];

// Helper functions
export function getAllTools(): Tool[] {
  return TOOLS;
}

export function getFeaturedTools(): Tool[] {
  return TOOLS.filter(tool => tool.featured);
}

export function getToolsByCategory(categoryId: string): Tool[] {
  return TOOLS.filter(tool => tool.category === categoryId);
}

export function getCategories(): ToolCategory[] {
  return CATEGORIES;
}

export function getToolById(id: string): Tool | undefined {
  return TOOLS.find(tool => tool.id === id);
}

// Export tools and categories for direct access
export { TOOLS, CATEGORIES };