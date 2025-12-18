'use client';

import type { ToolSeoSectionContent } from './ToolSeoSection';
import ToolSeoSection from './ToolSeoSection';

const content: ToolSeoSectionContent = {
  "toolId": "extract-frame",
  "category": "video-editing",
  "intro": {
    "heading": "The Frame Extractor That Makes Sense",
    "paragraphs": [
      "Need to grab a screenshot from a video? Whether you are creating thumbnails, extracting reference images, capturing key moments for presentations, or building a video storyboard, you should not need complex software just to pull frames from your videos.",
      "Our frame extractor does exactly what you need. Upload your video, specify the exact time or time range you want, and download high-quality PNG or JPG frames instantly. Everything processes right in your browser - no uploads to our servers, no software downloads, no registration hassles.",
      "Simple, precise, and private. Because extracting frames from video should be this straightforward."
    ]
  },
  "howItWorks": {
    "heading": "How Our Frame Extractor Works",
    "items": [
      {
        "title": "Upload & Process Locally",
        "description": "Select your video file and processing begins immediately in your browser. No server uploads, no waiting - everything happens on your device using advanced WebAssembly technology."
      },
      {
        "title": "Precise Time Control",
        "description": "Extract frames at exact times or set up intervals to capture multiple frames from a time range. Perfect for creating video summaries or storyboards."
      },
      {
        "title": "High Quality Output",
        "description": "Choose PNG for lossless quality and transparency support, or JPG for smaller files. We extract frames at the video’s native resolution."
      },
      {
        "title": "Individual Downloads",
        "description": "Each extracted frame gets its own download button. Grab just the ones you need or download them all - you have complete control."
      }
    ]
  },
  "whyChoose": {
    "heading": "Why Choose Our Frame Extractor?",
    "items": [
      {
        "title": "Completely Free",
        "description": "No trial periods, no premium features, no subscription plans."
      },
      {
        "title": "Your Files Stay Private",
        "description": "Videos never leave your device. Zero uploads to our servers."
      },
      {
        "title": "Perfect Frame Quality",
        "description": "Extract frames at native video resolution without quality loss."
      },
      {
        "title": "Works Everywhere",
        "description": "Any device with a modern browser. No app downloads needed."
      },
      {
        "title": "Flexible Extraction",
        "description": "Single frames or multiple frames with custom intervals."
      },
      {
        "title": "No Registration",
        "description": "Just upload and extract. No accounts, no email required."
      }
    ]
  },
  "faq": {
    "heading": "Frequently Asked Questions",
    "items": [
      {
        "question": "Is the frame extractor free to use?",
        "answer": "Yes, completely free! Extract frames from as many videos as you want, with no limits or hidden charges."
      },
      {
        "question": "What is the difference between PNG and JPG frames?",
        "answer": "PNG files maintain perfect quality with transparency support but are larger. JPG files are smaller and more compressed but do not support transparency."
      },
      {
        "question": "Are my video files kept private?",
        "answer": "Absolutely. All processing happens locally in your browser. Your videos never get uploaded to our servers or leave your device."
      },
      {
        "question": "Can I extract multiple frames at once?",
        "answer": "Yes! Use the time range mode to extract frames at specific intervals. For example, extract a frame every five seconds from minute one to minute three."
      },
      {
        "question": "What video formats are supported?",
        "answer": "We currently support MP4, WebM, MOV, and MKV. If you have another format, try converting it first."
      },
      {
        "question": "What resolution are the extracted frames?",
        "answer": "Extracted frames maintain the same resolution as your original video. No upscaling or downscaling is applied unless specified."
      },
      {
        "question": "Is there a limit on how many frames I can extract?",
        "answer": "The only limit is your device's available memory. Since processing happens locally, larger extractions just take a bit more time."
      },
      {
        "question": "Do I need to install any software?",
        "answer": "No installation required! The tool runs entirely in your web browser using modern web technologies. Just visit the page and start extracting."
      }
    ]
  }
};

const ExtractFrameSeo = () => <ToolSeoSection content={content} />;

export default ExtractFrameSeo;
