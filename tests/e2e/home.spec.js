import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/QuickEditVideo - Free Online Video Editor/);
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('Edit Faster, Ready in Minutes');
    await expect(page.locator('h1')).toContainText('QuickEditVideo.com');
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main logo/brand is present
    const navigation = page.locator('nav, header');
    await expect(navigation).toBeVisible();
  });

  test('should have Start editing button that links to trim page', async ({ page }) => {
    await page.goto('/');
    
    // Find the "Start editing" button
    const startEditingButton = page.locator('a', { hasText: 'Start editing' });
    await expect(startEditingButton).toBeVisible();
    await expect(startEditingButton).toHaveAttribute('href', '/trim');
    
    // Click the button and verify navigation
    await startEditingButton.click();
    await expect(page).toHaveURL('/trim');
  });

  test('should have hero section with description', async ({ page }) => {
    await page.goto('/');
    
    // Check for description text
    await expect(page.locator('text=Trim, convert, and compress videos instantly')).toBeVisible();
    await expect(page.locator('text=No downloads, no accounts')).toBeVisible();
    await expect(page.locator('text=Your files never leave your device')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that the page still loads properly on mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('a', { hasText: 'Start editing' })).toBeVisible();
  });
});