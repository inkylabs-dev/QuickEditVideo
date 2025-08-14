import { test, expect } from '@playwright/test';
import { statSync } from 'fs';

test.describe('Resize page - E2E', () => {
  test('should load resize page successfully', async ({ page }) => {
    await page.goto('/resize');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Video Resizer - Resize Videos Online Free/);
    
    // Check basic page structure
    await expect(page.locator('h1')).toContainText('Video Resizer');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
  });

  test('should resize video and download file', async ({ page }) => {
    await page.goto('/resize');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for FFmpeg to load (indicated by download button being enabled)
    await page.waitForSelector('button:has-text("Download"):not([disabled])', { timeout: 30000 });
    
    // Check that resizing interface is displayed
    await expect(page.locator('text=Resize Controls')).toBeVisible();
    
    // Set scale to 50% using the scale slider
    const scaleSlider = page.locator('input[type="range"]');
    await scaleSlider.fill('50');
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.click('button:has-text("Download")');
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Save the downloaded file to get its size
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Check that the file exists and has size > 0
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // Verify filename contains "resized"
    expect(download.suggestedFilename()).toContain('resized');
  });
});