import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'fs';

test.describe('Convert to AVI page', () => {
  test('should load AVI converter page successfully', async ({ page }) => {
    await page.goto('/to-avi');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Convert to AVI - Free Online Video Converter/);
  });

  test('should have correct page header', async ({ page }) => {
    await page.goto('/to-avi');
    
    // Check for page header
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).toBeVisible();
    
    // Check header content
    await expect(page.locator('h1')).toContainText('Convert to AVI');
    await expect(page.locator('text=Transform any video format to AVI with high quality')).toBeVisible();
  });

  test('should display video converter upload interface', async ({ page }) => {
    await page.goto('/to-avi');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Check that upload area is present
    await expect(page.locator('text=Select your video')).toBeVisible();
    await expect(page.locator('text=Choose file')).toBeVisible();
  });

  test('should upload test video and show AVI conversion interface', async ({ page }) => {
    await page.goto('/to-avi');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Check that conversion controls show AVI as target
    await expect(page.locator('.bg-orange-50 .text-sm.text-orange-600', { hasText: 'Converting to' })).toBeVisible();
    await expect(page.locator('.bg-orange-50 .text-lg.font-medium.text-orange-700', { hasText: 'AVI' })).toBeVisible();
    
    // Check that download button shows AVI
    await expect(page.locator('button', { hasText: 'Download as AVI' })).toBeVisible();
  });

  test('should have AVI-specific content', async ({ page }) => {
    await page.goto('/to-avi');
    
    // Check for AVI-specific content
    await expect(page.locator('text=Download AVI')).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Convert Any Video to AVI Format' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Why Convert to AVI?' })).toBeVisible();
    
    // Check for AVI-specific benefits
    await expect(page.locator('h4', { hasText: 'Legacy Compatibility' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Professional Standard' })).toBeVisible();
  });

  test('should convert video to AVI and download file', async ({ page }) => {
    await page.goto('/to-avi');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for FFmpeg to load
    await page.waitForSelector('button:has-text("Download as AVI"):not([disabled])', { timeout: 30000 });
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.click('button:has-text("Download as AVI")');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Verify download
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // Verify filename contains "converted" and has .avi extension
    expect(download.suggestedFilename()).toContain('converted');
    expect(download.suggestedFilename()).toMatch(/\.avi$/);
  });

  test('should have correct SEO meta tags for AVI', async ({ page }) => {
    await page.goto('/to-avi');
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Convert videos to AVI format online for free/);
    
    // Check canonical URL
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', /\/to-avi$/);
  });
});