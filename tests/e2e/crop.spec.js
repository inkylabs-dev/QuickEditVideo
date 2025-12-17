import { test, expect } from '@playwright/test';
import { statSync } from 'fs';

test.describe('Crop page - E2E', () => {
  test('should load crop page successfully', async ({ page }) => {
    await page.goto('/crop');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Video Cropper - Crop Videos Online Free/);
    
    // Check basic page structure
    await expect(page.locator('h1')).toContainText('Video Cropper');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
  });

  test('should crop video and download file', async ({ page }) => {
    await page.goto('/crop');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for download button to be enabled
    await page.waitForSelector('button:has-text(\"Download MP4\"):not([disabled])', { timeout: 30000 });
    
    // Check that cropping interface is displayed
    await expect(page.locator('h4:has-text("Set Crop Area")')).toBeVisible();
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.click('button:has-text("Download MP4")');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Save the downloaded file to get its size
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Check that the file exists and has size > 0
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // Verify filename contains "cropped"
    expect(download.suggestedFilename()).toContain('cropped');
  });
});
