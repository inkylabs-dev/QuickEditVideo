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
  recommendedTools?: string[]; // List of tool IDs that are most relevant to this tool
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
    name: 'Trim Video',
    shortName: 'Trim Video',
    description: 'Cut video and trim MP4 with precision',
    shortDescription: 'Cut videos',
    url: '/trim/',
    icon: {
      type: 'svg',
      content: '<path d="M20 4L3 11l3 3l4-2l2 4Z"/>'
    },
    category: 'video-editing',
    featured: true,
    recommendedTools: ['merge', 'crop', 'resize', 'extract-frame', 'change-speed'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'merge',
    name: 'Merge Videos',
    shortName: 'Merge Videos',
    description: 'Merge videos and combine video files',
    shortDescription: 'Join videos',
    url: '/merge/',
    icon: {
      type: 'svg',
      content: '<path d="M8 3L4 7L8 11M16 21L20 17L16 13M4 7H16M20 17H8"/>'
    },
    category: 'video-editing',
    featured: true,
    recommendedTools: ['trim', 'resize', 'to-mp4', 'crop', 'extract-audio'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'resize',
    name: 'Resize Video',
    shortName: 'Resize Video',
    description: 'Resize video and change video size',
    shortDescription: 'Change size',
    url: '/resize/',
    icon: {
      type: 'svg',
      content: '<path d="M8 3H5C3.89 3 3 3.89 3 5V8M21 8V5C21 3.89 20.11 3 19 3H16M16 21H19C20.11 21 21 20.11 21 19V16M3 16V19C3 20.11 3.89 21 5 21H8"/>'
    },
    category: 'video-editing',
    featured: true,
    recommendedTools: ['crop', 'trim', 'to-mp4', 'merge', 'flip'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'crop',
    name: 'Crop Video',
    shortName: 'Crop Video',
    description: 'Crop video and cut video frame',
    shortDescription: 'Crop area',
    url: '/crop/',
    icon: {
      type: 'svg',
      content: '<path d="M6 2V6H2V8H6V18C6 19.1 6.9 20 8 20H18V24H20V20H24V18H20V8C20 6.9 19.1 6 18 6H8V2H6Z"/>'
    },
    category: 'video-editing',
    featured: true,
    recommendedTools: ['resize', 'trim', 'extract-frame', 'watermark', 'flip'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'watermark',
    name: 'Add Watermark',
    shortName: 'Add Watermark',
    description: 'Add watermark video and put logo on video',
    shortDescription: 'Add logos',
    url: '/watermark/',
    icon: {
      type: 'svg',
      content: '<path d="M21 16V8C21 5.79 19.21 4 17 4H7C4.79 4 3 5.79 3 8V16C3 18.21 4.79 20 7 20H17C19.21 20 21 18.21 21 16ZM7 6H17C18.1 6 19 6.9 19 8V16C19 17.1 18.1 18 17 18H7C5.9 18 5 17.1 5 16V8C5 6.9 5.9 6 7 6ZM16 10.5C16 9.12 14.88 8 13.5 8S11 9.12 11 10.5 12.12 13 13.5 13 16 11.88 16 10.5ZM9 16L10.5 14L12 15.5L15.5 11L18 16H9Z"/>'
    },
    category: 'video-editing',
    recommendedTools: ['crop', 'resize', 'extract-frame', 'to-mp4', 'merge'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'extract-frame',
    name: 'Extract Frames',
    shortName: 'Extract Frames',
    description: 'Extract video frame and capture still from video',
    shortDescription: 'Extract frames',
    url: '/extract-frame/',
    icon: {
      type: 'svg',
      content: '<path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4ZM20 18V6H4V18H20ZM6 15L8 12.5L10 15L13 11L18 18H6Z"/>'
    },
    category: 'video-editing',
    recommendedTools: ['tts', 'watermark', 'crop', 'trim', 'info'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'info',
    name: 'Video Info',
    shortName: 'Video Info',
    description: 'Analyze video metadata and get video information',
    shortDescription: 'Get video info',
    url: '/info/',
    icon: {
      type: 'svg',
      content: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M12 6h.01"/>'
    },
    category: 'video-editing',
    recommendedTools: ['extract-frame', 'extract-audio', 'trim', 'resize', 'to-mp4'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'flip',
    name: 'Flip Video',
    shortName: 'Flip Video',
    description: 'Flip video and mirror video online',
    shortDescription: 'Flip video',
    url: '/flip/',
    icon: {
      type: 'svg',
      content: '<path d="M8 3H5C3.89 3 3 3.89 3 5V8M21 8V5C21 3.89 20.11 3 19 3H16"/><path d="M16 21H19C20.11 21 21 20.11 21 19V16M3 16V19C3 20.11 3.89 21 5 21H8"/><path d="M9 12L15 12M12 9L12 15"/>'
    },
    category: 'video-editing',
    recommendedTools: ['resize', 'crop', 'trim', 'watermark', 'merge'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'change-speed',
    name: 'Change Video Speed',
    shortName: 'Change Speed',
    description: 'Change video speed, speed up video or slow motion',
    shortDescription: 'Change speed',
    url: '/speed/',
    icon: {
      type: 'svg',
      content: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>'
    },
    category: 'video-editing',
    recommendedTools: ['trim', 'merge', 'extract-audio', 'to-mp4', 'resize'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'confetti-effect',
    name: 'Confetti Effect',
    shortName: 'Confetti Effect',
    description: 'Add confetti overlay animation to video',
    shortDescription: 'Add confetti',
    url: '/confetti-effect',
    icon: {
      type: 'svg',
      content: '<path d="M12 2L13.09 8.26L20 7L14.74 11.74L21 12L14.74 12.26L20 17L13.09 15.74L12 22L10.91 15.74L4 17L9.26 12.26L3 12L9.26 11.74L4 7L10.91 8.26L12 2Z"/>'
    },
    category: 'video-editing',
    bgColor: 'bg-purple-100',
    hoverBgColor: 'group-hover:bg-purple-200',
    iconColor: 'text-purple-600'
  },

  // Format Converters
  {
    id: 'to-mp4',
    name: 'Convert to MP4',
    shortName: 'MP4',
    description: 'Convert to MP4, AVI to MP4 online',
    shortDescription: 'Convert to MP4',
    url: '/to-mp4/',
    icon: {
      type: 'text',
      content: 'MP4',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    featured: true,
    recommendedTools: ['trim', 'merge', 'resize', 'extract-audio', 'to-gif'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'hover:bg-teal-200',
    iconColor: 'text-teal-700'
  },
  {
    id: 'to-avi',
    name: 'Convert to AVI',
    shortName: 'AVI',
    description: 'Convert videos to AVI format',
    shortDescription: 'Convert to AVI',
    url: '/to-avi/',
    icon: {
      type: 'text',
      content: 'AVI',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    recommendedTools: ['to-mp4', 'to-mov', 'to-mkv', 'trim', 'resize'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'hover:bg-teal-200',
    iconColor: 'text-teal-700'
  },
  {
    id: 'to-mov',
    name: 'Convert to MOV',
    shortName: 'MOV',
    description: 'Convert videos to MOV format',
    shortDescription: 'Convert to MOV',
    url: '/to-mov/',
    icon: {
      type: 'text',
      content: 'MOV',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    recommendedTools: ['to-mp4', 'to-avi', 'to-mkv', 'trim', 'merge'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'hover:bg-teal-200',
    iconColor: 'text-teal-700'
  },
  {
    id: 'to-webm',
    name: 'Convert to WebM',
    shortName: 'WebM',
    description: 'Convert videos to WebM format',
    shortDescription: 'Convert to WebM',
    url: '/to-webm/',
    icon: {
      type: 'text',
      content: 'WEB',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    recommendedTools: ['to-mp4', 'to-gif', 'trim', 'resize', 'change-speed'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'hover:bg-teal-200',
    iconColor: 'text-teal-700'
  },
  {
    id: 'to-gif',
    name: 'Convert to GIF',
    shortName: 'GIF',
    description: 'Video to GIF, MP4 to GIF online',
    shortDescription: 'Convert to GIF',
    url: '/to-gif/',
    icon: {
      type: 'text',
      content: 'GIF',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    recommendedTools: ['trim', 'resize', 'crop', 'to-mp4', 'change-speed'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'hover:bg-teal-200',
    iconColor: 'text-teal-700'
  },
  {
    id: 'to-mkv',
    name: 'Convert to MKV',
    shortName: 'MKV',
    description: 'Convert videos to MKV format',
    shortDescription: 'Convert to MKV',
    url: '/to-mkv/',
    icon: {
      type: 'text',
      content: 'MKV',
      className: 'text-xs font-bold'
    },
    category: 'converters',
    recommendedTools: ['to-mp4', 'to-avi', 'to-mov', 'extract-audio', 'merge'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'hover:bg-teal-200',
    iconColor: 'text-teal-700'
  },

  // Audio & Quality Tools
  {
    id: 'extract-audio',
    name: 'Extract Audio',
    shortName: 'Extract Audio',
    description: 'Video to MP3 and extract audio from video',
    shortDescription: 'Get audio',
    url: '/extract-audio/',
    icon: {
      type: 'svg',
      content: '<path d="M9 18V5L12.5 8.5L16 5V18L12.5 14.5L9 18Z"/><path d="M20 4L16 8L20 12"/>'
    },
    category: 'audio-quality',
    recommendedTools: ['tts', 'trim', 'merge', 'to-mp4', 'change-speed'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'tts',
    name: 'Text to Speech',
    shortName: 'Text to Speech',
    description: 'Convert text to high-quality speech using AI voice synthesis',
    shortDescription: 'Text to speech',
    url: '/tts/',
    icon: {
      type: 'svg',
      content: '<path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.824L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.824a1 1 0 011.617.824zM14 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd"/><path d="M16.5 6A1.5 1.5 0 0118 7.5v5a1.5 1.5 0 11-3 0v-5A1.5 1.5 0 0116.5 6z"/>'
    },
    category: 'audio-quality',
    featured: true,
    recommendedTools: ['srt-tts', 'extract-audio', 'merge', 'extract-frame', 'watermark'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
  },
  {
    id: 'srt-tts',
    name: 'SRT to Text-to-Speech',
    shortName: 'SRT to Speech',
    description: 'Convert SRT subtitle files to audio with AI voices and precise timing',
    shortDescription: 'SRT to speech',
    url: '/srt-tts/',
    icon: {
      type: 'svg',
      content: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/><path d="M8 13h8M8 17h6"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>'
    },
    category: 'audio-quality',
    recommendedTools: ['tts', 'extract-audio', 'merge', 'trim', 'to-mp4'],
    bgColor: 'bg-teal-100',
    hoverBgColor: 'group-hover:bg-teal-200',
    iconColor: 'text-teal-600'
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