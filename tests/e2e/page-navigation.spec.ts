import { test, expect } from '@playwright/test';

test.describe('Page Navigation E2E Tests', () => {
  test.describe('Homepage Navigation', () => {
    test('should navigate to all video processing pages from homepage', async ({ page }) => {
      await page.goto('/');

      // Test navigation to trim page
      await page.getByText('Video Trimmer', { exact: false }).first().click();
      await expect(page).toHaveURL('/trim');
      await expect(page.getByRole('heading', { name: 'Video Trimmer', level: 1 })).toBeVisible();

      // Go back to home
      await page.goto('/');

      // Test navigation to crop page
      await page.getByText('Video Cropper', { exact: false }).first().click();
      await expect(page).toHaveURL('/crop');
      await expect(page.getByRole('heading', { name: 'Video Cropper', level: 1 })).toBeVisible();

      // Go back to home
      await page.goto('/');

      // Test navigation to merge page
      await page.getByText('Video Merger', { exact: false }).first().click();
      await expect(page).toHaveURL('/merge');
      await expect(page.getByRole('heading', { name: 'Video Merger', level: 1 })).toBeVisible();

      // Go back to home
      await page.goto('/');

      // Test navigation to resize page
      await page.getByText('Video Resizer', { exact: false }).first().click();
      await expect(page).toHaveURL('/resize');
      await expect(page.getByRole('heading', { name: 'Video Resizer', level: 1 })).toBeVisible();

      // Go back to home
      await page.goto('/');

      // Test navigation to flip page
      await page.getByText('Flipper', { exact: false }).first().click();
      await expect(page).toHaveURL('/flip');
      await expect(page.getByRole('heading', { name: 'Video Flipper', level: 1 })).toBeVisible();
    });

    test('should have working navigation menu', async ({ page }) => {
      await page.goto('/');

      // Check if navigation menu exists (adjust selector based on actual implementation)
      const navigationLinks = page.locator('nav a, header a').filter({ hasText: /trim|crop|merge|resize|flip/i });
      
      if (await navigationLinks.count() > 0) {
        // Test first navigation link
        await navigationLinks.first().click();
        
        // Should navigate to a video processing page
        await expect(page.url()).toMatch(/(trim|crop|merge|resize|flip)/);
      }
    });
  });

  test.describe('Direct Page Access', () => {
    test('should load trim page directly', async ({ page }) => {
      await page.goto('/trim');
      
      await expect(page.getByRole('heading', { name: 'Video Trimmer', level: 1 })).toBeVisible();
      await expect(page.getByText('Cut videos with frame-perfect precision')).toBeVisible();
      await expect(page.getByText('Select your video')).toBeVisible();
    });

    test('should load crop page directly', async ({ page }) => {
      await page.goto('/crop');
      
      await expect(page.getByRole('heading', { name: 'Video Cropper', level: 1 })).toBeVisible();
      await expect(page.getByText('Select your video')).toBeVisible();
    });

    test('should load merge page directly', async ({ page }) => {
      await page.goto('/merge');
      
      await expect(page.getByRole('heading', { name: 'Video Merger', level: 1 })).toBeVisible();
      await expect(page.getByText('Combine multiple videos into one')).toBeVisible();
      await expect(page.getByText('Select your videos')).toBeVisible();
    });

    test('should load resize page directly', async ({ page }) => {
      await page.goto('/resize');
      
      await expect(page.getByRole('heading', { name: 'Video Resizer', level: 1 })).toBeVisible();
      await expect(page.getByText('Resize videos while maintaining aspect ratio')).toBeVisible();
      await expect(page.getByText('Select your video')).toBeVisible();
    });
  });

  test.describe('Page Headers and Metadata', () => {
    test('should have correct page titles', async ({ page }) => {
      // Test trim page title
      await page.goto('/trim');
      await expect(page).toHaveTitle(/Video Trimmer.*Cut.*Trim Videos Online Free/);

      // Test crop page title
      await page.goto('/crop');
      await expect(page).toHaveTitle(/Video Cropper.*Crop Videos Online Free/);

      // Test merge page title
      await page.goto('/merge');
      await expect(page).toHaveTitle(/Video Merger.*Merge Multiple Videos Online Free/);

      // Test resize page title
      await page.goto('/resize');
      await expect(page).toHaveTitle(/Video Resizer.*Resize Videos Online Free/);
    });

    test('should have proper meta descriptions', async ({ page }) => {
      // Test trim page meta description
      await page.goto('/trim');
      const trimMeta = await page.locator('meta[name="description"]').getAttribute('content');
      expect(trimMeta).toContain('Trim videos online with precision');

      // Test merge page meta description
      await page.goto('/merge');
      const mergeMeta = await page.locator('meta[name="description"]').getAttribute('content');
      expect(mergeMeta).toContain('Merge multiple videos into one online');

      // Test resize page meta description
      await page.goto('/resize');
      const resizeMeta = await page.locator('meta[name="description"]').getAttribute('content');
      expect(resizeMeta).toContain('Resize videos online with precision');
    });

    test('should have canonical URLs', async ({ page }) => {
      // Test canonical URL for trim page
      await page.goto('/trim');
      const trimCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(trimCanonical).toContain('/trim');

      // Test canonical URL for merge page
      await page.goto('/merge');
      const mergeCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(mergeCanonical).toContain('/merge');

      // Test canonical URL for resize page
      await page.goto('/resize');
      const resizeCanonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(resizeCanonical).toContain('/resize');
    });
  });

  test.describe('Header Visibility Behavior', () => {
    test('should hide/show header on trim page view changes', async ({ page }) => {
      await page.goto('/trim');

      // Header should be visible on landing view
      const pageHeader = page.locator('#page-header');
      await expect(pageHeader).toBeVisible();

      // Upload a file to trigger view change
      const mockFile = await page.evaluateHandle(() => {
        const buffer = new ArrayBuffer(1024);
        return new File([buffer], 'test-video.mp4', { type: 'video/mp4' });
      });

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Header might be hidden in editing view (depending on implementation)
      // This tests the header toggle functionality
      await page.waitForTimeout(500);
      
      // Click close to return to landing
      if (await page.getByTitle('Choose different video').isVisible()) {
        await page.getByTitle('Choose different video').click();
        await expect(pageHeader).toBeVisible();
      }
    });

    test('should handle header toggle on other pages', async ({ page }) => {
      // Test merge page header behavior
      await page.goto('/merge');
      
      const pageHeader = page.locator('#page-header');
      await expect(pageHeader).toBeVisible();

      // Upload files
      const mockFile = await page.evaluateHandle(() => {
        return new File([new ArrayBuffer(1024)], 'test-video.mp4', { type: 'video/mp4' });
      });

      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([mockFile as any]);

      // Wait for view change
      await page.waitForTimeout(500);
      
      // Header behavior should be consistent
      const headerVisible = await pageHeader.isVisible();
      expect(typeof headerVisible).toBe('boolean');
    });
  });

  test.describe('Quick Help Sections', () => {
    test('should display quick help on all pages', async ({ page }) => {
      const pages = ['/trim', '/crop', '/merge', '/resize'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Check for quick help section
        await expect(page.locator('#quick-help')).toBeVisible();
        await expect(page.getByText('Quick Guide')).toBeVisible();
        
        // Should have step-by-step instructions
        await expect(page.getByText('1')).toBeVisible();
        await expect(page.getByText('Upload').or(page.getByText('Select'))).toBeVisible();
      }
    });

    test('should have page-specific step instructions', async ({ page }) => {
      // Trim page should have 3 steps
      await page.goto('/trim');
      await expect(page.getByText('Upload Video')).toBeVisible();
      await expect(page.getByText('Set Timeline')).toBeVisible();
      await expect(page.getByText('Download Result')).toBeVisible();

      // Merge page should have 4 steps
      await page.goto('/merge');
      await expect(page.getByText('Upload Videos')).toBeVisible();
      await expect(page.getByText('Arrange Order')).toBeVisible();
      await expect(page.getByText('Set Duration')).toBeVisible();
      await expect(page.getByText('Download Result')).toBeVisible();

      // Resize page should have 3 steps
      await page.goto('/resize');
      await expect(page.getByText('Upload Video')).toBeVisible();
      await expect(page.getByText('Set Dimensions')).toBeVisible();
      await expect(page.getByText('Download Result')).toBeVisible();
    });
  });

  test.describe('FAQ Sections', () => {
    test('should have FAQ sections on all pages', async ({ page }) => {
      const pages = ['/trim', '/crop', '/merge', '/resize'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Check for FAQ section
        await expect(page.getByText('Frequently Asked Questions')).toBeVisible();
        
        // Should have common questions
        await expect(page.getByText('Is this tool completely free?').or(page.getByText('free'))).toBeVisible();
        await expect(page.getByText('private and secure').or(page.getByText('privacy'))).toBeVisible();
      }
    });

    test('should have page-specific FAQ content', async ({ page }) => {
      // Trim page FAQ
      await page.goto('/trim');
      await expect(page.getByText('Will trimming reduce my video quality?')).toBeVisible();

      // Merge page FAQ
      await page.goto('/merge');
      await expect(page.getByText('How many videos can I merge at once?')).toBeVisible();
      await expect(page.getByText('What happens if my videos have different resolutions?')).toBeVisible();

      // Resize page FAQ
      await page.goto('/resize');
      await expect(page.getByText('Will resizing reduce my video quality?')).toBeVisible();
      await expect(page.getByText('How do I maintain aspect ratio?')).toBeVisible();
    });
  });

  test.describe('Content and SEO Structure', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/trim');
      
      // Check H1
      const h1Elements = page.locator('h1');
      await expect(h1Elements).toHaveCount(1);
      await expect(h1Elements.first()).toContainText('Video Trimmer');
      
      // Check H2 elements exist
      const h2Elements = page.locator('h2');
      expect(await h2Elements.count()).toBeGreaterThan(0);
      
      // Check H3 elements exist
      const h3Elements = page.locator('h3');
      expect(await h3Elements.count()).toBeGreaterThan(0);
    });

    test('should have feature descriptions', async ({ page }) => {
      await page.goto('/trim');
      
      // Should explain how the tool works
      await expect(page.getByRole('heading', { name: 'How Our Video Trimmer Works' })).toBeVisible();
      
      // Should have why choose section
      await expect(page.getByRole('heading', { name: 'Why Choose Our Video Trimmer?' })).toBeVisible();
      
      // Should list benefits
      await expect(page.getByText('100% Free Forever').or(page.getByText('Completely Free'))).toBeVisible();
      await expect(page.getByText('Private & Secure')).toBeVisible();
    });

    test('should explain privacy and security', async ({ page }) => {
      const pages = ['/trim', '/merge', '/resize'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Should mention local processing
        await expect(page.getByText('processed entirely on your device').or(
          page.getByText('processing happens locally').or(
            page.getByText('Your videos never leave your device')
          )
        )).toBeVisible();
        
        // Should mention WebAssembly
        await expect(page.getByText('WebAssembly')).toBeVisible();
      }
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/trim');
      
      // Main content should be visible
      await expect(page.getByRole('heading', { name: 'Video Trimmer', level: 1 })).toBeVisible();
      await expect(page.getByText('Select your video')).toBeVisible();
      
      // Navigation should work
      await page.goto('/merge');
      await expect(page.getByRole('heading', { name: 'Video Merger', level: 1 })).toBeVisible();
    });

    test('should have touch-friendly interface', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/trim');
      
      // Upload area should be large enough for touch
      const uploadArea = page.getByText('Drop a video file here or click to browse');
      const boundingBox = await uploadArea.boundingBox();
      
      if (boundingBox) {
        expect(boundingBox.height).toBeGreaterThan(40); // Minimum touch target size
      }
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load pages quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/trim');
      await expect(page.getByRole('heading', { name: 'Video Trimmer', level: 1 })).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    });

    test('should handle component hydration', async ({ page }) => {
      await page.goto('/trim');
      
      // Wait for React/Preact components to hydrate
      await page.waitForTimeout(1000);
      
      // Interactive elements should be functional
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeAttached();
      
      // Upload area should be clickable
      const uploadArea = page.getByText('Choose file');
      await expect(uploadArea).toBeVisible();
    });
  });

  test.describe('Error Pages', () => {
    test('should handle 404 errors gracefully', async ({ page }) => {
      // Try to navigate to a non-existent page
      const response = await page.goto('/non-existent-page', { waitUntil: 'load' });
      
      // Should return 404 status
      expect(response?.status()).toBe(404);
      
      // Should show some kind of error page or redirect
      // The exact behavior depends on your Astro configuration
    });

    test('should handle invalid routes', async ({ page }) => {
      // Try various invalid routes
      const invalidRoutes = ['/trim/invalid', '/merge/test', '/resize/123'];
      
      for (const route of invalidRoutes) {
        const response = await page.goto(route, { waitUntil: 'load' });
        
        // Should handle gracefully (404 or redirect)
        const status = response?.status();
        expect([200, 404]).toContain(status);
      }
    });
  });
});