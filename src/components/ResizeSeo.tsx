'use client';

import type { ToolSeoSectionContent } from './ToolSeoSection';
import ToolSeoSection from './ToolSeoSection';

const content: ToolSeoSectionContent = {
  "toolId": "resize",
  "category": "video-editing",
  "intro": {
    "heading": "Resize Video Online - Quick & Simple",
    "paragraphs": [
      "Need to resize a video for social media, your website, or to reduce file size? Stop wrestling with complex video editing software. Whether you are scaling down a 4K video for faster loading or upscaling footage for a presentation, resizing should be straightforward.",
      "That is exactly why we built this tool. No downloads, no accounts, no monthly subscriptions. Just drag your video file, adjust the scale or set your desired dimensions, and download your perfectly resized video. Your video never leaves your device, so your privacy stays intact.",
      "If you can move a slider, you can master this tool in under 30 seconds. Because your time matters more than learning another complicated interface."
    ]
  },
  "howItWorks": {
    "heading": "How to Resize Video Online",
    "items": [
      {
        "title": "Upload & Process Locally",
        "description": "Drop your video file directly into the browser. Everything happens on your device using WebAssembly technology - no servers involved, no waiting for uploads."
      },
      {
        "title": "Smart Aspect Ratio",
        "description": "Set a scale percentage or enter specific width and height. The tool automatically maintains aspect ratio to prevent distorted videos."
      },
      {
        "title": "Instant Download",
        "description": "Hit download and get your resized video in the same format as your original. High-quality scaling with no watermarks."
      },
      {
        "title": "Universal Compatibility",
        "description": "Works with MP4, WebM, MOV, MKV, and more. Use it on any device with a modern browser - desktop, tablet, or mobile."
      }
    ]
  },
  "whyChoose": {
    "heading": "Why Resize Video With Our Tool?",
    "items": [
      {
        "title": "100% Free Forever",
        "description": "No hidden costs, no premium features, no subscription traps."
      },
      {
        "title": "Private & Secure",
        "description": "Your videos never leave your device. Zero server uploads."
      },
      {
        "title": "Maintains Quality",
        "description": "High-quality scaling algorithms preserve video clarity."
      },
      {
        "title": "Works Everywhere",
        "description": "Desktop, mobile, tablet - any device with a browser."
      },
      {
        "title": "Keeps Your Original",
        "description": "Downloads a new resized copy. Your original file stays untouched."
      },
      {
        "title": "No Installation",
        "description": "Works instantly in your browser. No downloads or setup required."
      }
    ]
  },
  "faq": {
    "heading": "Frequently Asked Questions",
    "items": [
      {
        "question": "Is this tool completely free?",
        "answer": "Yes, absolutely! There are no hidden costs, premium features, or subscription plans. Use it as much as you want, forever."
      },
      {
        "question": "Are my videos private and secure?",
        "answer": "Completely. Your videos are processed entirely on your device using WebAssembly technology. Nothing gets uploaded to our servers - we never even see your files."
      },
      {
        "question": "Will resizing reduce my video quality?",
        "answer": "We use high-quality scaling algorithms to maintain the best possible quality. While some quality changes are inevitable when scaling (especially upscaling), our tool minimizes quality loss."
      },
      {
        "question": "How do I maintain aspect ratio?",
        "answer": "The tool automatically maintains aspect ratio. When you set width, height is calculated automatically, and vice versa. Use the scale slider for proportional resizing."
      },
      {
        "question": "What video formats are supported?",
        "answer": "We currently support MP4, WebM, MOV, and MKV. If you have another format, try converting it first."
      },
      {
        "question": "Can I upscale videos?",
        "answer": "Yes! You can scale videos up to 200% or set larger dimensions. Keep in mind that upscaling will not add detail that was not in the original video."
      },
      {
        "question": "Is there a file size limit?",
        "answer": "The only limit is your device’s available memory. Since everything happens locally, larger files just take a bit more time to process."
      },
      {
        "question": "Do I need to create an account?",
        "answer": "Nope! Just visit the page and start resizing. No registration, no email required, no personal information collected."
      }
    ]
  }
};

const ResizeSeo = () => <ToolSeoSection content={content} />;

export default ResizeSeo;
