'use client';

import type { ToolSeoSectionContent } from './ToolSeoSection';
import ToolSeoSection from './ToolSeoSection';

const content: ToolSeoSectionContent = {
  "toolId": "extract-audio",
  "category": "audio-quality",
  "intro": {
    "heading": "The Audio Extractor That Just Works",
    "paragraphs": [
      "Need to pull the audio from a video? Whether it is extracting a podcast from a video file, saving a song from a music video, converting a presentation recording to audio-only, or creating audio content for accessibility, you should not need expensive software to do something so simple.",
      "Our audio extractor handles the heavy lifting for you. Just upload your video, choose MP3 or WAV format, and download your extracted audio in seconds. Everything happens right in your browser - no uploads to our servers, no software to download, no registration required.",
      "Clean, fast, and private. Because extracting audio from video should be this straightforward."
    ]
  },
  "howItWorks": {
    "heading": "How Our Audio Extractor Works",
    "items": [
      {
        "title": "Upload & Process Locally",
        "description": "Select your video file and processing begins immediately in your browser. No server uploads, no waiting in queues - everything happens on your device using advanced WebAssembly technology."
      },
      {
        "title": "Choose Your Format",
        "description": "Pick MP3 for smaller files that work everywhere, or WAV for uncompressed, studio-quality audio. We optimize the extraction for each format automatically."
      },
      {
        "title": "Instant Download",
        "description": "Hit extract and download your audio file immediately. No watermarks, no compression artifacts, no quality loss from unnecessary re-encoding."
      },
      {
        "title": "Universal Video Support",
        "description": "Works with any video format your browser can play - MP4, WebM, AVI, MOV, MKV, and more. Desktop, tablet, or mobile, the tool adapts to your device."
      }
    ]
  },
  "whyChoose": {
    "heading": "Why Choose Our Audio Extractor?",
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
        "title": "Perfect Audio Quality",
        "description": "Direct extraction without re-encoding or quality loss."
      },
      {
        "title": "Works Everywhere",
        "description": "Any device with a modern browser. No app downloads needed."
      },
      {
        "title": "Multiple Formats",
        "description": "Extract as MP3 for compatibility or WAV for maximum quality."
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
        "question": "Is the audio extractor free to use?",
        "answer": "Yes, completely free! Extract audio from as many videos as you want, with no limits or hidden charges."
      },
      {
        "question": "What is the difference between MP3 and WAV?",
        "answer": "MP3 files are smaller and more compatible but slightly compressed. WAV files are larger but maintain perfect audio quality with no compression."
      },
      {
        "question": "Are my video files kept private?",
        "answer": "Absolutely. All processing happens locally in your browser. Your videos never get uploaded to our servers or leave your device."
      },
      {
        "question": "Can I use this on mobile devices?",
        "answer": "Yes! The tool works on smartphones, tablets, and desktop computers. The interface automatically adapts to your screen size."
      },
      {
        "question": "Will extracting audio reduce the quality?",
        "answer": "No quality loss occurs during extraction. We copy the original audio stream directly without re-encoding, preserving the exact same quality as the source video."
      },
      {
        "question": "What video formats are supported?",
        "answer": "We support all major video formats including MP4, WebM, AVI, MOV, MKV, FLV, and more. If your browser can play the video, we can extract its audio."
      },
      {
        "question": "Is there a file size limit?",
        "answer": "The only limit is your device's available memory. Since processing happens locally, larger files just take a bit more time to extract."
      },
      {
        "question": "Do I need to install any software?",
        "answer": "No installation required! The tool runs entirely in your web browser using modern web technologies. Just visit the page and start extracting."
      }
    ]
  }
};

const ExtractAudioSeo = () => <ToolSeoSection content={content} />;

export default ExtractAudioSeo;
