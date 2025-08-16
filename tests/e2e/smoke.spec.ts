import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Basic checks to ensure the site is working
    await expect(page).toHaveTitle(/QuickEditVideo/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load trim page', async ({ page }) => {
    await page.goto('/trim');
    
    // Should load without errors
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('Select your video')).toBeVisible();
  });

  test('should load merge page', async ({ page }) => {
    await page.goto('/merge');
    
    // Should load without errors
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('Select your videos')).toBeVisible();
  });

  test('should load resize page', async ({ page }) => {
    await page.goto('/resize');
    
    // Should load without errors
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('Select your video')).toBeVisible();
  });
});