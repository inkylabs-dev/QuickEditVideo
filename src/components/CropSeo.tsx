'use client';

import type { ToolSeoSectionContent } from './ToolSeoSection';
import ToolSeoSection from './ToolSeoSection';

const content: ToolSeoSectionContent = {
  "toolId": "crop",
  "category": "video-editing",
  "intro": {
    "heading": "Crop Video Online - Perfect for Social Media",
    "paragraphs": [
      "Need to crop a video for social media, presentations, or to focus on specific content? Stop struggling with complicated video editing software. Whether you are creating square videos for Instagram, vertical videos for TikTok, or custom dimensions for your website, cropping should be effortless.",
      "That is exactly why we built this tool. No downloads, no accounts, no monthly subscriptions. Just drag your video file, select your aspect ratio, adjust the crop area, and download your perfectly cropped video. Your video never leaves your device, so your privacy stays intact.",
      "With preset aspect ratios, you will master this tool in under a minute. Because your content creation workflow should not be slowed down by complicated interfaces."
    ]
  },
  "howItWorks": {
    "heading": "How to Crop Video Online",
    "items": [
      {
        "title": "Upload & Process Locally",
        "description": "Drop your video file directly into the browser. Everything happens on your device using WebAssembly technology - no servers involved, no waiting for uploads."
      },
      {
        "title": "Smart Aspect Ratios",
        "description": "Choose from preset ratios like 1:1 for Instagram, 16:9 for YouTube, 9:16 for TikTok, or go freeform for custom dimensions."
      },
      {
        "title": "Precise Control",
        "description": "Drag the crop area to position it, drag corner handles to resize, or set exact dimensions and coordinates. Crop to get the perfect frame."
      },
      {
        "title": "Instant Download",
        "description": "Hit download and get your cropped video in the same format as your original. High-quality processing with no watermarks."
      }
    ]
  },
  "whyChoose": {
    "heading": "Why Crop Video With Our Tool?",
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
        "description": "High-quality cropping algorithms preserve video clarity."
      },
      {
        "title": "Works Everywhere",
        "description": "Desktop, mobile, tablet - any device with a browser."
      },
      {
        "title": "Smart Aspect Ratios",
        "description": "Preset ratios for all major platforms plus custom freeform cropping."
      },
      {
        "title": "Rotation Support",
        "description": "Choose an aspect ratio and adjust the crop area to match your target platform."
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
        "question": "What aspect ratios are supported?",
        "answer": "We support popular ratios like 1:1, 16:9, 9:16, 5:4, 4:5, 4:3, 3:4, 3:2, 2:3, and freeform for custom dimensions."
      },
      {
        "question": "Can I rotate videos before cropping?",
        "answer": "If your video needs rotation, rotate it first using the Flip tool, then crop it here."
      },
      {
        "question": "What video formats are supported?",
        "answer": "We currently support MP4, WebM, MOV, and MKV. If you have another format, try converting it first."
      },
      {
        "question": "Will cropping reduce my video quality?",
        "answer": "Cropping does not reduce quality since we select a portion of the original video. The selected area maintains the original resolution and clarity."
      },
      {
        "question": "Is there a file size limit?",
        "answer": "The only limit is your device's available memory. Since everything happens locally, larger files just take a bit more time to process."
      },
      {
        "question": "Do I need to create an account?",
        "answer": "Nope! Just visit the page and start cropping. No registration, no email required, no personal information collected."
      }
    ]
  }
};

const CropSeo = () => <ToolSeoSection content={content} />;

export default CropSeo;
