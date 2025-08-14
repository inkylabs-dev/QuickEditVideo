import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'fs';

test.describe('Convert to MKV page', () => {
  test('should load MKV converter page successfully', async ({ page }) => {
    await page.goto('/to-mkv');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Convert to MKV - Free Online Video Converter/);
  });

  test('should have correct page header', async ({ page }) => {
    await page.goto('/to-mkv');
    
    // Check header content
    await expect(page.locator('h1')).toContainText('Convert to MKV');
    await expect(page.locator('text=Transform any video format to MKV with high quality')).toBeVisible();
  });

  test('should upload test video and show MKV conversion interface', async ({ page }) => {
    await page.goto('/to-mkv');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Check that conversion controls show MKV as target
    await expect(page.locator('.bg-orange-50 .text-sm.text-orange-600', { hasText: 'Converting to' })).toBeVisible();
    await expect(page.locator('.bg-orange-50 .text-lg.font-medium.text-orange-700', { hasText: 'MKV' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Download as MKV' })).toBeVisible();
  });

  test('should have MKV-specific content', async ({ page }) => {
    await page.goto('/to-mkv');
    
    await expect(page.locator('h2', { hasText: 'Convert Any Video to MKV Format' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Open Standard' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Multiple Tracks' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Advanced Features' })).toBeVisible();
  });

  test('should convert video to MKV and download file', async ({ page }) => {
    await page.goto('/to-mkv');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    await page.waitForSelector('video', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Download as MKV"):not([disabled])', { timeout: 30000 });
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download as MKV")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    expect(download.suggestedFilename()).toContain('converted');
    expect(download.suggestedFilename()).toMatch(/\.mkv$/);
  });
});