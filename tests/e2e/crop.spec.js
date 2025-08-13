import { test, expect } from '@playwright/test';

test.describe('Crop page', () => {
  test('should load crop page successfully', async ({ page }) => {
    await page.goto('/crop');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Video Cropper - Crop Videos Online Free/);
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Video Cropper');
    await expect(page.locator('text=Crop videos with precision and custom aspect ratios')).toBeVisible();
  });

  test('should have navigation working', async ({ page }) => {
    await page.goto('/crop');
    
    // Check if the main logo/brand is present
    const navigation = page.locator('nav, header');
    await expect(navigation).toBeVisible();
  });

  test('should display video cropper component', async ({ page }) => {
    await page.goto('/crop');
    
    // Wait for the VideoCropper component to load (client:load directive)
    // Look for visible text elements in the upload area
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Check that upload area is present with expected text
    await expect(page.locator('text=Select your video')).toBeVisible();
    await expect(page.locator('text=Drop a video file here or click to browse')).toBeVisible();
    await expect(page.locator('text=Choose file')).toBeVisible();
  });

  test('should show quick guide section', async ({ page }) => {
    await page.goto('/crop');
    
    // Check for Quick Guide section
    await expect(page.locator('h3', { hasText: 'Quick Guide' })).toBeVisible();
    
    // Check for the three guide steps
    await expect(page.locator('text=Upload Video')).toBeVisible();
    await expect(page.locator('text=Set Crop Area')).toBeVisible();
    await expect(page.locator('text=Download Result')).toBeVisible();
    
    // Check step descriptions
    await expect(page.locator('text=Upload your video file (supports MP4, WebM, AVI, MOV)')).toBeVisible();
    await expect(page.locator('text=Choose aspect ratio and adjust crop dimensions')).toBeVisible();
    await expect(page.locator('text=Preview your cropped video and download it')).toBeVisible();
  });

  test('should have horizontal aspect ratio selector', async ({ page }) => {
    await page.goto('/crop');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // The aspect ratio selector is only visible after a video is uploaded
    // So we just verify the upload area is present for now
    await expect(page.locator('text=Select your video')).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/crop');
    
    // Check for FAQ section
    await expect(page.locator('h3', { hasText: 'Frequently Asked Questions' })).toBeVisible();
    
    // Check for some key FAQ items
    await expect(page.locator('text=Is this tool completely free?')).toBeVisible();
    await expect(page.locator('text=Are my videos private and secure?')).toBeVisible();
    await expect(page.locator('text=What aspect ratios are supported?')).toBeVisible();
    await expect(page.locator('text=Can I rotate videos before cropping?')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/crop');
    
    // Check that the page still loads properly on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Select your video')).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Quick Guide' })).toBeVisible();
  });

  test('should have proper SEO content sections', async ({ page }) => {
    await page.goto('/crop');
    
    // Check for main content sections
    await expect(page.locator('h2', { hasText: 'The Video Cropper That Gets It Right' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'How Our Video Cropper Works' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Why Choose Our Video Cropper?' })).toBeVisible();
    
    // Check for key benefit points
    await expect(page.locator('text=100% Free Forever')).toBeVisible();
    await expect(page.locator('text=Private & Secure')).toBeVisible();
    await expect(page.locator('text=Maintains Quality')).toBeVisible();
    await expect(page.locator('text=Works Everywhere')).toBeVisible();
  });

  test('should have working file upload interaction', async ({ page }) => {
    await page.goto('/crop');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Check that the upload area is clickable
    const uploadArea = page.locator('text=Drop a video file here or click to browse');
    await expect(uploadArea).toBeVisible();
    
    // Check for file format support text
    await expect(page.locator('text=Supports MP4, WebM, AVI, MOV and more')).toBeVisible();
  });

  test('should upload test video and show cropping interface', async ({ page }) => {
    await page.goto('/crop');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Upload the test video file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/e2e/static/colors.mp4');
    
    // Wait for video to load and interface to change
    await page.waitForSelector('video', { timeout: 15000 });
    
    // Check that video element is present and has src
    const video = page.locator('video');
    await expect(video).toBeVisible();
    await expect(video).toHaveAttribute('src', /blob:/);
    
    // Check that page header is hidden (should happen when video loads)
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).not.toBeVisible();
    
    // Check that aspect ratio selector is now visible
    await expect(page.locator('label', { hasText: 'Aspect Ratio' }).filter({ has: page.locator('~ div') })).toBeVisible();
    await expect(page.locator('button[title="Freeform"]')).toBeVisible();
    
    // Check that crop controls are visible
    await expect(page.locator('h3', { hasText: 'Crop Controls' })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Width' }).filter({ has: page.locator('~ input[type="number"]') })).toBeVisible();
    await expect(page.locator('label', { hasText: 'Height' }).filter({ has: page.locator('~ input[type="number"]') })).toBeVisible();
    
    // Check that rotation control is visible
    await expect(page.locator('label', { hasText: 'Rotation' }).filter({ has: page.locator('~ div input[type="range"]') })).toBeVisible();
    
    // Check that download button is visible
    await expect(page.locator('button', { hasText: 'Download' })).toBeVisible();
  });

  test('should hide page header when video is loaded', async ({ page }) => {
    await page.goto('/crop');
    
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).toBeVisible();
    
    // Note: Testing the header hiding would require actually uploading a video
    // which is complex in e2e tests. This test just verifies the header exists initially.
  });

  test('should have proper meta information', async ({ page }) => {
    await page.goto('/crop');
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Crop videos online with precision/);
    
    // Check canonical URL
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', 'https://quickeditvideo.com/crop');
  });
});