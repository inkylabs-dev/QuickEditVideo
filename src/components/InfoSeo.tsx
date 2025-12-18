'use client';

import type { ToolSeoSectionContent } from './ToolSeoSection';
import ToolSeoSection from './ToolSeoSection';

const content: ToolSeoSectionContent = {
  "toolId": "info",
  "category": "video-editing",
  "intro": {
    "heading": "Video Metadata Analyzer - Know Your Files",
    "paragraphs": [
      "Ever wondered what is actually inside your video files? Whether you are troubleshooting playback issues, optimizing for upload, or just curious about your content’s technical specifications, getting detailed video information should not require expensive software or technical expertise.",
      "Our video analyzer extracts comprehensive metadata from your files instantly. Find out the codec, resolution, bitrate, duration, frame rate, audio specifications, and more. All analysis happens directly in your browser - your files never leave your device, ensuring complete privacy.",
      "Perfect for content creators, developers, and anyone who needs to understand their video files better. No downloads, no accounts, no complex interfaces - just drop your video and get detailed insights immediately."
    ]
  },
  "howItWorks": {
    "heading": "How Video Analysis Works",
    "items": [
      {
        "title": "Instant Metadata Extraction",
        "description": "Upload your video file and our tool immediately starts analyzing using powerful FFprobe technology running directly in your browser."
      },
      {
        "title": "Comprehensive Information",
        "description": "Get detailed information about video streams, audio tracks, container format, codecs, bitrates, resolution, and technical specifications."
      },
      {
        "title": "Privacy-First Analysis",
        "description": "All analysis happens locally in your browser using WebAssembly. Your video files never get uploaded to any server."
      },
      {
        "title": "Professional-Grade Results",
        "description": "Uses the same FFprobe engine trusted by video professionals worldwide to provide accurate, detailed metadata analysis."
      }
    ]
  },
  "whyChoose": {
    "heading": "Why Use Our Video Analyzer?",
    "items": [
      {
        "title": "Completely Free",
        "description": "No subscriptions, no limits, no hidden features. Analyze unlimited videos."
      },
      {
        "title": "Privacy Protected",
        "description": "All analysis happens locally. Your files never leave your browser."
      },
      {
        "title": "Professional Quality",
        "description": "Uses the FFprobe engine trusted by video professionals worldwide."
      },
      {
        "title": "Works Everywhere",
        "description": "Desktop, mobile, tablet - any device with a modern browser."
      },
      {
        "title": "Instant Results",
        "description": "Get comprehensive metadata in seconds, not minutes."
      },
      {
        "title": "No Software Needed",
        "description": "Works in your browser. No downloads or installations required."
      }
    ]
  },
  "faq": {
    "heading": "Frequently Asked Questions",
    "items": [
      {
        "question": "What video information can I extract?",
        "answer": "Our tool provides comprehensive metadata including file format, video codec, resolution, frame rate, bitrate, audio codec, sample rate, channels, duration, file size, and technical specifications."
      },
      {
        "question": "Is my video data private and secure?",
        "answer": "Absolutely. All analysis happens entirely in your browser using WebAssembly technology. Your video files never get uploaded to our servers - we never even see them."
      },
      {
        "question": "What video formats are supported?",
        "answer": "We support all major video formats including MP4, WebM, AVI, MOV, MKV, FLV, 3GP, and many more. If your browser can play it, we can analyze it."
      },
      {
        "question": "How accurate is the metadata extraction?",
        "answer": "Very accurate. We use FFprobe, the same professional-grade tool used by video industry experts worldwide. The metadata comes directly from the video file headers."
      },
      {
        "question": "Can I use this tool on mobile devices?",
        "answer": "Yes! The tool works on any device with a modern web browser, including smartphones and tablets. The interface adapts to your screen size."
      },
      {
        "question": "Is there a file size limit?",
        "answer": "The only limit is your device's available memory. Metadata analysis is very efficient and works with files of any size, including very large videos."
      },
      {
        "question": "Why would I need video metadata?",
        "answer": "Video metadata helps with troubleshooting playback issues, optimizing for specific platforms, checking encoding quality, verifying file specifications, and understanding technical details for editing or distribution."
      },
      {
        "question": "Do I need to create an account?",
        "answer": "No account needed! Just visit the page and start analyzing. No registration, no email required, no personal information collected."
      }
    ]
  }
};

const InfoSeo = () => <ToolSeoSection content={content} />;

export default InfoSeo;
