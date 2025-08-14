import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'fs';

test.describe('Convert to WebM page', () => {
  test('should load WebM converter page successfully', async ({ page }) => {
    await page.goto('/to-webm');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Convert to WebM - Free Online Video Converter/);
  });

  test('should have correct page header', async ({ page }) => {
    await page.goto('/to-webm');
    
    // Check header content
    await expect(page.locator('h1')).toContainText('Convert to WebM');
    await expect(page.locator('text=Transform any video format to WebM with high quality')).toBeVisible();
  });

  test('should upload test video and show WebM conversion interface', async ({ page }) => {
    await page.goto('/to-webm');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Check that conversion controls show WebM as target
    await expect(page.locator('.bg-orange-50 .text-sm.text-orange-600', { hasText: 'Converting to' })).toBeVisible();
    await expect(page.locator('.bg-orange-50 .text-lg.font-medium.text-orange-700', { hasText: 'WebM' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Download as WebM' })).toBeVisible();
  });

  test('should have WebM-specific content', async ({ page }) => {
    await page.goto('/to-webm');
    
    await expect(page.locator('h2', { hasText: 'Convert Any Video to WebM Format' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Web Optimized' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Open Source' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Browser Support' })).toBeVisible();
  });

  test('should convert video to WebM and download file', async ({ page }) => {
    await page.goto('/to-webm');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    await page.waitForSelector('video', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Download as WebM"):not([disabled])', { timeout: 30000 });
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download as WebM")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    expect(download.suggestedFilename()).toContain('converted');
    expect(download.suggestedFilename()).toMatch(/\.webm$/);
  });
});