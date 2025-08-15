import { test, expect } from '@playwright/test';
import { statSync } from 'fs';

test.describe('Convert to GIF page - E2E', () => {
  test('should load GIF converter page successfully', async ({ page }) => {
    await page.goto('/to-gif');
    
    await expect(page).toHaveTitle(/Convert to GIF - Free Online Video to GIF Converter/);
    await expect(page.locator('h1')).toContainText('Convert to GIF');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
  });

  test('should convert video to GIF and download file', async ({ page }) => {
    await page.goto('/to-gif');
    
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    await page.waitForSelector('video', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Download as GIF"):not([disabled])', { timeout: 30000 });
    
    // Check that conversion interface is displayed
    await expect(page.getByTestId('converting-to-label')).toBeVisible();
    await expect(page.getByTestId('target-format', { hasText: 'GIF' })).toBeVisible();
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download as GIF")');
    
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    expect(download.suggestedFilename()).toMatch(/\.gif$/);
  });
});