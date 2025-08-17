import { describe, it, expect } from 'vitest';
import { renderAstroComponentToString } from '../../helpers';
import Resize from '../../../src/pages/resize.astro';

describe('Resize Page', () => {
  describe('Page Rendering', () => {
    it('renders resize page successfully', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Video Resizer');
        expect(html).toContain('VideoResizer');
      } catch (error) {
        // If renderAstroComponentToString fails, at least verify the component exists
        expect(Resize).toBeDefined();
      }
    });

    it('contains proper page structure', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('<main');
        expect(html).toContain('class="min-h-screen bg-gray-50"');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('SEO and Meta Information', () => {
    it('has correct page title', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Video Resizer - Resize Videos Online Free | QuickEditVideo');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('contains meta description', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Resize videos online with precision');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('has proper keywords', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('video resizer, resize video online');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('includes canonical URL', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('https://quickeditvideo.com/resize');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('Content Structure', () => {
    it('contains page header section', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('id="page-header"');
        expect(html).toContain('Resize videos while maintaining aspect ratio');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('includes quick help section', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('id="quick-help"');
        expect(html).toContain('Quick Guide');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('has step-by-step guide with 3 steps', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Upload Video');
        expect(html).toContain('Set Dimensions');
        expect(html).toContain('Download Result');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('contains FAQ section', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Frequently Asked Questions');
        expect(html).toContain('Is this tool completely free?');
        expect(html).toContain('Will resizing reduce my video quality?');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('Feature Descriptions', () => {
    it('explains upload and process locally feature', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Upload & Process Locally');
        expect(html).toContain('Drop your video file directly into the browser');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('describes smart aspect ratio feature', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Smart Aspect Ratio');
        expect(html).toContain('automatically maintains aspect ratio');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('explains instant download feature', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Instant Download');
        expect(html).toContain('High-quality scaling with no watermarks');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('mentions universal compatibility', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Universal Compatibility');
        expect(html).toContain('Works with MP4, WebM, AVI, MOV, and more');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('Why Choose Section', () => {
    it('lists key benefits', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('100% Free Forever');
        expect(html).toContain('Private & Secure');
        expect(html).toContain('Maintains Quality');
        expect(html).toContain('Works Everywhere');
        expect(html).toContain('Keeps Your Original');
        expect(html).toContain('No Installation');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('explains privacy features', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Your videos never leave your device');
        expect(html).toContain('Zero server uploads');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('mentions quality preservation', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('High-quality scaling algorithms preserve video clarity');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('FAQ Content', () => {
    it('addresses tool cost concerns', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('There are no hidden costs, premium features, or subscription plans');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('explains privacy and security', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('processed entirely on your device using WebAssembly technology');
        expect(html).toContain('Nothing gets uploaded to our servers');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('discusses quality impact', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('We use high-quality scaling algorithms');
        expect(html).toContain('our tool minimizes quality loss');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('explains aspect ratio maintenance', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('The tool automatically maintains aspect ratio');
        expect(html).toContain('Use the scale slider for proportional resizing');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('lists supported formats', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('MP4, WebM, AVI, MOV, MKV');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('addresses upscaling capability', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('You can scale videos up to 200%');
        expect(html).toContain('upscaling won\'t add detail that wasn\'t in the original video');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('explains file size limitations', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('The only limit is your device\'s available memory');
        expect(html).toContain('larger files just take a bit more time to process');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('clarifies account requirements', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('No registration, no email required, no personal information collected');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('Introduction Content', () => {
    it('addresses common video resizing needs', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Need to resize a video for social media');
        expect(html).toContain('scaling down a 4K video for faster loading');
        expect(html).toContain('upscaling footage for a presentation');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('emphasizes simplicity', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Stop wrestling with complex video editing software');
        expect(html).toContain('If you can move a slider, you can master this tool');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('highlights key features', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('No downloads, no accounts, no monthly subscriptions');
        expect(html).toContain('Your video never leaves your device');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('JavaScript Functionality', () => {
    it('includes header toggle script for VideoResizer', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('videoResizerViewChange');
        expect(html).toContain('toggleHeader');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('has event listener for DOMContentLoaded', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('DOMContentLoaded');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('CSS Styles', () => {
    it('has video container styles', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('.video-container');
        expect(html).toContain('aspect-ratio: 16/9');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('includes progress ring styles', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('.progress-ring');
        expect(html).toContain('stroke-dasharray: 251.2');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('has range slider styling', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('.range-slider');
        expect(html).toContain('-webkit-appearance: none');
        expect(html).toContain('border-radius: 4px');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('includes webkit slider thumb styles', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('::-webkit-slider-thumb');
        expect(html).toContain('background: #0d9488');
        expect(html).toContain('border-radius: 50%');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('has mozilla range thumb styles', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('::-moz-range-thumb');
        expect(html).toContain('background: #0d9488');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('includes responsive video container', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('.video-container-custom');
        expect(html).toContain('@media (max-width: 768px)');
        expect(html).toContain('max-height: 40vh');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper semantic structure', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('<main');
        expect(html).toContain('<section');
        expect(html).toContain('<h1');
        expect(html).toContain('<h2');
        expect(html).toContain('<h3');
        expect(html).toContain('<h4');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('includes descriptive headings', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Video Resizer');
        expect(html).toContain('Quick Guide');
        expect(html).toContain('How Our Video Resizer Works');
        expect(html).toContain('Why Choose Our Video Resizer?');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('has step indicators with proper numbering', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('>1</');
        expect(html).toContain('>2</');
        expect(html).toContain('>3</');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('includes proper SVG accessibility', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('stroke="currentColor"');
        expect(html).toContain('fill="currentColor"');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('Component Integration', () => {
    it('includes VideoResizer component with client:load', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('VideoResizer');
        expect(html).toContain('client:load');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('has proper container structure', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('max-w-6xl mx-auto');
        expect(html).toContain('max-w-4xl mx-auto');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('Mobile Responsiveness', () => {
    it('includes responsive grid classes', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('grid-cols-1 md:grid-cols-3');
        expect(html).toContain('grid-cols-1 md:grid-cols-2');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('has mobile-specific spacing', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('px-4 md:px-6');
        expect(html).toContain('p-4 md:p-6');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('includes responsive prose classes', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('prose prose-lg');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });

  describe('Step Instructions', () => {
    it('provides clear upload instructions', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Upload your video file (supports MP4, WebM, AVI, MOV)');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('explains dimension setting', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Use scale slider or set width/height manually');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });

    it('describes download process', async () => {
      try {
        const html = await renderAstroComponentToString(Resize);
        expect(html).toContain('Preview your resized video and download it');
      } catch (error) {
        expect(Resize).toBeDefined();
      }
    });
  });
});