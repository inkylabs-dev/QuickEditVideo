import { test, expect } from '@playwright/test';
import { statSync } from 'fs';

test.describe('Convert to MP4 page - E2E', () => {
  test('should load MP4 converter page successfully', async ({ page }) => {
    await page.goto('/to-mp4');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Convert to MP4 - Free Online Video Converter/);
    
    // Check basic page structure
    await expect(page.locator('h1')).toContainText('Convert to MP4');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
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
    
    // Check that conversion interface is displayed
    await expect(page.getByTestId('converting-to-label')).toBeVisible();
    await expect(page.getByTestId('target-format', { hasText: 'MP4' })).toBeVisible();
    
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
});