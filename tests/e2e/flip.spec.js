import { test, expect } from '@playwright/test';
import { statSync } from 'fs';

test.describe('Flip page - E2E', () => {
  test('should load flip page successfully', async ({ page }) => {
    await page.goto('/flip');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Video Flipper - Flip Videos Horizontally & Vertically/);
    
    // Check basic page structure
    await expect(page.locator('h1')).toContainText('Video Flipper');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
    
    // Check that help section is visible
    await expect(page.locator('text=Quick Guide')).toBeVisible();
    await expect(page.locator('text=Choose Direction')).toBeVisible();
    await expect(page.locator('text=Process and download your flipped video')).toBeVisible();
  });

  test('should show flip interface when video is uploaded', async ({ page }) => {
    await page.goto('/flip');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Check that flipping interface is displayed
    await expect(page.locator('text=Flip Controls')).toBeVisible();
    await expect(page.locator('span:has-text("Horizontal")')).toBeVisible();
    await expect(page.locator('span:has-text("Vertical")')).toBeVisible();
    await expect(page.locator('input[value="horizontal"]')).toBeChecked();
    
    // Check video info displays flip direction
    await expect(page.locator('text=Horizontal Flip')).toBeVisible();
  });

  test('should switch between horizontal and vertical flip options', async ({ page }) => {
    await page.goto('/flip');
    
    // Upload video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Flip Controls', { timeout: 15000 });
    
    // Verify horizontal is selected by default
    await expect(page.locator('input[value="horizontal"]')).toBeChecked();
    await expect(page.locator('input[value="vertical"]')).not.toBeChecked();
    await expect(page.locator('text=Horizontal Flip')).toBeVisible();
    
    // Click vertical radio button
    await page.click('input[value="vertical"]');
    
    // Verify vertical is now selected
    await expect(page.locator('input[value="vertical"]')).toBeChecked();
    await expect(page.locator('input[value="horizontal"]')).not.toBeChecked();
    await expect(page.locator('text=Vertical Flip')).toBeVisible();
    
    // Click horizontal radio button again
    await page.click('input[value="horizontal"]');
    
    // Verify horizontal is selected again
    await expect(page.locator('input[value="horizontal"]')).toBeChecked();
    await expect(page.locator('input[value="vertical"]')).not.toBeChecked();
    await expect(page.locator('text=Horizontal Flip')).toBeVisible();
  });

  test('should flip video horizontally and download file', async ({ page }) => {
    await page.goto('/flip');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for FFmpeg to load (indicated by flip button being enabled)
    await page.waitForSelector('button:has-text("Flip Video"):not([disabled])', { timeout: 30000 });
    
    // Ensure horizontal flip is selected (should be default)
    await expect(page.locator('input[value="horizontal"]')).toBeChecked();
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click flip button
    await page.click('button:has-text("Flip Video")');
    
    // Should show processing state
    await expect(page.locator('text=Processing')).toBeVisible({ timeout: 5000 });
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Check download filename contains "flipped"
    expect(download.suggestedFilename()).toMatch(/.*_flipped\.(mp4|avi|mov|webm|mkv)$/);
    
    // Save the downloaded file to get its size
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Check that the file exists and has size > 0
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    
    // File should be larger than 1KB to ensure it's not empty
    expect(stats.size).toBeGreaterThan(1024);
  });

  test('should flip video vertically and download file', async ({ page }) => {
    await page.goto('/flip');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for FFmpeg to load (indicated by flip button being enabled)
    await page.waitForSelector('button:has-text("Flip Video"):not([disabled])', { timeout: 30000 });
    
    // Select vertical flip
    await page.click('input[value="vertical"]');
    await expect(page.locator('input[value="vertical"]')).toBeChecked();
    await expect(page.locator('text=Vertical Flip')).toBeVisible();
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click flip button
    await page.click('button:has-text("Flip Video")');
    
    // Should show processing state
    await expect(page.locator('text=Processing')).toBeVisible({ timeout: 5000 });
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Check download filename
    expect(download.suggestedFilename()).toMatch(/.*_flipped\.(mp4|avi|mov|webm|mkv)$/);
    
    // Save the downloaded file to get its size
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    
    // Check that the file exists and has size > 0
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.size).toBeGreaterThan(1024);
  });

  test('should return to landing view when close button is clicked', async ({ page }) => {
    await page.goto('/flip');
    
    // Upload video to enter flip interface
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for flip interface to load
    await page.waitForSelector('text=Flip Controls', { timeout: 15000 });
    await expect(page.locator('text=Select your video')).not.toBeVisible();
    
    // Click the close button
    await page.click('button[title="Choose different video"]');
    
    // Should return to landing view
    await expect(page.locator('text=Select your video')).toBeVisible();
    await expect(page.locator('text=Flip Controls')).not.toBeVisible();
  });

  test('should show FFmpeg loading state', async ({ page }) => {
    await page.goto('/flip');
    
    // Upload video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Flip Controls', { timeout: 15000 });
    
    // Initially should show loading state
    await expect(page.locator('text=Loading...')).toBeVisible();
    
    // Eventually should show the flip button when FFmpeg loads
    await expect(page.locator('button:has-text("Flip Video")')).toBeVisible({ timeout: 30000 });
  });

  test('should have proper video preview with CSS transform', async ({ page }) => {
    await page.goto('/flip');
    
    // Upload video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Check horizontal flip CSS transform (default)
    const video = page.locator('video');
    const transform = await video.evaluate(el => window.getComputedStyle(el).transform);
    expect(transform).toContain('scaleX(-1)');
    
    // Switch to vertical and check transform
    await page.click('input[value="vertical"]');
    await page.waitForTimeout(100); // Small delay for state update
    
    const verticalTransform = await video.evaluate(el => window.getComputedStyle(el).transform);
    expect(verticalTransform).toContain('scaleY(-1)');
  });

  test('should handle different video formats', async ({ page }) => {
    await page.goto('/flip');
    
    // Test with different video file if available
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Flip Controls', { timeout: 15000 });
    
    // Should work regardless of input format
    await expect(page.locator('button').filter({ hasText: 'Flip Video' })).toBeVisible({ timeout: 30000 });
    
    // File info should show original filename
    await expect(page.locator('text=colors.mp4')).toBeVisible();
  });
});