import { test, expect } from '@playwright/test';

test.describe('Basic Application Functionality', () => {
  test('homepage should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await expect(page.locator('body')).toBeVisible();
    
    // Check for basic content
    await expect(page.getByText('Quick', { exact: false })).toBeVisible();
  });

  test('trim page should display basic elements', async ({ page }) => {
    await page.goto('/trim');
    
    // Wait for the page to load
    await expect(page.locator('body')).toBeVisible();
    
    // Should have a heading
    await expect(page.locator('h1')).toBeVisible();
    
    // Should have file upload interface
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });

  test('merge page should display basic elements', async ({ page }) => {
    await page.goto('/merge');
    
    // Wait for the page to load
    await expect(page.locator('body')).toBeVisible();
    
    // Should have a heading
    await expect(page.locator('h1')).toBeVisible();
    
    // Should have file upload interface with multiple attribute
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    await expect(fileInput).toHaveAttribute('multiple');
  });

  test('resize page should display basic elements', async ({ page }) => {
    await page.goto('/resize');
    
    // Wait for the page to load
    await expect(page.locator('body')).toBeVisible();
    
    // Should have a heading
    await expect(page.locator('h1')).toBeVisible();
    
    // Should have file upload interface
    await expect(page.locator('input[type="file"]')).toBeAttached();
  });

  test('all pages should have proper page structure', async ({ page }) => {
    const pages = ['/trim', '/merge', '/resize'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Each page should have basic HTML structure
      await expect(page.locator('html')).toBeAttached();
      await expect(page.locator('head')).toBeAttached();
      await expect(page.locator('body')).toBeAttached();
      await expect(page.locator('main')).toBeAttached();
      
      // Should have at least one heading
      await expect(page.locator('h1, h2, h3')).toHaveCount.greaterThan(0);
    }
  });
});