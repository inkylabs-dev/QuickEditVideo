import { test, expect } from '@playwright/test';
import { statSync } from 'fs';

test.describe('Convert to WebM page - E2E', () => {
  test('should load WebM converter page successfully', async ({ page }) => {
    await page.goto('/to-webm');
    
    await expect(page).toHaveTitle(/Convert to WebM - Free Online Video Converter/);
    await expect(page.locator('h1')).toContainText('Convert to WebM');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
  });

  test('should convert video to WebM and download file', async ({ page }) => {
    await page.goto('/to-webm');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    await page.waitForSelector('video', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Download as WebM"):not([disabled])', { timeout: 30000 });
    
    await expect(page.getByTestId('target-format', { hasText: 'WebM' })).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download as WebM")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    expect(download.suggestedFilename()).toMatch(/\.webm$/);
  });
});