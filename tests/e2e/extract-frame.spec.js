import { test, expect } from '@playwright/test';

test.describe('Frame Extractor page - E2E', () => {
  test('should load frame extractor page successfully', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Frame Extractor - Extract Frames from Video Online Free/);
    
    // Check basic page structure
    await expect(page.locator('h1')).toContainText('Frame Extractor');
    await expect(page.locator('text=Select your video')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Choose file')).toBeVisible();
    await expect(page.locator('text=Supports MP4, WebM, AVI, MOV and more')).toBeVisible();
  });

  test('should show FFmpeg loading message initially', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Should show loading message when FFmpeg is not yet loaded
    await expect(page.locator('text=Loading video processing engine...')).toBeVisible();
  });

  test('should transition to extraction interface when video is uploaded', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Check that extraction interface is displayed
    await expect(page.locator('text=Extract Frames')).toBeVisible();
    await expect(page.locator('text=Extraction Mode')).toBeVisible();
    await expect(page.locator('text=Single Time')).toBeVisible();
    await expect(page.locator('text=Time Range')).toBeVisible();
    await expect(page.locator('text=Frame Format')).toBeVisible();
    await expect(page.locator('text=PNG')).toBeVisible();
    await expect(page.locator('text=JPG')).toBeVisible();
  });

  test('should show default values correctly', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    
    // Check default single time value
    const timeInput = page.locator('input[type="number"]').first();
    await expect(timeInput).toHaveValue('0');
    
    // Switch to range mode
    await page.click('text=Time Range');
    
    // Check default range values
    const startTimeInput = page.locator('input[placeholder="0"]');
    const endTimeInput = page.locator('input[placeholder="1"]');
    await expect(startTimeInput).toHaveValue('0');
    await expect(endTimeInput).toHaveValue('1');
  });

  test('should not show interval input in range mode', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    
    // Switch to range mode
    await page.click('text=Time Range');
    
    // Should not show interval input
    await expect(page.locator('text=Interval')).not.toBeVisible();
    
    // Should show explanation instead
    await expect(page.locator('text=Frames will be extracted every 1 second in the specified range')).toBeVisible();
  });

  test('should have both reset and close buttons', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    
    // Check for both buttons
    await expect(page.locator('text=Reset')).toBeVisible();
    await expect(page.locator('[title="Close"]')).toBeVisible();
  });

  test('should reset to landing view when reset button is clicked', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    
    // Click reset button
    await page.click('text=Reset');
    
    // Should return to landing view
    await expect(page.locator('text=Select your video')).toBeVisible();
    await expect(page.locator('text=Choose file')).toBeVisible();
  });

  test('should reset to landing view when close button is clicked', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    
    // Click close button
    await page.click('[title="Close"]');
    
    // Should return to landing view
    await expect(page.locator('text=Select your video')).toBeVisible();
    await expect(page.locator('text=Choose file')).toBeVisible();
  });

  test('should validate time inputs correctly', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    
    // Switch to range mode
    await page.click('text=Time Range');
    
    // Set invalid range (start > end)
    const startTimeInput = page.locator('input[placeholder="0"]');
    const endTimeInput = page.locator('input[placeholder="1"]');
    
    await startTimeInput.fill('5');
    await endTimeInput.fill('3');
    
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
    
    // Wait for interface to load and FFmpeg to be ready
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Extract Frames"):not([disabled])', { timeout: 30000 });
    
    // Set time to 1 second
    const timeInput = page.locator('input[type="number"]').first();
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
    
    // Wait for interface to load and FFmpeg to be ready
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Extract Frames"):not([disabled])', { timeout: 30000 });
    
    // Switch to range mode
    await page.click('text=Time Range');
    
    // Set range from 0 to 2 seconds (should extract 3 frames: 0, 1, 2)
    const startTimeInput = page.locator('input[placeholder="0"]');
    const endTimeInput = page.locator('input[placeholder="1"]');
    
    await startTimeInput.fill('0');
    await endTimeInput.fill('2');
    
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
    await expect(downloadButtons).toHaveCount(3);
  });

  test('should download frame successfully', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load and FFmpeg to be ready
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Extract Frames"):not([disabled])', { timeout: 30000 });
    
    // Extract frame at 1 second
    const timeInput = page.locator('input[type="number"]').first();
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
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    
    // Check that both format options are available
    await expect(page.locator('text=PNG')).toBeVisible();
    await expect(page.locator('text=JPG')).toBeVisible();
    
    // Select JPG format
    await page.click('text=JPG');
    
    // Wait for FFmpeg to be ready
    await page.waitForSelector('button:has-text("Extract Frames"):not([disabled])', { timeout: 30000 });
    
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
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Listen for alert dialog
    page.on('dialog', dialog => {
      expect(dialog.message()).toBe('Please select a valid video file.');
      dialog.accept();
    });
    
    // Try to upload a non-video file (use a text file)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/sample.txt');
    
    // Should remain on landing view
    await expect(page.locator('text=Select your video')).toBeVisible();
  });

  test('should show progress during extraction', async ({ page }) => {
    await page.goto('/extract-frame');
    
    // Upload test video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for interface to load and FFmpeg to be ready
    await page.waitForSelector('text=Extract Frames', { timeout: 15000 });
    await page.waitForSelector('button:has-text("Extract Frames"):not([disabled])', { timeout: 30000 });
    
    // Click extract frames button
    await page.click('button:has-text("Extract Frames")');
    
    // Should show extracting state
    await expect(page.locator('text=Extracting...')).toBeVisible({ timeout: 5000 });
    
    // Button should be disabled during processing
    await expect(page.locator('button:has-text("Extracting...")[disabled]')).toBeVisible();
  });
});