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
    
    // Conversion interface should be displayed
    await expect(page.getByTestId('converting-to-label')).toBeVisible();
    await expect(page.getByTestId('target-format', { hasText: 'AVI' })).toBeVisible();

    const downloadButton = page.getByRole('button', { name: 'Download as AVI' });
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled({ timeout: 60000 });
    
    const downloadPromise = page.waitForEvent('download');
    await downloadButton.click();
    
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    expect(download.suggestedFilename()).toMatch(/\.avi$/);
  });
});
