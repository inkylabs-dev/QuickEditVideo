import { test, expect } from '@playwright/test';
import { statSync } from 'fs';

test.describe('Trim page - E2E', () => {
  test('should load trim page successfully', async ({ page }) => {
    await page.goto('/trim');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Trim MP4 Online Free.*QuickEditVideo/);
    
    // Check basic page structure
    await expect(page.locator('h1')).toContainText('Trim Video');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
  });

  test('should trim video and download file', async ({ page }) => {
    await page.goto('/trim');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for the download button to be enabled
    await page.waitForSelector('button:has-text("Download"):not([disabled])', { timeout: 30000 });
    
    // Check that trimming interface is displayed
    await expect(page.locator('text=Controls')).toBeVisible();
    await expect(page.locator('text=Start time')).toBeVisible();
    await expect(page.locator('text=End time')).toBeVisible();
    
    // Set start time to 1 second
    const startTimeInput = page.locator('input[type="number"]').first();
    await startTimeInput.fill('1');
    
    // Set end time to 3 seconds  
    const endTimeInput = page.locator('input[type="number"]').last();
    await endTimeInput.fill('3');
    
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
    
    // Verify filename contains "trimmed"
    expect(download.suggestedFilename()).toContain('trimmed');
  });
});
