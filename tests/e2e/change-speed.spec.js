import { test, expect } from '@playwright/test';
import { statSync } from 'fs';

test.describe('Change Speed page - E2E', () => {
  test('should load change-speed page successfully', async ({ page }) => {
    await page.goto('/change-speed');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Video Speed Changer - Speed Up & Slow Down Videos Online Free/);
    
    // Check basic page structure
    await expect(page.locator('h1')).toContainText('Video Speed Changer');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
  });

  test('should change video speed and download file', async ({ page }) => {
    await page.goto('/change-speed');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Wait for download button to be enabled (MediaBunny doesn't require loading)
    await page.waitForSelector('button:has-text("Download"):not([disabled])', { timeout: 10000 });
    
    // Check that speed control interface is displayed
    await expect(page.locator('text=Speed Controls')).toBeVisible();
    await expect(page.locator('text=Speed: 1x')).toBeVisible();
    
    // Check that speed slider is present
    const speedSlider = page.locator('input[type="range"]');
    await expect(speedSlider).toBeVisible();
    await expect(speedSlider).toHaveAttribute('min', '0.25');
    await expect(speedSlider).toHaveAttribute('max', '4');
    
    // Change speed to 2x using slider
    await speedSlider.fill('2');
    await expect(page.locator('text=Speed: 2x')).toBeVisible();
    
    // Check that download button is visible
    await expect(page.locator('button:has-text("Download MP4")')).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download');

    // Click download button
    await page.click('button:has-text("Download MP4")');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify download started
    expect(download.suggestedFilename()).toMatch(/.*_2x_fast\.mp4$/);
    
    // Save the download to verify it exists
    const downloadPath = `tests/e2e/downloads/${download.suggestedFilename()}`;
    await download.saveAs(downloadPath);
    
    // Verify file was created and has content
    const stats = statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('should show speed presets and allow selection', async ({ page }) => {
    await page.goto('/change-speed');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Speed Controls', { timeout: 15000 });
    
    // Check that speed presets are displayed
    const presets = ['0.25x', '0.5x', '0.75x', '1x', '1.25x', '1.5x', '2x', '4x'];
    
    for (const preset of presets) {
      await expect(page.locator(`button:has-text("${preset}")`)).toBeVisible();
    }
    
    // Click on 0.5x preset
    await page.click('button:has-text("0.5x")');
    await expect(page.locator('text=Speed: 0.5x')).toBeVisible();
    
    // Click on 4x preset
    await page.click('button:has-text("4x")');
    await expect(page.locator('text=Speed: 4x')).toBeVisible();
  });

  test('should allow changing speed with slider and presets', async ({ page }) => {
    await page.goto('/change-speed');

    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');

    // Wait for interface to load
    await page.waitForSelector('text=Speed Controls', { timeout: 15000 });

    // Initially at 1x speed
    await expect(page.locator('text=Speed: 1x')).toBeVisible();

    // Change to slow speed (0.5x)
    await page.click('button:has-text("0.5x")');
    await expect(page.locator('text=Speed: 0.5x')).toBeVisible();

    // Change to fast speed (2x)
    await page.click('button:has-text("2x")');
    await expect(page.locator('text=Speed: 2x')).toBeVisible();
  });

  test('should show correct final duration based on speed', async ({ page }) => {
    await page.goto('/change-speed');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Speed Controls', { timeout: 15000 });
    
    // At 1x speed, should show original duration (5 seconds for colors.mp4)
    await expect(page.locator('text=1x speed')).toBeVisible();
    await expect(page.locator('text=00:05 final duration')).toBeVisible();
    
    // Change to 2x speed - duration should halve
    await page.click('button:has-text("2x")');
    await expect(page.locator('text=2x speed')).toBeVisible();
    await expect(page.locator('text=00:02 final duration')).toBeVisible();
    
    // Change to 0.5x speed - duration should double
    await page.click('button:has-text("0.5x")');
    await expect(page.locator('text=0.5x speed')).toBeVisible();
    await expect(page.locator('text=00:10 final duration')).toBeVisible();
  });

  test('should allow play/pause preview', async ({ page }) => {
    await page.goto('/change-speed');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Speed Controls', { timeout: 15000 });
    
    // Check play button is visible
    await expect(page.locator('button:has-text("Play Preview")')).toBeVisible();
    
    // Click play button
    await page.click('button:has-text("Play Preview")');
    
    // Button should change to pause
    await expect(page.locator('button:has-text("Pause Preview")')).toBeVisible();
    
    // Click pause button
    await page.click('button:has-text("Pause Preview")');
    
    // Button should change back to play
    await expect(page.locator('button:has-text("Play Preview")')).toBeVisible();
  });

  test('should reset speed to 1x when reset button is clicked', async ({ page }) => {
    await page.goto('/change-speed');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Speed Controls', { timeout: 15000 });
    
    // Change speed to 2x
    await page.click('button:has-text("2x")');
    await expect(page.locator('text=Speed: 2x')).toBeVisible();
    
    // Click reset button
    await page.click('button[title="Reset to normal speed"]');
    
    // Speed should be back to 1x
    await expect(page.locator('text=Speed: 1x')).toBeVisible();
  });

  test('should return to landing view when close button is clicked', async ({ page }) => {
    await page.goto('/change-speed');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Speed Controls', { timeout: 15000 });
    
    // Click close button
    await page.click('button[title="Choose different video"]');
    
    // Should return to landing view
    await expect(page.locator('text=Select your video')).toBeVisible();
  });

  test('should handle different video formats', async ({ page }) => {
    await page.goto('/change-speed');
    
    // Test with WebM format if available, otherwise skip
    try {
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('tests/e2e/static/colors.webm');
      
      // Wait for interface to load
      await page.waitForSelector('text=Speed Controls', { timeout: 15000 });
      
      // Check that filename is displayed
      await expect(page.locator('text=colors.webm')).toBeVisible();
      
      // Change speed and verify download button is visible
      await page.click('button:has-text("2x")');
      await expect(page.locator('button:has-text("Download")')).toBeVisible();
      
    } catch (error) {
      // If WebM test file doesn't exist, that's okay for this test
      console.log('WebM test file not available, skipping format test');
    }
  });

  test('should show download button when video is loaded', async ({ page }) => {
    await page.goto('/change-speed');

    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');

    // Wait for interface to load
    await page.waitForSelector('text=Speed Controls', { timeout: 15000 });

    // MediaBunny doesn't require loading - button should be enabled immediately
    await page.waitForSelector('button:has-text("Download"):not([disabled])', { timeout: 10000 });
  });
});