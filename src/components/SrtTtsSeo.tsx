'use client';

import type { ToolSeoSectionContent } from './ToolSeoSection';
import ToolSeoSection from './ToolSeoSection';

const content: ToolSeoSectionContent = {
  "toolId": "srt-tts",
  "category": "audio-quality",
  "intro": {
    "heading": "Free AI Voice Generator - Convert SRT Subtitles to Natural Speech",
    "paragraphs": [
      "Transform your subtitle files into professional AI-generated speech instantly! Whether you are creating voiceovers from existing subtitles, generating audio descriptions, or converting text content to speech for accessibility, our free AI voice generator makes it effortless.",
      "Simply upload your SRT file, choose from multiple natural-sounding AI voices, and let our advanced technology generate high-quality audio with perfect timing. Each subtitle segment is processed individually with precision, giving you complete control over the final output.",
      "Everything happens securely in your browser using cutting-edge AI models. No file uploads to servers, no accounts required, no privacy concerns - just fast, accurate text-to-speech conversion that is completely free."
    ]
  },
  "howItWorks": {
    "heading": "How SRT to Speech Conversion Works",
    "items": [
      {
        "title": "Smart SRT Parsing",
        "description": "The tool intelligently parses your SRT file, extracting timestamps and text while preserving the original timing structure."
      },
      {
        "title": "AI Voice Generation",
        "description": "Choose from multiple high-quality AI voices. Each subtitle segment is converted to speech using advanced neural networks running locally."
      },
      {
        "title": "Queue Processing",
        "description": "Subtitles are processed one by one in a queue system, allowing you to monitor progress and preview audio clips as they generate."
      },
      {
        "title": "Flexible Download Options",
        "description": "Download individual clips for specific subtitles or combine everything into a single audio file with proper timing."
      }
    ]
  },
  "whyChoose": {
    "heading": "Why Convert SRT to Speech With Our Tool?",
    "items": [
      {
        "title": "Completely Free",
        "description": "No costs, no limits, no premium features. Use as much as you want."
      },
      {
        "title": "Multiple AI Voices",
        "description": "Choose from a variety of high-quality AI voices to match your content."
      },
      {
        "title": "Perfect Timing",
        "description": "Maintains original subtitle timing for synchronized playback."
      },
      {
        "title": "Privacy Protected",
        "description": "All processing happens locally. Your files never leave your device."
      },
      {
        "title": "Flexible Output",
        "description": "Download individual clips or a combined audio file."
      },
      {
        "title": "No Installation Required",
        "description": "Works instantly in any modern web browser."
      }
    ]
  },
  "faq": {
    "heading": "Frequently Asked Questions",
    "items": [
      {
        "question": "What SRT file formats are supported?",
        "answer": "We support standard SRT subtitle files with proper timestamp formatting. The tool automatically parses timing and text content."
      },
      {
        "question": "How many voices are available?",
        "answer": "We offer multiple high-quality AI voices with different characteristics. You can preview and select the one that best fits your content."
      },
      {
        "question": "Can I download individual audio clips?",
        "answer": "Yes! You can download each subtitle segment as a separate audio file, or combine them all into a single file with proper timing."
      },
      {
        "question": "Is there a limit on subtitle length?",
        "answer": "Each subtitle segment can contain up to 500 characters. Longer text will be automatically chunked for optimal voice generation quality."
      },
      {
        "question": "Does the tool preserve timing information?",
        "answer": "Absolutely! The original timing from your SRT file is preserved, ensuring the generated audio maintains proper synchronization."
      },
      {
        "question": "What audio formats can I download?",
        "answer": "Generated audio is available in WAV format for high quality, with options to convert to MP3 for smaller file sizes."
      },
      {
        "question": "Can I use this for commercial projects?",
        "answer": "Yes, the generated audio is yours to use however you like, including commercial projects. No attribution required."
      },
      {
        "question": "How long does it take to process subtitles?",
        "answer": "Processing time depends on the length and number of subtitle segments. Each segment is processed individually, with progress shown in real-time."
      },
      {
        "question": "Does it support languages other than English?",
        "answer": "No, not at the moment. We are working on adding support for more languages in the future."
      }
    ]
  }
};

const SrtTtsSeo = () => <ToolSeoSection content={content} />;

export default SrtTtsSeo;
