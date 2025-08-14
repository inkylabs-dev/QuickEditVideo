import { test, expect } from '@playwright/test';
import { statSync } from 'fs';

test.describe('Convert to AVI page - E2E', () => {
  test('should load AVI converter page successfully', async ({ page }) => {
    await page.goto('/to-avi');
    
    await expect(page).toHaveTitle(/Convert to AVI - Free Online Video Converter/);
    await expect(page.locator('h1')).toContainText('Convert to AVI');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
  });

  test('should convert video to AVI and download file', async ({ page }) => {
    await page.goto('/to-avi');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    await page.waitForSelector('video', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Download as AVI"):not([disabled])', { timeout: 30000 });
    
    await expect(page.locator('.bg-orange-50 .text-lg.font-medium.text-orange-700', { hasText: 'AVI' })).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download as AVI")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    expect(download.suggestedFilename()).toMatch(/\.avi$/);
  });
});