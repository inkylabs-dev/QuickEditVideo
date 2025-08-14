import { test, expect } from '@playwright/test';

test.describe('Merge page', () => {
  test('should load merge page successfully', async ({ page }) => {
    await page.goto('/merge');
    
    // Check that page loads
    await expect(page).toHaveTitle(/Video Merger/);
    
    // Check main heading
    await expect(page.locator('h1')).toHaveText('Video Merger');
  });

  test('should have navigation working', async ({ page }) => {
    await page.goto('/merge');
    
    // Check that navigation logo links to home
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test('should display video merger component', async ({ page }) => {
    await page.goto('/merge');
    
    // Check for the main upload area
    await expect(page.locator('text=Select your videos')).toBeVisible();
    await expect(page.locator('text=Drop multiple video files here or click to browse')).toBeVisible();
    await expect(page.locator('text=Choose files')).toBeVisible();
  });

  test('should show quick guide section', async ({ page }) => {
    await page.goto('/merge');
    
    // Check for Quick Guide section
    await expect(page.locator('h3', { hasText: 'Quick Guide' })).toBeVisible();
    
    // Check guide steps
    await expect(page.locator('h4', { hasText: 'Upload Videos' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Arrange Order' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Set Duration' })).toBeVisible();
    await expect(page.locator('h4', { hasText: 'Download Result' })).toBeVisible();
  });

  test('should have merge tool in tools dropdown', async ({ page }) => {
    await page.goto('/merge');
    
    // Click Tools dropdown
    await page.click('button:has-text("Tools")');
    
    // Check that merge tool is listed in Video Editing section
    await expect(page.locator('text=Video Editing')).toBeVisible();
    await expect(page.locator('a[href="/merge"]')).toBeVisible();
    await expect(page.locator('text=Merger')).toBeVisible();
    await expect(page.locator('text=Join videos')).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/merge');
    
    // Check for FAQ section
    await expect(page.locator('h3', { hasText: 'Frequently Asked Questions' })).toBeVisible();
    
    // Check some FAQ items
    await expect(page.locator('text=How many videos can I merge at once?')).toBeVisible();
    await expect(page.locator('text=What happens if my videos have different resolutions?')).toBeVisible();
    await expect(page.locator('text=Can I loop shorter videos to match longer ones?')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/merge');
    
    // Check that page loads and main elements are visible
    await expect(page.locator('h1')).toHaveText('Video Merger');
    await expect(page.locator('text=Select your videos')).toBeVisible();
  });

  test('should have proper SEO content sections', async ({ page }) => {
    await page.goto('/merge');
    
    // Check SEO content sections
    await expect(page.locator('h2', { hasText: 'The Video Merger That Makes Sense' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'How Our Video Merger Works' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Why Choose Our Video Merger?' })).toBeVisible();
    
    // Check some feature highlights
    await expect(page.locator('text=Multi-File Upload')).toBeVisible();
    await expect(page.locator('text=Drag & Drop Ordering')).toBeVisible();
    await expect(page.locator('text=Custom Duration Control')).toBeVisible();
    await expect(page.locator('text=Seamless Preview')).toBeVisible();
  });

  test('should have working file upload interaction', async ({ page }) => {
    await page.goto('/merge');
    
    // Check that file input exists (though hidden)
    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs.first()).toBeAttached();
    
    // Check that upload area is clickable
    await expect(page.locator('text=Choose files')).toBeVisible();
  });

  test('should have proper meta information', async ({ page }) => {
    await page.goto('/merge');
    
    // Check title
    await expect(page).toHaveTitle('Video Merger - Merge Multiple Videos Online Free | QuickEditVideo');
    
    // Check meta description exists
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Merge multiple videos into one online!/);
  });

  test('should hide page header when switching to editing view', async ({ page }) => {
    await page.goto('/merge');
    
    // Initially header should be visible
    await expect(page.locator('#page-header')).toBeVisible();
    
    // Note: We can't easily test the header hiding without actual file upload
    // due to FFmpeg loading requirements in the test environment
  });

  test('should show proper format support information', async ({ page }) => {
    await page.goto('/merge');
    
    // Check format support text
    await expect(page.locator('text=Supports MP4, WebM, AVI, MOV and more')).toBeVisible();
    
    // Check multiple upload indication  
    await expect(page.locator('p', { hasText: 'Drop multiple video files here' })).toBeVisible();
  });
});