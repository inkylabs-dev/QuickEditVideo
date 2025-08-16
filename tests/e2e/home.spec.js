import { test, expect } from '@playwright/test';

test.describe('Home page - E2E', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads with correct title
    await expect(page).toHaveTitle(/QuickEditVideo - Free Online Video Editor/);
    
    // Check basic page structure
    await expect(page.locator('h1')).toContainText('Edit Faster, Ready in Minutes');
    await expect(page.locator('h1')).toContainText('QuickEditVideo.com');
  });

  test('should navigate to trim page via Start editing button', async ({ page }) => {
    await page.goto('/');
    
    // Check that hero section is displayed
    await expect(page.locator('text=Trim, convert, and compress videos instantly')).toBeVisible();
    await expect(page.locator('text=No downloads, no accounts')).toBeVisible();
    
    // Find the "Start editing" button and verify navigation
    const startEditingButton = page.locator('a', { hasText: 'Start editing' });
    await expect(startEditingButton).toBeVisible();
    await expect(startEditingButton).toHaveAttribute('href', '/trim');
    
    // Click the button and verify navigation to trim page
    await startEditingButton.click();
    await expect(page).toHaveURL('/trim');
    await expect(page).toHaveTitle(/Video Trimmer - Cut & Trim Videos Online Free/);
  });
});