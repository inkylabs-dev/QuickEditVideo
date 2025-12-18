'use client';

import type { ToolSeoSectionContent } from './ToolSeoSection';
import ToolSeoSection from './ToolSeoSection';

const content: ToolSeoSectionContent = {
  "toolId": "trim",
  "category": "video-editing",
  "intro": {
    "heading": "Trim Video Online - Simple & Fast",
    "paragraphs": [
      "Let's be honest-you should not need a film degree just to cut a few seconds off your video. Whether you are trimming a presentation recording, cutting highlights from a longer clip, or removing awkward pauses, video editing software often feels like overkill.",
      "That is exactly why we built this tool. No downloads, no accounts, no monthly subscriptions. Just drag your video file, set your start and end points, and download your perfectly trimmed clip. Your video never leaves your device, so your privacy stays intact.",
      "If you can drag a slider, you can master this tool in under 30 seconds. Because your time matters more than learning another complicated interface."
    ]
  },
  "howItWorks": {
    "heading": "How to Trim Video Online",
    "items": [
      {
        "title": "Upload & Process Locally",
        "description": "Drop your video file directly into the browser. Everything happens on your device using WebAssembly - no servers involved."
      },
      {
        "title": "Precise Timeline Control",
        "description": "Drag the timeline handles to set exact start and end points and preview your selection in real-time."
      },
      {
        "title": "Instant Download",
        "description": "Hit download and get your trimmed video in the same format as your original with no watermarks."
      },
      {
        "title": "Universal Compatibility",
        "description": "Works with MP4, WebM, MOV, MKV, and more on desktop, tablet, or mobile."
      }
    ]
  },
  "whyChoose": {
    "heading": "Why Trim Video With Our Tool?",
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
        "title": "No Quality Loss",
        "description": "Frame-perfect cuts without re-encoding or compression."
      },
      {
        "title": "Works Everywhere",
        "description": "Desktop, mobile, tablet-any device with a browser."
      },
      {
        "title": "Keeps Your Original",
        "description": "Downloads a new trimmed copy. Your original file stays untouched."
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
        "answer": "Completely. Your videos are processed entirely on your device using WebAssembly. Nothing gets uploaded to our servers."
      },
      {
        "question": "Will trimming reduce my video quality?",
        "answer": "No quality loss at all. We use frame-perfect cutting without re-encoding, so your trimmed video maintains the same quality as the original."
      },
      {
        "question": "Can I use this on my phone or tablet?",
        "answer": "Yes! The tool works on any device with a modern web browser, including smartphones and tablets."
      },
      {
        "question": "What happens to my original video file?",
        "answer": "Your original file remains untouched. The tool creates a new trimmed copy for download."
      },
      {
        "question": "What video formats are supported?",
        "answer": "We currently support MP4, WebM, MOV, and MKV. If you have another format, try converting it first."
      },
      {
        "question": "Is there a file size limit?",
        "answer": "The only limit is your device's available memory. Larger files take a bit more time to process."
      },
      {
        "question": "Do I need to create an account?",
        "answer": "Nope! Just visit the page and start trimming. No registration, no email required."
      }
    ]
  }
};

const TrimSeo = () => <ToolSeoSection content={content} />;

export default TrimSeo;
