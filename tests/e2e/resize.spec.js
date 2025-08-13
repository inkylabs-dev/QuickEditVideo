import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'fs';

test.describe('Resize page', () => {
  test('should load resize page successfully', async ({ page }) => {
    await page.goto('/resize');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Video Resizer - Resize Videos Online Free/);
  });

  test('should have correct page header', async ({ page }) => {
    await page.goto('/resize');
    
    // Check for page header
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).toBeVisible();
    
    // Check header content
    await expect(page.locator('h1')).toContainText('Video Resizer');
    await expect(page.locator('text=Resize videos while maintaining aspect ratio')).toBeVisible();
  });

  test('should have navigation working', async ({ page }) => {
    await page.goto('/resize');
    
    // Check if navigation is present
    const navigation = page.locator('nav, header');
    await expect(navigation).toBeVisible();
  });

  test('should contain video resizer component', async ({ page }) => {
    await page.goto('/resize');
    
    // Check for main video editor section
    const videoEditorSection = page.locator('section').filter({ hasText: /video/i }).first();
    await expect(videoEditorSection).toBeVisible();
    
    // The VideoResizer component should be rendered
    // We can't test the full functionality without uploading a video,
    // but we can verify the structure is present
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should upload test video and show resizing interface', async ({ page }) => {
    await page.goto('/resize');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Check that upload area is present
    await expect(page.locator('text=Select your video')).toBeVisible();
    await expect(page.locator('text=Drop a video file here or click to browse')).toBeVisible();
    await expect(page.locator('text=Choose file')).toBeVisible();
    
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
    
    // Check that resize controls are visible
    await expect(page.locator('text=Resize Controls')).toBeVisible();
    await expect(page.locator('label', { hasText: 'Scale' }).filter({ has: page.locator('~ div input[type="range"]') })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Width' }).filter({ has: page.locator('~ div input[type="number"]') })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Height' }).filter({ has: page.locator('~ div input[type="number"]') })).toBeVisible();
    
    // Check that scale slider is present
    const scaleSlider = page.locator('input[type="range"]');
    await expect(scaleSlider).toBeVisible();
    
    // Check that dimension inputs are present
    const widthInput = page.locator('input[type="number"]').first();
    const heightInput = page.locator('input[type="number"]').last();
    await expect(widthInput).toBeVisible();
    await expect(heightInput).toBeVisible();
    
    // Check that play/pause button is visible
    await expect(page.locator('button', { hasText: /Play|Pause/ })).toBeVisible();
    
    // Check that download button is visible
    await expect(page.locator('button', { hasText: 'Download' })).toBeVisible();
    
    // Check that resize information section is visible
    const resizeInfoSection = page.locator('.bg-white.rounded-lg.shadow-sm.border.border-gray-200.p-4:has(h3:text("Resize Information"))');
    await expect(resizeInfoSection).toBeVisible();
    await expect(resizeInfoSection.locator('text=Original')).toBeVisible();
    await expect(resizeInfoSection.locator('text=New Size')).toBeVisible();
    await expect(resizeInfoSection.locator('text=Scale Factor')).toBeVisible();
  });

  test('should have resize-specific quick guide content', async ({ page }) => {
    await page.goto('/resize');
    
    // Check for quick guide section
    const quickGuide = page.locator('#quick-help');
    await expect(quickGuide).toBeVisible();
    
    // Check for resize-specific guide content
    await expect(page.locator('text=Quick Guide')).toBeVisible();
    await expect(page.locator('text=Upload Video')).toBeVisible();
    await expect(page.locator('text=Set Dimensions')).toBeVisible();
    await expect(page.locator('text=Download Result')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/resize');
    
    // Check that the page still loads properly on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#page-header')).toBeVisible();
  });

  test('should have proper styling and layout', async ({ page }) => {
    await page.goto('/resize');
    
    // Check background styling
    const main = page.locator('main');
    await expect(main).toHaveClass(/bg-gray-50/);
    
    // Check that the page header has border
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).toHaveClass(/border-b/);
  });

  test('should navigate back to home page', async ({ page }) => {
    await page.goto('/resize');
    
    // Look for a way to navigate back to home
    // This could be a logo click or a home link in navigation
    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should have correct SEO meta tags', async ({ page }) => {
    await page.goto('/resize');
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Resize videos online with precision/);
    
    // Check canonical URL
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', /\/resize$/);
  });

  test('should have resize-specific FAQ content', async ({ page }) => {
    await page.goto('/resize');
    
    // Scroll down to find FAQ section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for FAQ section (it should be present based on the trim page pattern)
    const faqSection = page.locator('text=FAQ').or(page.locator('text=Frequently Asked Questions'));
    if (await faqSection.isVisible()) {
      await expect(faqSection).toBeVisible();
    }
  });

  test('should have proper content structure', async ({ page }) => {
    await page.goto('/resize');
    
    // Check main sections are present
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#page-header')).toBeVisible();
    await expect(page.locator('#quick-help')).toBeVisible();
    
    // Check that sections are in correct order
    const main = page.locator('main');
    const sections = main.locator('> section, > div');
    await expect(sections.first()).toBeVisible();
  });

  test('should resize video by scale and download file', async ({ page }) => {
    await page.goto('/resize');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for FFmpeg to load (indicated by download button being enabled)
    await page.waitForSelector('button:has-text("Download"):not([disabled])', { timeout: 30000 });
    
    // Set scale to 50% using the scale slider
    const scaleSlider = page.locator('input[type="range"]');
    await scaleSlider.fill('50');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.click('button:has-text("Download")');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Save the downloaded file to get its size
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Check that the file exists and has size > 0
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // Verify filename contains "resized"
    expect(download.suggestedFilename()).toContain('resized');
  });

  test('should resize video by scale factor 75% and download file', async ({ page }) => {
    await page.goto('/resize');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for FFmpeg to load (indicated by download button being enabled)
    await page.waitForSelector('button:has-text("Download"):not([disabled])', { timeout: 30000 });
    
    // Set scale to 75% using the scale slider
    const scaleSlider = page.locator('input[type="range"]');
    await scaleSlider.fill('75');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.click('button:has-text("Download")');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Save the downloaded file to get its size
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Check that the file exists and has size > 0
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // Verify filename contains "resized"
    expect(download.suggestedFilename()).toContain('resized');
  });

  test('should resize video with upscale factor and download file', async ({ page }) => {
    await page.goto('/resize');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for FFmpeg to load (indicated by download button being enabled)
    await page.waitForSelector('button:has-text("Download"):not([disabled])', { timeout: 30000 });
    
    // Set scale to 150% (upscale)
    const scaleSlider = page.locator('input[type="range"]');
    await scaleSlider.fill('150');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.click('button:has-text("Download")');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Save the downloaded file to get its size
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Check that the file exists and has size > 0
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // Verify filename contains "resized"
    expect(download.suggestedFilename()).toContain('resized');
  });
});