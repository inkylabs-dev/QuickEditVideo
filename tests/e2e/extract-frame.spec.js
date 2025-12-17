import { test, expect } from '@playwright/test';

test.describe('Frame Extractor page - E2E', () => {
  test('should load frame extractor page successfully', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Extract Video Frame - Capture Still From Video/);
    
    // Check basic page structure
    await expect(page.locator('h1')).toContainText('Extract Video Frames');
    await expect(page.locator('h3', { hasText: 'Select your video' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Choose file')).toBeVisible();
    await expect(page.locator('text=Supports MP4, WebM, MOV, MKV').first()).toBeVisible();
  });

  test('should transition to extraction interface when video is uploaded', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Wait for the component to load
    await page.waitForSelector('h3:has-text("Select your video")', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Check that extraction interface is displayed
    await expect(page.locator('button:has-text("Extract Frames")')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Single Time' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Time Range' })).toBeVisible();
    await expect(page.locator('text=Frame Format').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'PNG' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'JPG' })).toBeVisible();
  });

  test('should show default values correctly', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Check default single time value
    const timeInput = page.locator('#frame-extractor-single-time');
    await expect(timeInput).toHaveValue('0');
    
    // Switch to range mode
    await page.getByRole('button', { name: 'Time Range' }).click();
    
    // Check default range values
    const startTimeInput = page.locator('#frame-extractor-start-time');
    const endTimeInput = page.locator('#frame-extractor-end-time');
    const intervalInput = page.locator('#frame-extractor-interval');
    await expect(startTimeInput).toHaveValue('0');
    await expect(endTimeInput).toHaveValue('1');
    await expect(intervalInput).toHaveValue('1');
  });

  test('should show interval input in range mode', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Switch to range mode
    await page.getByRole('button', { name: 'Time Range' }).click();
    
    // Should show interval input
    await expect(page.locator('text=Distance between frames (seconds)')).toBeVisible();
    await expect(page.locator('#frame-extractor-interval')).toHaveValue('1');
  });

  test('should have both reset and close buttons', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Check for both buttons
    await expect(page.locator('text=Reset')).toBeVisible();
    await expect(page.locator('[title="Close and select new file"]')).toBeVisible();
  });

  test('should reset extraction parameters when reset button is clicked', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Click reset button
    await page.click('text=Reset');
    
    // Should reset extraction parameters but stay on the same view
    // Check that default values are restored
    const timeInput = page.locator('input[type="number"]').first();
    await expect(timeInput).toHaveValue('0');
  });

  test('should reset to landing view when close button is clicked', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Click close button
    await page.click('[title="Close and select new file"]');
    
    // Should return to landing view
    await expect(page.locator('h3', { hasText: 'Select your video' })).toBeVisible();
    await expect(page.locator('text=Choose file')).toBeVisible();
  });

  test('should validate time inputs correctly', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Switch to range mode
    await page.getByRole('button', { name: 'Time Range' }).click();
    
    // Set invalid range (start > end)
    const startTimeInput = page.locator('#frame-extractor-start-time');
    const endTimeInput = page.locator('#frame-extractor-end-time');
    
    await startTimeInput.fill('0.8');
    await endTimeInput.fill('0.2');
    
    // Listen for alert dialog
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Start time must be less than end time');
      dialog.accept();
    });
    
    // Try to extract frames
    await page.click('button:has-text("Extract Frames")');
  });

  test('should extract single frame successfully', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Set time to 1 second
    const timeInput = page.locator('#frame-extractor-single-time');
    await timeInput.fill('1');
    
    // Click extract frames button
    await page.click('button:has-text("Extract Frames")');
    
    // Wait for processing to complete and frames to appear
    await page.waitForSelector('text=Extracted Frames', { timeout: 30000 });
    
    // Should show extracted frame
    await expect(page.locator('text=Extracted Frames (1)')).toBeVisible();
    
    // Should show frame image and download button
    await expect(page.locator('img[alt*="Frame at"]')).toBeVisible();
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
  });

  test('should extract multiple frames in range successfully', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Switch to range mode
    await page.getByRole('button', { name: 'Time Range' }).click();
    
    // Set range from 0 to 0.8 seconds (should extract 3 frames: 0, 0.4, 0.8)
    const startTimeInput = page.locator('#frame-extractor-start-time');
    const endTimeInput = page.locator('#frame-extractor-end-time');
    const intervalInput = page.locator('#frame-extractor-interval');
    
    await startTimeInput.fill('0');
    await endTimeInput.fill('0.8');
    await intervalInput.fill('0.4');
    
    // Click extract frames button
    await page.click('button:has-text("Extract Frames")');
    
    // Wait for processing to complete and frames to appear
    await page.waitForSelector('text=Extracted Frames', { timeout: 30000 });
    
    // Should show multiple extracted frames
    await expect(page.locator('text=Extracted Frames (3)')).toBeVisible();
    
    // Should show multiple frame images and download buttons
    const frameImages = page.locator('img[alt*="Frame at"]');
    const downloadButtons = page.locator('button:has-text("Download")');
    
    await expect(frameImages).toHaveCount(3);
    await expect(downloadButtons).toHaveCount(4); // includes "Download All" button
  });

  test('should download frame successfully', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Extract frame at 1 second
    const timeInput = page.locator('#frame-extractor-single-time');
    await timeInput.fill('1');
    
    await page.click('button:has-text("Extract Frames")');
    
    // Wait for frame to be extracted
    await page.waitForSelector('text=Extracted Frames', { timeout: 30000 });
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button for the frame
    await page.click('button:has-text("Download")');
    
    // Wait for download to start
    const download = await downloadPromise;
    
    // Verify download properties
    expect(download.suggestedFilename()).toMatch(/frame_1\.00s\.png/);
  });

  test('should support both PNG and JPG formats', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Check that both format options are available
    await expect(page.getByRole('button', { name: 'PNG' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'JPG' })).toBeVisible();
    
    // Select JPG format
    await page.getByRole('button', { name: 'JPG' }).click();
    
    // Extract frame
    await page.click('button:has-text("Extract Frames")');
    
    // Wait for frame to be extracted
    await page.waitForSelector('text=Extracted Frames', { timeout: 30000 });
    
    // Verify filename shows JPG extension
    await expect(page.locator('text=frame_0.00s.jpg')).toBeVisible();
  });

  test('should reject non-video files', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Wait for component to load
    await page.waitForSelector('h3:has-text("Select your video")', { timeout: 10000 });
    
    // Listen for alert dialog
    page.on('dialog', dialog => {
      expect(dialog.message()).toBe('Please select a valid video file (MP4, MOV, WebM, MKV).');
      dialog.accept();
    });
    
    // Try to upload a non-video file (use a text file)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/sample.txt');
    
    // Should remain on landing view
    await expect(page.locator('h3', { hasText: 'Select your video' })).toBeVisible();
  });

  test('should show progress during extraction', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('h3:has-text("Extract Frames")', { timeout: 20000 });
    
    // Click extract frames button
    await page.click('button:has-text("Extract Frames")');
    
    // Should show extracting state
    await expect(page.locator('text=Extracting...')).toBeVisible({ timeout: 5000 });
    
    // Button should be disabled during processing
    await expect(page.locator('button:has-text("Extracting...")[disabled]')).toBeVisible();
  });
});
