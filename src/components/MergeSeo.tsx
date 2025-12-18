'use client';

import type { ToolSeoSectionContent } from './ToolSeoSection';
import ToolSeoSection from './ToolSeoSection';

const content: ToolSeoSectionContent = {
  "toolId": "merge",
  "category": "video-editing",
  "intro": {
    "heading": "Merge Videos Online - Fast & Easy",
    "paragraphs": [
      "Need to combine multiple video clips into one seamless file? Whether you are merging presentation segments, combining footage from different sources, or creating a longer video from shorter clips, complex video editing software often feels like overkill.",
      "Our video merger lets you upload multiple files, arrange them in any order, set custom durations, and download a single merged video. No complicated timelines, no steep learning curves. Your videos are processed entirely in your browser, keeping your content private and secure.",
      "Drag, drop, arrange, and merge. It is that simple. Because combining videos should not require a degree in video editing."
    ]
  },
  "howItWorks": {
    "heading": "How to Merge Videos Online",
    "items": [
      {
        "title": "Multi-File Upload",
        "description": "Upload multiple video files at once or add them one by one. Supports MP4, WebM, MOV, and MKV."
      },
      {
        "title": "Drag & Drop Ordering",
        "description": "Easily reorder your clips by dragging and dropping. See your changes in real-time with instant visual feedback."
      },
      {
        "title": "Custom Duration Control",
        "description": "Set custom durations for each clip. Videos longer than the set duration will loop seamlessly to fill the time."
      },
      {
        "title": "Seamless Preview",
        "description": "Preview your merged video before processing. Watch clips play sequentially to ensure perfect timing and order."
      }
    ]
  },
  "whyChoose": {
    "heading": "Why Merge Videos With Our Tool?",
    "items": [
      {
        "title": "Completely Free",
        "description": "No watermarks, no time limits, no hidden costs."
      },
      {
        "title": "Privacy First",
        "description": "All processing happens locally. Your videos never leave your device."
      },
      {
        "title": "Smart Resizing",
        "description": "Automatically resizes all videos to match the first one or set global dimensions."
      },
      {
        "title": "Universal Compatibility",
        "description": "Works with all major video formats and on any modern device."
      },
      {
        "title": "No Installation",
        "description": "Works instantly in your browser. No software to download or install."
      },
      {
        "title": "Flexible Duration",
        "description": "Set any duration for each clip with automatic looping when needed."
      }
    ]
  },
  "faq": {
    "heading": "Frequently Asked Questions",
    "items": [
      {
        "question": "How many videos can I merge at once?",
        "answer": "There is no hard limit on the number of videos you can merge. The only constraint is your device's available memory and processing power."
      },
      {
        "question": "What happens if my videos have different resolutions?",
        "answer": "By default, all videos are resized to match the dimensions of the first video you upload. You can also set custom global dimensions if needed."
      },
      {
        "question": "Can I loop shorter videos to match longer ones?",
        "answer": "Yes! Set a custom duration for any clip, and if it is shorter than the duration you specify, it will loop seamlessly to fill the time."
      },
      {
        "question": "Is the tool free to use?",
        "answer": "Absolutely! Our video merger is completely free with no watermarks, time limits, or hidden costs. Use it as much as you need."
      },
      {
        "question": "Are my videos private and secure?",
        "answer": "Yes, completely. All video processing happens locally in your browser using WebAssembly. Your videos never get uploaded to our servers."
      },
      {
        "question": "What video formats are supported?",
        "answer": "We support MP4, WebM, MOV, and MKV. If your browser can play it, chances are we can merge it."
      },
      {
        "question": "Can I preview the merged video before downloading?",
        "answer": "Yes! The preview player will play through all your clips in order so you can see exactly how the final merged video will look."
      },
      {
        "question": "Does merging videos reduce quality?",
        "answer": "We use efficient encoding to maintain the best possible quality while keeping file sizes reasonable. The output quality will be very close to your original videos."
      }
    ]
  }
};

const MergeSeo = () => <ToolSeoSection content={content} />;

export default MergeSeo;
