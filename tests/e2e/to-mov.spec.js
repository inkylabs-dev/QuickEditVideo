import { test, expect } from '@playwright/test';
import { statSync } from 'fs';

test.describe('Convert to MOV page - E2E', () => {
  test('should load MOV converter page successfully', async ({ page }) => {
    await page.goto('/to-mov');
    
    await expect(page).toHaveTitle(/Convert to MOV - Free Online Video Converter/);
    await expect(page.locator('h1')).toContainText('Convert to MOV');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
  });

  test('should convert video to MOV and download file', async ({ page }) => {
    await page.goto('/to-mov');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    await page.waitForSelector('video', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Download as MOV"):not([disabled])', { timeout: 30000 });
    
    await expect(page.getByTestId('target-format', { hasText: 'MOV' })).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download as MOV")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    expect(download.suggestedFilename()).toMatch(/\.mov$/);
  });
});