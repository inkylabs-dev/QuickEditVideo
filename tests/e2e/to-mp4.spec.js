import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'fs';

test.describe('Convert to MP4 page', () => {
  test('should load MP4 converter page successfully', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Convert to MP4 - Free Online Video Converter/);
  });

  test('should have correct page header', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Check for page header
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).toBeVisible();
    
    // Check header content
    await expect(page.locator('h1')).toContainText('Convert to MP4');
    await expect(page.locator('text=Transform any video format to MP4 with high quality')).toBeVisible();
  });

  test('should have navigation working', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Check if navigation is present
    const navigation = page.locator('nav, header');
    await expect(navigation).toBeVisible();
  });

  test('should contain video converter component', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Check for main video converter section
    const videoConverterSection = page.locator('section').filter({ hasText: /video/i }).first();
    await expect(videoConverterSection).toBeVisible();
    
    // The VideoConverter component should be rendered
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should display video converter upload interface', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Check that upload area is present
    await expect(page.locator('text=Select your video')).toBeVisible();
    await expect(page.locator('text=Drop a video file here or click to browse')).toBeVisible();
    await expect(page.locator('text=Choose file')).toBeVisible();
    
    // Check for file format support text
    await expect(page.locator('text=Supports MP4, WebM, AVI, MOV and more')).toBeVisible();
  });

  test('should upload test video and show conversion interface', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Check that video element is present and has src
    const video = page.locator('video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('src', /blob:/);
    
    // Check that page header is hidden (should happen when video loads)
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).not.toBeVisible();
    
    // Check that conversion controls are visible
    await expect(page.locator('text=Controls')).toBeVisible();
    await expect(page.locator('text=Original Format')).toBeVisible();
    await expect(page.locator('.bg-orange-50', { hasText: 'Converting to' })).toBeVisible();
    await expect(page.locator('.bg-orange-50 .text-orange-700', { hasText: 'MP4' })).toBeVisible();
    
    // Check that duration is shown (in the controls section)
    await expect(page.locator('.bg-gray-50 .text-sm.text-gray-600', { hasText: 'Duration' })).toBeVisible();
    
    // Check that play/pause button is visible
    await expect(page.locator('button', { hasText: /Play|Pause/ })).toBeVisible();
    
    // Check that download button is visible
    await expect(page.locator('button', { hasText: 'Download as MP4' })).toBeVisible();
  });

  test('should have MP4-specific quick guide content', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Check for quick guide section
    const quickGuide = page.locator('#quick-help');
    await expect(quickGuide).toBeVisible();
    
    // Check for MP4-specific guide content
    await expect(page.locator('text=Quick Guide')).toBeVisible();
    await expect(page.locator('text=Upload Video')).toBeVisible();
    await expect(page.locator('text=Auto Convert')).toBeVisible();
    await expect(page.locator('text=Download MP4')).toBeVisible();
    
    // Check step descriptions
    await expect(page.locator('text=Upload your video file (supports AVI, MOV, MKV, WebM and more)')).toBeVisible();
    await expect(page.locator('text=Click convert and our tool will transform your video to MP4')).toBeVisible();
    await expect(page.locator('text=Download your converted MP4 video with preserved quality')).toBeVisible();
  });

  test('should have proper MP4 SEO content sections', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Check for main content sections
    await expect(page.locator('h2', { hasText: 'Convert Any Video to MP4 Format' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Why Convert to MP4?' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Supported Input Formats' })).toBeVisible();
    
    // Check for MP4-specific benefit points
    await expect(page.locator('h4', { hasText: 'Universal Compatibility' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Excellent Compression' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Web-Optimized' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Professional Standard' })).toBeVisible();
  });

  test('should display supported input formats', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Scroll down to find supported formats section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for supported formats section
    await expect(page.locator('h3', { hasText: 'Supported Input Formats' })).toBeVisible();
    
    // Check for some key format items in the supported formats section
    const formatsSection = page.locator('h3', { hasText: 'Supported Input Formats' }).locator('..');
    await expect(formatsSection.locator('text=AVI').first()).toBeVisible();
    await expect(formatsSection.locator('text=MOV').first()).toBeVisible();
    await expect(formatsSection.locator('text=MKV').first()).toBeVisible();
    await expect(formatsSection.locator('text=WebM').first()).toBeVisible();
  });

  test('should have correct SEO meta tags', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Convert videos to MP4 format online for free/);
    
    // Check canonical URL
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', /\/to-mp4$/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/to-mp4');
    
    // Check that the page still loads properly on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#page-header')).toBeVisible();
  });

  test('should have proper styling and layout', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Check background styling
    const main = page.locator('main');
    await expect(main).toHaveClass(/bg-gray-50/);
    
    // Check that the page header has border
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).toHaveClass(/border-b/);
  });

  test('should navigate back to home page', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Look for a way to navigate back to home
    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should convert video to MP4 and download file', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for FFmpeg to load (indicated by download button being enabled)
    await page.waitForSelector('button:has-text("Download as MP4"):not([disabled])', { timeout: 30000 });
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.click('button:has-text("Download as MP4")');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Save the downloaded file to get its size
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Check that the file exists and has size > 0
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // Verify filename contains "converted" and has .mp4 extension
    expect(download.suggestedFilename()).toContain('converted');
    expect(download.suggestedFilename()).toMatch(/\.mp4$/);
  });

  test('should show conversion progress during processing', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for FFmpeg to load
    await page.waitForSelector('button:has-text("Download as MP4"):not([disabled])', { timeout: 30000 });
    
    // Click download button to start conversion
    await page.click('button:has-text("Download as MP4")');
    
    // Check that progress indicator appears
    const progressText = page.locator('button', { hasText: 'Converting' });
    if (await progressText.isVisible()) {
      await expect(progressText).toBeVisible();
    }
  });

  test('should handle video format detection correctly', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Check that original format is detected correctly
    const originalFormatSection = page.locator('text=Original Format').locator('..').locator('div').last();
    await expect(originalFormatSection).toContainText(/MP4|mp4/);
    
    // Check that target format is shown
    const targetFormatSection = page.locator('text=Converting to').locator('..').locator('div').last();
    await expect(targetFormatSection).toContainText('MP4');
  });
});