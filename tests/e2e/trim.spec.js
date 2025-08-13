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