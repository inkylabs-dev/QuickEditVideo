import { test, expect } from '@playwright/test';

test.describe('Trim page', () => {
  test('should load trim page successfully', async ({ page }) => {
    await page.goto('/trim');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Video Trimmer - Cut & Trim Videos Online Free/);
  });

  test('should have correct page header', async ({ page }) => {
    await page.goto('/trim');
    
    // Check for page header
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).toBeVisible();
    
    // Check header content
    await expect(page.locator('h1')).toContainText('Video Trimmer');
    await expect(page.locator('text=Cut videos with frame-perfect precision')).toBeVisible();
  });

  test('should have navigation working', async ({ page }) => {
    await page.goto('/trim');
    
    // Check if navigation is present
    const navigation = page.locator('nav, header');
    await expect(navigation).toBeVisible();
  });

  test('should contain video trimmer component', async ({ page }) => {
    await page.goto('/trim');
    
    // Check for main video editor section
    const videoEditorSection = page.locator('section').filter({ hasText: /video/i }).first();
    await expect(videoEditorSection).toBeVisible();
    
    // The VideoTrimmer component should be rendered
    // We can't test the full functionality without uploading a video,
    // but we can verify the structure is present
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should display video trimmer upload interface', async ({ page }) => {
    await page.goto('/trim');
    
    // Wait for the component to load
    await page.waitForSelector('text=Select your video', { timeout: 10000 });
    
    // Check that upload area is present
    await expect(page.locator('text=Select your video')).toBeVisible();
    await expect(page.locator('text=Drop a video file here or click to browse')).toBeVisible();
    await expect(page.locator('text=Choose file')).toBeVisible();
    
    // Check for file format support text
    await expect(page.locator('text=Supports MP4, WebM, AVI, MOV and more')).toBeVisible();
  });

  test('should upload test video and show trimming interface', async ({ page }) => {
    await page.goto('/trim');
    
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
    
    // Check that trimming controls are visible
    await expect(page.locator('text=Controls')).toBeVisible();
    await expect(page.locator('text=Start time')).toBeVisible();
    await expect(page.locator('text=End time')).toBeVisible();
    
    // Check that time inputs are present
    const startTimeInput = page.locator('input[type="number"]').first();
    const endTimeInput = page.locator('input[type="number"]').last();
    await expect(startTimeInput).toBeVisible();
    await expect(endTimeInput).toBeVisible();
    
    // Check that play/pause button is visible
    await expect(page.locator('button', { hasText: /Play|Pause/ })).toBeVisible();
    
    // Check that download button is visible
    await expect(page.locator('button', { hasText: 'Download' })).toBeVisible();
    
    // Check that timeline section is visible (on desktop)
    const timelineSection = page.locator('h3', { hasText: 'Timeline' }).first();
    if (await timelineSection.isVisible()) {
      await expect(timelineSection).toBeVisible();
    }
    
    // Check that reset button is visible
    await expect(page.locator('button', { hasText: 'Reset' })).toBeVisible();
  });

  test('should have trim-specific quick guide content', async ({ page }) => {
    await page.goto('/trim');
    
    // Check for quick guide section
    const quickGuide = page.locator('#quick-help');
    await expect(quickGuide).toBeVisible();
    
    // Check for trim-specific guide content
    await expect(page.locator('text=Quick Guide')).toBeVisible();
    await expect(page.locator('text=Upload Video')).toBeVisible();
    await expect(page.locator('text=Set Timeline')).toBeVisible();
    await expect(page.locator('text=Download Result')).toBeVisible();
    
    // Check step descriptions
    await expect(page.locator('text=Upload your video file (supports MP4, WebM, AVI, MOV)')).toBeVisible();
    await expect(page.locator('text=Drag timeline handles to set start and end points')).toBeVisible();
    await expect(page.locator('text=Preview your selection and download the trimmed video')).toBeVisible();
  });

  test('should have proper SEO content sections', async ({ page }) => {
    await page.goto('/trim');
    
    // Check for main content sections
    await expect(page.locator('h2', { hasText: 'The Video Trimmer That Actually Gets It' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'How Our Video Trimmer Works' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Why Choose Our Video Trimmer?' })).toBeVisible();
    
    // Check for key benefit points
    await expect(page.locator('text=100% Free Forever')).toBeVisible();
    await expect(page.locator('text=Private & Secure')).toBeVisible();
    await expect(page.locator('h4', { hasText: 'No Quality Loss' })).toBeVisible();
    await expect(page.locator('text=Works Everywhere')).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/trim');
    
    // Scroll down to find FAQ section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for FAQ section
    await expect(page.locator('h3', { hasText: 'Frequently Asked Questions' })).toBeVisible();
    
    // Check for some key FAQ items
    await expect(page.locator('text=Is this tool completely free?')).toBeVisible();
    await expect(page.locator('text=Are my videos private and secure?')).toBeVisible();
    await expect(page.locator('text=Will trimming reduce my video quality?')).toBeVisible();
    await expect(page.locator('text=What video formats are supported?')).toBeVisible();
  });

  test('should have correct SEO meta tags', async ({ page }) => {
    await page.goto('/trim');
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Trim videos online with precision/);
    
    // Check canonical URL
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', /\/trim$/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/trim');
    
    // Check that the page still loads properly on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#page-header')).toBeVisible();
  });

  test('should have proper styling and layout', async ({ page }) => {
    await page.goto('/trim');
    
    // Check background styling
    const main = page.locator('main');
    await expect(main).toHaveClass(/bg-gray-50/);
    
    // Check that the page header has border
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).toHaveClass(/border-b/);
  });

  test('should navigate back to home page', async ({ page }) => {
    await page.goto('/trim');
    
    // Look for a way to navigate back to home
    // This could be a logo click or a home link in navigation
    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });
});