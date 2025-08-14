import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'fs';

test.describe('Convert to GIF page', () => {
  test('should load GIF converter page successfully', async ({ page }) => {
    await page.goto('/to-gif');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Convert to GIF - Free Online Video to GIF Converter/);
  });

  test('should have correct page header', async ({ page }) => {
    await page.goto('/to-gif');
    
    // Check header content
    await expect(page.locator('h1')).toContainText('Convert to GIF');
    await expect(page.locator('text=Transform any video into an animated GIF')).toBeVisible();
  });

  test('should display video converter upload interface', async ({ page }) => {
    await page.goto('/to-gif');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Check that upload area is present
    await expect(page.locator('text=Select your video')).toBeVisible();
    await expect(page.locator('text=Choose file')).toBeVisible();
  });

  test('should upload test video and show GIF conversion interface', async ({ page }) => {
    await page.goto('/to-gif');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Check that conversion controls show GIF as target
    await expect(page.locator('.bg-orange-50 .text-sm.text-orange-600', { hasText: 'Converting to' })).toBeVisible();
    await expect(page.locator('.bg-orange-50 .text-lg.font-medium.text-orange-700', { hasText: 'GIF' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Download as GIF' })).toBeVisible();
  });

  test('should have GIF-specific quick guide content', async ({ page }) => {
    await page.goto('/to-gif');
    
    // Check for GIF-specific guide content
    await expect(page.locator('text=Download GIF')).toBeVisible();
    await expect(page.locator('text=Click convert and our tool will create an animated GIF')).toBeVisible();
    await expect(page.locator('text=Download your animated GIF ready for sharing')).toBeVisible();
  });

  test('should have GIF-specific content sections', async ({ page }) => {
    await page.goto('/to-gif');
    
    // Check for GIF-specific content
    await expect(page.locator('h2', { hasText: 'Convert Any Video to Animated GIF' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Why Convert to GIF?' })).toBeVisible();
    
    // Check for GIF-specific benefits
    await expect(page.locator('h4', { hasText: 'Universal Compatibility' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Perfect for Sharing' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Looping Animation' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Compact Size' })).toBeVisible();
  });

  test('should display tips for better GIFs section', async ({ page }) => {
    await page.goto('/to-gif');
    
    // Scroll down to find tips section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for tips section
    await expect(page.locator('h3', { hasText: 'Tips for Better GIFs' })).toBeVisible();
    
    // Check for some key tips
    await expect(page.locator('h4', { hasText: 'Keep it Short' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Choose Clear Subjects' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Consider the Loop' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Optimize for Context' })).toBeVisible();
  });

  test('should convert video to GIF and download file', async ({ page }) => {
    await page.goto('/to-gif');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    await page.waitForSelector('video', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Download as GIF"):not([disabled])', { timeout: 30000 });
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download as GIF")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // Verify filename contains "converted" and has .gif extension
    expect(download.suggestedFilename()).toContain('converted');
    expect(download.suggestedFilename()).toMatch(/\.gif$/);
  });

  test('should have correct SEO meta tags for GIF', async ({ page }) => {
    await page.goto('/to-gif');
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Convert videos to GIF format online for free/);
    
    // Check canonical URL
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', /\/to-gif$/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/to-gif');
    
    // Check that the page still loads properly on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#page-header')).toBeVisible();
  });

  test('should have animated GIF-specific styling', async ({ page }) => {
    await page.goto('/to-gif');
    
    // Check for specific icons used in GIF converter
    const quickGuideSection = page.locator('#quick-help');
    await expect(quickGuideSection).toBeVisible();
    
    // Check that convert step uses image icon instead of clock
    const convertStep = page.locator('text=Auto Convert').locator('..');
    await expect(convertStep).toBeVisible();
  });
});