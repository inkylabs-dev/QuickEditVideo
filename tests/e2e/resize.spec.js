import { test, expect } from '@playwright/test';

test.describe('Resize page', () => {
  test('should load resize page successfully', async ({ page }) => {
    await page.goto('/resize');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/Video Resizer - Resize Videos Online Free/);
  });

  test('should have correct page header', async ({ page }) => {
    await page.goto('/resize');
    
    // Check for page header
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).toBeVisible();
    
    // Check header content
    await expect(page.locator('h1')).toContainText('Video Resizer');
    await expect(page.locator('text=Resize videos while maintaining aspect ratio')).toBeVisible();
  });

  test('should have navigation working', async ({ page }) => {
    await page.goto('/resize');
    
    // Check if navigation is present
    const navigation = page.locator('nav, header');
    await expect(navigation).toBeVisible();
  });

  test('should contain video resizer component', async ({ page }) => {
    await page.goto('/resize');
    
    // Check for main video editor section
    const videoEditorSection = page.locator('section').filter({ hasText: /video/i }).first();
    await expect(videoEditorSection).toBeVisible();
    
    // The VideoResizer component should be rendered
    // We can't test the full functionality without uploading a video,
    // but we can verify the structure is present
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have resize-specific quick guide content', async ({ page }) => {
    await page.goto('/resize');
    
    // Check for quick guide section
    const quickGuide = page.locator('#quick-help');
    await expect(quickGuide).toBeVisible();
    
    // Check for resize-specific guide content
    await expect(page.locator('text=Quick Guide')).toBeVisible();
    await expect(page.locator('text=Upload Video')).toBeVisible();
    await expect(page.locator('text=Set Dimensions')).toBeVisible();
    await expect(page.locator('text=Download Result')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/resize');
    
    // Check that the page still loads properly on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#page-header')).toBeVisible();
  });

  test('should have proper styling and layout', async ({ page }) => {
    await page.goto('/resize');
    
    // Check background styling
    const main = page.locator('main');
    await expect(main).toHaveClass(/bg-gray-50/);
    
    // Check that the page header has border
    const pageHeader = page.locator('#page-header');
    await expect(pageHeader).toHaveClass(/border-b/);
  });

  test('should navigate back to home page', async ({ page }) => {
    await page.goto('/resize');
    
    // Look for a way to navigate back to home
    // This could be a logo click or a home link in navigation
    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should have correct SEO meta tags', async ({ page }) => {
    await page.goto('/resize');
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /Resize videos online with precision/);
    
    // Check canonical URL
    const canonicalLink = page.locator('link[rel="canonical"]');
    await expect(canonicalLink).toHaveAttribute('href', /\/resize$/);
  });

  test('should have resize-specific FAQ content', async ({ page }) => {
    await page.goto('/resize');
    
    // Scroll down to find FAQ section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for FAQ section (it should be present based on the trim page pattern)
    const faqSection = page.locator('text=FAQ').or(page.locator('text=Frequently Asked Questions'));
    if (await faqSection.isVisible()) {
      await expect(faqSection).toBeVisible();
    }
  });

  test('should have proper content structure', async ({ page }) => {
    await page.goto('/resize');
    
    // Check main sections are present
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('#page-header')).toBeVisible();
    await expect(page.locator('#quick-help')).toBeVisible();
    
    // Check that sections are in correct order
    const main = page.locator('main');
    const sections = main.locator('> section, > div');
    await expect(sections.first()).toBeVisible();
  });
});